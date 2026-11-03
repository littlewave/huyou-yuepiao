import { TIME_LIMIT } from "./constants";
import { distanceKm } from "./geo";
import { DOMAINS, ERAS, LENSES, domainOf, domainsOf, type DomainId, type EraId, type LensId, type TopicId } from "./taxonomy";
import { coverage, touchedDomains } from "./coverage";
import type { Base, Conditions, Evidence, Observation, Quest, Review, Source, Trail } from "./types";

/** Quests touching a Domain (all when null), checked ones first, then shortest. */
export function questsIn(quests: Quest[], domain: DomainId | null): Quest[] {
  return quests
    .filter((q) => domain === null || domainsOf(q.topics).includes(domain))
    .sort((a, b) => Number(!a.checkedAt) - Number(!b.checkedAt) || a.minutes - b.minutes);
}

export function questCounts(quests: Quest[]): Record<DomainId, number> {
  const out = {} as Record<DomainId, number>;
  for (const q of quests) for (const d of domainsOf(q.topics)) out[d] = (out[d] ?? 0) + 1;
  return out;
}

/** Every Evidence id a Quest cites, in first-cited order: background first, then the rest. */
export function citedEvidence(q: Quest): string[] {
  return [...new Set([...q.background.flatMap((b) => b.evidence), ...q.evidence])];
}

export interface FactCheck {
  total: number;
  /** Checked against a source by anyone: in the data, or by the owner's ok on this phone. */
  checked: number;
  /** Checked only by the research assistant, with no owner confirmation yet. */
  aiOnly: number;
  disputed: number;
  /** Evidence the owner flagged as not matching its source. */
  problems: number;
  /** All Sources behind the Quest, for Signal strength and freshness. */
  sources: Source[];
}

export function factCheck(q: Quest, evidence: Map<string, Evidence>, reviews: Record<string, Review> = {}): FactCheck {
  const es = citedEvidence(q)
    .map((id) => evidence.get(id))
    .filter((e): e is Evidence => !!e);
  const ok = (e: Evidence) => reviews[e.id]?.verdict === "ok";
  return {
    total: es.length,
    checked: es.filter((e) => e.checkedAt || ok(e)).length,
    aiOnly: es.filter((e) => e.checkedAt && e.checkedBy === "ai" && !ok(e)).length,
    disputed: es.filter((e) => e.disputed).length,
    problems: es.filter((e) => reviews[e.id]?.verdict === "problem").length,
    sources: es.flatMap((e) => e.sources),
  };
}

export interface TodayPick {
  quest: Quest;
  km: number;
  /** Why it was picked, most telling first: 新领域, 新区域, distance. */
  reasons: string[];
}

export interface TodayQuests {
  /** At most `limit` Quests, best first, each leading with a different Domain while that is possible. */
  picks: TodayPick[];
  /** Every open Quest that fits today's Conditions. */
  total: number;
}

export interface TodayOptions {
  limit?: number;
  /** The Pass's Observations: done Quests drop out, untouched Domains and Areas get a lift. */
  observations?: Record<string, Observation>;
  /** For credibility: Quests whose Evidence is not all checked sink a little. */
  evidence?: Map<string, Evidence>;
  /** The owner's verdicts: an ok counts as checked; a problem sinks the Quest like unchecked Evidence. */
  reviews?: Record<string, Review>;
}

/**
 * Quests that fit today's Conditions (time, distance, rain, chosen Domains), ranked by an effective distance:
 * straight-line km, minus 3 km for a Domain the family has not touched, minus 1.5 km for an untouched Area,
 * plus up to 2 km when its Evidence is not all checked. Done Quests are left out. Popularity is never an input.
 * Then the picks are spread across lead Domains, filling up with repeats only when Domains run out.
 */
