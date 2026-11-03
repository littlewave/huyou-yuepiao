import { assessSignal } from "./signal";
import { DOMAINS, ERAS, domainsOf, type DomainId, type EraId } from "./taxonomy";
import { eventState, venueState, type VenueState } from "./now";
import type { Culture, CultureEvent, Evidence, Place, Quest, Review, Trend, Venue } from "./types";

export type Issue =
  | "owner-problem"
  | "unchecked"
  | "disputed"
  | "stale"
  | "undated"
  | "anonymous-only"
  | "ai-only"
  | "owner-ok-unrecorded";

/** Plain-language labels, worst first; the order is the triage order. */
export const ISSUE_LABEL: Record<Issue, string> = {
  "owner-problem": "you flagged it: the source doesn't match",
  unchecked: "never read against its source",
  disputed: "sources disagree",
  stale: "describes a current state, and the newest dated source is over two years old",
  undated: "no source carries a date",
  "anonymous-only": "only anonymous or wiki sources",
  "ai-only": "read by the assistant only; waiting for your check",
  "owner-ok-unrecorded": "you checked it on the phone; set checkedBy to owner in evidence.json",
};
const ORDER = Object.keys(ISSUE_LABEL) as Issue[];

export interface AuditItem {
  evidence: Evidence;
  issues: Issue[];
  /** Quests that cite it, so a fix reaches every place it shows. */
  quests: string[];
}

export interface Audit {
  items: AuditItem[];
  /** Domains with fewer than `thinDomain` Quests, and Eras with none. */
  thinDomains: { domain: DomainId; quests: number }[];
  emptyEras: EraId[];
  unverifiedPlaces: number;
}

/**
 * Everything in the knowledge base that needs a person before the trip, worst first.
 * `reviews` are the owner's verdicts exported from the phone's Pass.
 */
export function auditKnowledge(
  data: { quests: Quest[]; evidence: Evidence[]; places: Place[] },
  today: string,
  reviews: Record<string, Review> = {},
  thinDomain = 5,
): Audit {
  const items = data.evidence
    .map((e) => {
      const sig = assessSignal(e.sources, null, today);
      const review = reviews[e.id]?.verdict;
      const issues: Issue[] = [];
      if (review === "problem") issues.push("owner-problem");
      if (!e.checkedAt && review !== "ok") issues.push("unchecked");
      if (e.disputed) issues.push("disputed");
      if (e.volatile && sig.freshness === "stale") issues.push("stale");
      if (sig.freshness === "unknown") issues.push("undated");
      if (sig.strength === "anonymous") issues.push("anonymous-only");
      if (e.checkedBy === "ai" && !review) issues.push("ai-only");
      if (review === "ok" && e.checkedBy !== "owner") issues.push("owner-ok-unrecorded");
      const quests = data.quests.filter((q) => q.evidence.includes(e.id) || q.background.some((b) => b.evidence.includes(e.id))).map((q) => q.id);
      return { evidence: e, issues: issues.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)), quests };
    })
    .filter((x) => x.issues.length)
    .sort((a, b) => ORDER.indexOf(a.issues[0]!) - ORDER.indexOf(b.issues[0]!) || b.quests.length - a.quests.length);

  const perDomain = Object.fromEntries(DOMAINS.map((d) => [d.id, 0])) as Record<DomainId, number>;
  for (const q of data.quests) for (const d of domainsOf(q.topics)) perDomain[d]++;
  return {
    items,
    thinDomains: DOMAINS.filter((d) => perDomain[d.id] < thinDomain).map((d) => ({ domain: d.id, quests: perDomain[d.id] })),
    emptyEras: ERAS.filter((e) => !data.quests.some((q) => q.eras?.includes(e.id))).map((e) => e.id),
    unverifiedPlaces: data.places.filter((p) => !p.verifiedAt).length,
  };
}

