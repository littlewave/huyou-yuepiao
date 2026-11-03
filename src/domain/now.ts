import { distanceKm } from "./geo";
import { assessSignal, type Signal } from "./signal";
import type { Culture, CultureEvent, CultureState, Pass, Quest, Trend, Venue } from "./types";

const DAY = 86_400_000;
const t = (iso: string) => Date.parse((iso.length === 7 ? `${iso}-15` : iso.length === 4 ? `${iso}-07-01` : iso) + "T00:00:00Z");
const addDays = (iso: string, n: number) => new Date(t(iso) + n * DAY).toISOString().slice(0, 10);
const monthsBetween = (from: string, to: string) => (t(to) - t(from)) / (30.4 * DAY);

/** Follow `mergedInto` to the Culture that now holds an id; unknown ids come back undefined. */
export function resolveCulture(id: string, cultures: Culture[]): Culture | undefined {
  const byId = new Map(cultures.map((c) => [c.id, c]));
  const seen = new Set<string>();
  let c = byId.get(id);
  while (c?.mergedInto && !seen.has(c.id)) {
    seen.add(c.id);
    c = byId.get(c.mergedInto);
  }
  return c;
}

/** Months after which a source no longer vouches that a Venue is still going, by kind. Public spaces don't go stale. */
const STALE_MONTHS: Record<Venue["kind"], number> = { business: 18, institution: 36, project: 24, public: Infinity };

export type VenueState = "active" | "unconfirmed" | "closed";

/** Whether to present a Venue as active today: closed stays closed, and an old `lastSeen` turns it 待确认. */
export function venueState(v: Venue, today: string): VenueState {
  if (v.status === "closed") return "closed";
  if (v.status === "unconfirmed" || !v.lastSeen) return "unconfirmed";
  return monthsBetween(v.lastSeen, today) > STALE_MONTHS[v.kind] ? "unconfirmed" : "active";
}

export type EventState = "upcoming" | "ongoing" | "unconfirmed" | "ended" | "cancelled";

export function eventState(e: CultureEvent, today: string): EventState {
  if (e.status === "cancelled") return "cancelled";
  if (e.status === "ended" || (e.end && e.end < today)) return "ended";
  if (e.weekly) return e.status === "confirmed" && (!e.validUntil || e.validUntil >= today) ? "ongoing" : "unconfirmed";
  if (e.status === "unconfirmed" || !e.checkedAt || e.datePrecision === "month") return "unconfirmed";
  return e.start > today ? "upcoming" : "ongoing";
}

export interface EventFilter {
  cultureIds?: string[];
  district?: string;
  freeOnly?: boolean;
}

export interface Listing {
  event: CultureEvent;
  state: EventState;
  /** The days inside the window it happens on (every matching weekday for weekly events). */
  days: string[];
}

/** District from an area like "徐汇 · 衡山路"; empty when the area doesn't start with one. */
export const districtOf = (area: string) => {
  const head = area.split(/\s*·\s*/)[0] ?? "";
  return /^[一-龥]{2,3}$/.test(head) ? head : "";
};

/**
 * Events happening between `from` and `to` (inclusive) that are still live today: ended and cancelled ones drop out
 * on their own, so the list never recommends something past. Sorted by first day, month-only ones last; 待确认 ones stay, labelled.
 */
export function eventsBetween(events: CultureEvent[], venues: Venue[], from: string, to: string, today: string, f: EventFilter = {}): Listing[] {
  const venue = new Map(venues.map((v) => [v.id, v]));
  const out: Listing[] = [];
  for (const e of events) {
    const state = eventState(e, today);
    if (state === "ended" || state === "cancelled") continue;
    if (f.cultureIds?.length && !e.cultureIds.some((c) => f.cultureIds!.includes(c))) continue;
    if (f.freeOnly && !e.price?.free) continue;
    const area = e.venueId ? venue.get(e.venueId)?.area : e.where;
    if (f.district && districtOf(area ?? "") !== f.district) continue;
    const start = e.start > from ? e.start : from;
    const end = e.end && e.end < to ? e.end : to;
    const days: string[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) {
      if (!e.weekly || e.weekly.includes(new Date(t(d)).getUTCDay())) days.push(d);
      if (!e.weekly && days.length) break;
    }
    if (days.length) out.push({ event: e, state, days });
  }
  // Dated Events by first day; month-only ones after them, since their real day is unknown.
  const monthOnly = (l: Listing) => Number(l.event.datePrecision === "month");
  return out.sort((a, b) => monthOnly(a) - monthOnly(b) || a.days[0]!.localeCompare(b.days[0]!));
}