export function questsForToday(quests: Quest[], c: Conditions, base: Base, opts: TodayOptions = {}): TodayQuests {
  const { limit = 3, observations = {}, evidence, reviews } = opts;
  const cov = coverage(quests, observations);
  const seenDomains = touchedDomains(cov);
  const seenAreas = new Set(cov.areas.filter((a) => a.touched > 0).map((a) => a.areaId));
  const anyTouched = cov.touched > 0;
  const fit = quests
    .filter((q) => !observations[q.id]?.doneOn)
    .filter((q) => q.minutes <= TIME_LIMIT[c.time] * 60)
    .filter((q) => !c.rainSafe || q.setting === "indoor")
    .filter((q) => c.domains.length === 0 || domainsOf(q.topics).some((d) => c.domains.includes(d)))
    .map((quest) => {
      const km = distanceKm(base, quest);
      const lead = domainOf(quest.topics[0]!);
      const newDomain = anyTouched && !seenDomains.has(lead);
      const newArea = anyTouched && !seenAreas.has(quest.areaId);
      const fc = evidence ? factCheck(quest, evidence, reviews) : undefined;
      const unchecked = fc && fc.total ? Math.min(1, (fc.total - fc.checked + fc.problems) / fc.total) : 0;
      const reasons = [
        ...(newDomain ? [`你们还没碰过「${DOMAINS.find((d) => d.id === lead)!.label}」`] : []),
        ...(newArea ? ["一个还没去过的区域"] : []),
      ];
      return { quest, km, reasons, score: km - (newDomain ? 3 : 0) - (newArea ? 1.5 : 0) + 2 * unchecked };
    })
    .filter((x) => c.maxKm === null || x.km <= c.maxKm)
    .sort((a, b) => a.score - b.score);
  const picks: TodayPick[] = [];
  const seen = new Set<DomainId>();
  for (const x of fit) {
    if (picks.length === limit) break;
    const lead = domainOf(x.quest.topics[0]!);
    if (seen.has(lead)) continue;
    seen.add(lead);
    picks.push(x);
  }
  for (const x of fit) {
    if (picks.length === limit) break;
    if (!picks.includes(x)) picks.push(x);
  }
  return { picks: picks.map(({ quest, km, reasons }) => ({ quest, km, reasons })), total: fit.length };
}

/**
 * Quests that share knowledge with `q`, strongest first: two points per shared Topic,
 * one per shared Domain beyond those, one for the same Area, one per shared Era. Ties go to the nearer Quest.
 */
export function relatedQuests(q: Quest, quests: Quest[], limit = 3): Quest[] {
  const topics = new Set(q.topics);
  const domains = new Set(domainsOf(q.topics));
  const eras = new Set(q.eras ?? []);
  return quests
    .filter((x) => x.id !== q.id)
    .map((x) => {
      const sharedTopics = x.topics.filter((t) => topics.has(t)).length;
      const sharedDomains = domainsOf(x.topics).filter((d) => domains.has(d)).length;
      const score =
        2 * sharedTopics +
        Math.max(0, sharedDomains - sharedTopics) +
        (x.areaId === q.areaId ? 1 : 0) +
        (x.eras ?? []).filter((e) => eras.has(e)).length;
      return { x, score, km: distanceKm(q, x) };
    })
    .filter((r) => r.score >= 2)
    .sort((a, b) => b.score - a.score || a.km - b.km)
    .slice(0, limit)
    .map((r) => r.x);
}

/** Quests per Era in timeline order; a Quest spanning several Eras appears under each. Undated Quests are left out. */
export function questsByEra(quests: Quest[]): { era: EraId; quests: Quest[] }[] {
  return ERAS.map((e) => ({ era: e.id, quests: quests.filter((q) => q.eras?.includes(e.id)) })).filter((g) => g.quests.length);
}

/** Quests in one Domain, grouped by Topic in taxonomy order. */
export function questsByTopic(quests: Quest[], domain: DomainId): { topic: TopicId; quests: Quest[] }[] {
  const d = DOMAINS.find((x) => x.id === domain)!;
  return d.topics
    .map((t) => {
      const id = `${domain}/${t.id}` as TopicId;
      return { topic: id, quests: quests.filter((q) => q.topics.some((x) => x === id || x.startsWith(`${id}/`))) };
    })
    .filter((g) => g.quests.length);
}

/** Quests a Lens speaks to, strongest match first (how many of its Domains a Quest touches). */
export function questsForLens(quests: Quest[], lens: LensId): Quest[] {
  const ds = LENSES.find((l) => l.id === lens)!.domains;
  return quests
    .map((q) => ({ q, n: domainsOf(q.topics).filter((d) => ds.includes(d)).length }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n)
    .map((r) => r.q);
}

/** Every Trail a Quest is on, with its stop number and neighbours. */
export function trailStops(q: Quest, trails: Trail[]): { trail: Trail; index: number; prev?: string; next?: string }[] {
  return trails.flatMap((trail) => {
    const index = trail.questIds.indexOf(q.id);
    return index < 0 ? [] : [{ trail, index, prev: trail.questIds[index - 1], next: trail.questIds[index + 1] }];
  });
}