/** The audit as a Markdown report for the terminal or a file. */
export function auditMarkdown(a: Audit, today: string): string {
  const count = (i: Issue) => a.items.filter((x) => x.issues.includes(i)).length;
  const lines = [
    `# Knowledge audit, ${today}`,
    "",
    "## Summary",
    "",
    ...ORDER.filter(count).map((i) => `- ${count(i)} Evidence: ${ISSUE_LABEL[i]}`),
    `- ${a.unverifiedPlaces} Places not yet verified (open, booking) on a live source`,
    `- Thin Domains (< 5 Quests): ${a.thinDomains.map((d) => `${DOMAINS.find((x) => x.id === d.domain)!.label} ${d.quests}`).join(", ") || "none"}`,
    `- Eras with no Quest: ${a.emptyEras.map((e) => ERAS.find((x) => x.id === e)!.label).join(", ") || "none"}`,
    "",
    "## Evidence to look at, worst first",
    "",
  ];
  for (const x of a.items) {
    lines.push(`### ${x.evidence.id}`, "", `> ${x.evidence.claim}`, "");
    for (const i of x.issues) lines.push(`- ${ISSUE_LABEL[i]}`);
    if (x.evidence.disputed) lines.push(`- disagreement: ${x.evidence.disputed}`);
    for (const s of x.evidence.sources) lines.push(`- source: [${s.name}](${s.url ?? ""}) ${s.date ?? "undated"}`);
    lines.push(`- cited by: ${x.quests.join(", ") || "no Quest"}`, "");
  }
  return lines.join("\n");
}

// ── Shanghai Now ─────────────────────────────────────────────────────────

export interface NowAudit {
  /** Events still listed but needing a person: unconfirmed, or weekly past `validUntil`. */
  events: { event: CultureEvent; why: string }[];
  /** Events that ended and can be archived from the data file. */
  ended: CultureEvent[];
  /** Venues the app now shows as 待确认 or 已关闭. */
  venues: { venue: Venue; state: VenueState }[];
  /** Trends resting on a single named source. */
  thinTrends: Trend[];
  /** Cultures with no active Venue. */
  emptyCultures: Culture[];
  /** Active Venues with no coordinates, or only street-level ones. */
  unlocated: { venue: Venue; why: "none" | "street" }[];
}

export function auditNow(d: { cultures: Culture[]; venues: Venue[]; events: CultureEvent[]; trends: Trend[] }, today: string): NowAudit {
  const events: NowAudit["events"] = [];
  const ended: CultureEvent[] = [];
  for (const e of d.events) {
    const st = eventState(e, today);
    if (st === "ended" || st === "cancelled") ended.push(e);
    else if (st === "unconfirmed") events.push({ event: e, why: e.weekly && e.validUntil && e.validUntil < today ? `weekly, last confirmed until ${e.validUntil}` : e.datePrecision === "month" ? "the source names only the month; find the days" : "not confirmed by a source yet" });
  }
  const venues = d.venues.map((venue) => ({ venue, state: venueState(venue, today) })).filter((x) => x.state !== "active");
  return {
    events,
    ended,
    venues,
    thinTrends: d.trends.filter((t) => assessSignal(t.sources, null, today).strength !== "cross"),
    unlocated: d.venues
      .filter((v) => venueState(v, today) === "active" && (!v.geo || v.geo.precision === "street") && v.kind !== "project")
      .map((venue) => ({ venue, why: venue.geo ? ("street" as const) : ("none" as const) })),
    emptyCultures: d.cultures.filter((c) => !c.mergedInto && !d.venues.some((v) => v.cultureIds.includes(c.id) && venueState(v, today) === "active")),
  };
}

export function auditNowMarkdown(a: NowAudit): string {
  const lines = ["", "# Shanghai Now", ""];
  lines.push(`## Events to re-confirm (${a.events.length})`, "");
  for (const x of a.events) lines.push(`- **${x.event.id}** ${x.event.title}: ${x.why}. ${x.event.sources.map((s) => s.url).join(" ")}`);
  lines.push("", `## Ended, can be archived (${a.ended.length})`, "");
  for (const e of a.ended) lines.push(`- ${e.id} (${e.end ?? e.start})`);
  lines.push("", `## Venues shown as 待确认 or closed (${a.venues.length})`, "");
  for (const x of a.venues) lines.push(`- **${x.venue.id}** ${x.venue.name}: ${x.state}, last seen ${x.venue.lastSeen ?? "never"}`);
  lines.push("", `## Trends on a single source (${a.thinTrends.length})`, "");
  for (const t of a.thinTrends) lines.push(`- ${t.id} ${t.title}`);
  lines.push("", `## Cultures with no active Venue (${a.emptyCultures.length})`, "");
  for (const c of a.emptyCultures) lines.push(`- ${c.id} ${c.label}`);
  lines.push("", `## Active Venues to locate on 高德 (${a.unlocated.length})`, "");
  for (const x of a.unlocated) lines.push(`- ${x.venue.id} ${x.venue.name}: ${x.why === "none" ? "no coordinates" : "street level only"} (${x.venue.area})`);
  return lines.join("\n");
}