/** A Trend's heat is its Signal: independent named sources and how recent they are. */
export const trendSignal = (tr: Trend, today: string): Signal => assessSignal(tr.sources, null, today);

export interface RadarRow {
  culture: Culture;
  trends: Trend[];
  active: number;
  pending: number;
  upcoming: number;
  /** Distinct named sources from the last 18 months across its facts, Venues and Trends. Not popularity. */
  evidence: number;
}

/** The strongest Trend signal behind a Culture, 0 when it has none. */
export const trendBars = (trs: Trend[], today: string) => Math.max(0, ...trs.map((tr) => trendSignal(tr, today).bars));

/** 潮流雷达: every live Culture with what we can show for it now: strongest Trend signal first, then by evidence. */
export function radar(cultures: Culture[], venues: Venue[], events: CultureEvent[], trends: Trend[], today: string): RadarRow[] {
  const in30 = addDays(today, 30);
  return cultures
    .filter((c) => !c.mergedInto)
    .map((culture) => {
      const vs = venues.filter((v) => v.cultureIds.includes(culture.id));
      const trs = trends.filter((tr) => tr.cultureIds.includes(culture.id));
      const recent = [...culture.facts.flatMap((f) => f.sources), ...vs.flatMap((v) => v.sources), ...trs.flatMap((tr) => tr.sources)]
        .filter((s) => s.date && monthsBetween(s.date, today) <= 18)
        .map((s) => s.name.replace(/[（(].*$/, "").replace(/：.*$/, ""));
      return {
        culture,
        trends: trs,
        active: vs.filter((v) => venueState(v, today) === "active").length,
        pending: vs.filter((v) => venueState(v, today) === "unconfirmed").length,
        upcoming: eventsBetween(events, venues, today, in30, today, { cultureIds: [culture.id] }).length,
        evidence: new Set(recent).size,
      };
    })
    .sort((a, b) => trendBars(b.trends, today) - trendBars(a.trends, today) || b.evidence - a.evidence || b.active - a.active);
}

export interface Suggestion {
  culture: Culture;
  via: { from: Culture; why: string }[];
}

/**
 * 兴趣扩散: Cultures next to the ones given (or, with none given, the ones the family loves or tried),
 * leaving out what they already tried or love. More links in first; a 喜欢 counts double.
 */
export function diffuse(cultures: Culture[], states: Record<string, CultureState> = {}, from?: string[]): Suggestion[] {
  const seeds = from ?? Object.keys(states).filter((id) => states[id] === "love" || states[id] === "tried");
  const done = new Set(Object.keys(states).filter((id) => states[id] !== "want"));
  const score = new Map<string, Suggestion & { w: number }>();
  for (const id of seeds) {
    const src = resolveCulture(id, cultures);
    if (!src) continue;
    for (const a of src.adjacent) {
      const target = resolveCulture(a.id, cultures);
      if (!target || target.id === src.id || seeds.includes(target.id) || done.has(target.id)) continue;
      const row = score.get(target.id) ?? { culture: target, via: [], w: 0 };
      row.via.push({ from: src, why: a.why });
      row.w += states[src.id] === "love" ? 2 : 1;
      score.set(target.id, row);
    }
  }
  return [...score.values()].sort((a, b) => b.w - a.w).map(({ culture, via }) => ({ culture, via }));
}

/** Cultures that continue a Quest into today: named on the Culture, or sharing the Quest's lead Topic. */
export function culturesForQuest(q: Quest, cultures: Culture[]): Culture[] {
  return cultures.filter((c) => !c.mergedInto && (c.questIds.includes(q.id) || c.topics.includes(q.topics[0]!)));
}

/** Quests that give a Culture its city-history background: named on it first, then ones leading with one of its Topics. */
export function questsForCulture(c: Culture, quests: Quest[], limit = 4): Quest[] {
  const named = c.questIds.map((id) => quests.find((q) => q.id === id)).filter((q): q is Quest => !!q);
  const byTopic = quests.filter((q) => !c.questIds.includes(q.id) && c.topics.includes(q.topics[0]!));
  return [...named, ...byTopic].slice(0, limit);
}

/** Set or clear how the family stands with a Culture; the same state again clears it. */
export function setCultureState(pass: Pass, id: string, state: CultureState): Pass {
  const all = { ...(pass.cultures ?? {}) };
  if (all[id] === state) delete all[id];
  else all[id] = state;
  return { ...pass, cultures: all };
}

export type DayStop = { kind: "quest"; quest: Quest } | { kind: "venue"; venue: Venue; culture: Culture };

export interface DayPlan {
  district: string;
  stops: DayStop[];
  /** Straight-line km from each stop to the next, null where either end has no coordinates. */
  legs: (number | null)[];
  length: "half" | "day";
  /** True when some stop is marked not for the 9-year-old; those stops come last. */
  adultsPart: boolean;
}

const notForKids = (v: Venue) => !!v.ageNote && /不适合/.test(v.ageNote);

const coordsOf = (s: DayStop): { lat: number; lng: number } | undefined => (s.kind === "quest" ? s.quest : s.venue.geo);

/**
 * Quest first, then kid-friendly Venues, then adults-only ones; inside each group, nearest-next from the previous
 * stop where coordinates exist. Stops without coordinates keep their place at the end of their group.
 */
function orderStops(first: DayStop | undefined, venues: DayStop[]): DayStop[] {
  const out: DayStop[] = first ? [first] : [];
  for (const group of [venues.filter((s) => s.kind === "venue" && !notForKids(s.venue)), venues.filter((s) => s.kind === "venue" && notForKids(s.venue))]) {
    const left = [...group];
    while (left.length) {
      const here = out.length ? coordsOf(out[out.length - 1]!) : undefined;
      const located = left.filter((s) => coordsOf(s));
      const next = here && located.length ? located.reduce((a, b) => (distanceKm(here, coordsOf(a)!) <= distanceKm(here, coordsOf(b)!) ? a : b)) : (located[0] ?? left[0]!);
      out.push(next);
      left.splice(left.indexOf(next), 1);
    }
  }
  return out;
}

/**
 * 潮流探索日: half-day or day plans inside one district, built from active Venues of this Culture, one Venue of a
 * neighbouring Culture, and a history Quest in the same district. Venues carry no coordinates, so the plan groups by
 * district rather than routing; adults-only stops go last so the family can split or stop early.
 */
export function planDays(
  c: Culture,
  d: { cultures: Culture[]; venues: Venue[]; quests: Quest[]; areaDistricts: Map<string, string> },
  today: string,
  limit = 2,
): DayPlan[] {
  const live = (v: Venue) => venueState(v, today) === "active" && districtOf(v.area) !== "";
  const neighbours = c.adjacent.map((a) => resolveCulture(a.id, d.cultures)).filter((x): x is Culture => !!x && x.id !== c.id);
  const main = d.venues.filter((v) => live(v) && v.cultureIds.includes(c.id));
  const side = d.venues.filter((v) => live(v) && !v.cultureIds.includes(c.id));
  const linked = questsForCulture(c, d.quests, 50);
  const plans: (DayPlan & { mainCount: number })[] = [];
  for (const district of [...new Set(main.map((v) => districtOf(v.area)))]) {
    const here = main.filter((v) => districtOf(v.area) === district).slice(0, 2);
    const next = neighbours
      .map((n) => ({ n, v: side.find((v) => districtOf(v.area) === district && v.cultureIds.includes(n.id)) }))
      .find((x) => x.v);
    if (here.length + (next ? 1 : 0) < 2) continue;
    const inDistrict = (q: Quest) => (d.areaDistricts.get(q.areaId) ?? "").split(/\s*\/\s*/).includes(district);
    const quest = linked.find(inDistrict) ?? d.quests.find((q) => inDistrict(q) && c.topics.some((t) => q.topics.includes(t)));
    const venues: DayStop[] = [
      ...here.map((venue) => ({ kind: "venue" as const, venue, culture: c })),
      ...(next ? [{ kind: "venue" as const, venue: next.v!, culture: next.n }] : []),
    ];
    const stops: DayStop[] = orderStops(quest ? { kind: "quest", quest } : undefined, venues);
    plans.push({
      district,
      stops,
      legs: stops.slice(1).map((s, i) => {
        const a = coordsOf(stops[i]!);
        const b = coordsOf(s);
        return a && b ? distanceKm(a, b) : null;
      }),
      length: stops.length >= 4 ? "day" : "half",
      adultsPart: venues.some((s) => s.kind === "venue" && notForKids(s.venue)),
      mainCount: here.length,
    });
  }
  return plans
    .sort((a, b) => b.mainCount - a.mainCount || b.stops.length - a.stops.length)
    .slice(0, limit)
    .map(({ mainCount: _m, ...p }) => p);
}
