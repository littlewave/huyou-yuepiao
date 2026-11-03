import { isTopic } from "./taxonomy";
import type { Area, Evidence, Place, Quest, Trail } from "./types";

export interface Graph {
  places: Place[];
  areas: Area[];
  quests: Quest[];
  trails: Trail[];
  evidence: Evidence[];
}

const LINKED = new Set(["news", "gov", "reddit", "blog", "osm", "community", "guide"]);

/**
 * Every broken link and editorial-bar failure in the knowledge graph, as readable lines.
 * Empty means the data is consistent. The data tests assert on this; nothing at runtime calls it.
 */
export function checkGraph(g: Graph): string[] {
  const out: string[] = [];
  const ids = (xs: { id: string }[], kind: string) => {
    const seen = new Set<string>();
    for (const x of xs) {
      if (seen.has(x.id)) out.push(`${kind} ${x.id}: duplicate id`);
      seen.add(x.id);
    }
    return seen;
  };
  const areas = ids(g.areas, "area");
  const places = ids(g.places, "place");
  const quests = ids(g.quests, "quest");
  const evidence = new Map(g.evidence.map((e) => [e.id, e]));
  ids(g.evidence, "evidence");
  ids(g.trails, "trail");

  for (const p of g.places) {
    if (!areas.has(p.areaId)) out.push(`place ${p.id}: unknown area ${p.areaId}`);
    if (p.topics.length === 0) out.push(`place ${p.id}: no topics`);
    for (const t of p.topics) if (!isTopic(t)) out.push(`place ${p.id}: unknown topic ${t}`);
  }

  for (const e of g.evidence) {
    if (e.sources.length === 0) out.push(`evidence ${e.id}: no sources`);
    for (const s of e.sources)
      if (LINKED.has(s.kind) && !s.url?.startsWith("https://")) out.push(`evidence ${e.id}: ${s.name} has no https link`);
    if (e.checkedAt && !e.checkedBy) out.push(`evidence ${e.id}: checked by whom?`);
    if (e.checkedAt && e.sources.every((s) => s.kind === "model" || s.kind === "editorial"))
      out.push(`evidence ${e.id}: checked against no outside source`);
  }

  for (const q of g.quests) {
    const at = `quest ${q.id}`;
    if (!/[？?]$/.test(q.question)) out.push(`${at}: question is not a question`);
    if (!areas.has(q.areaId)) out.push(`${at}: unknown area ${q.areaId}`);
    for (const p of q.placeIds) if (!places.has(p)) out.push(`${at}: unknown place ${p}`);
    if (q.placeIds.length === 0 && !q.scope) out.push(`${at}: neither a Place nor a scope`);
    if (q.tasks.length === 0) out.push(`${at}: no tasks`);
    if (q.lookFor.length === 0) out.push(`${at}: nothing to look for`);
    if (q.topics.length === 0) out.push(`${at}: no topics`);
    for (const t of q.topics) if (!isTopic(t)) out.push(`${at}: unknown topic ${t}`);
    if (q.evidence.length === 0) out.push(`${at}: cites no evidence`);
    const cited = [...q.evidence, ...q.background.flatMap((b) => b.evidence)];
    for (const id of cited) if (!evidence.has(id)) out.push(`${at}: unknown evidence ${id}`);
    for (const b of q.background) if (b.evidence.length === 0) out.push(`${at}: background paragraph without evidence`);
    if (q.checkedAt && cited.some((id) => !evidence.get(id)?.checkedAt)) out.push(`${at}: checked but cites unchecked evidence`);
  }

  for (const t of g.trails) {
    if (!areas.has(t.areaId)) out.push(`trail ${t.id}: unknown area ${t.areaId}`);
    if (t.questIds.length < 2) out.push(`trail ${t.id}: fewer than two quests`);
    for (const q of t.questIds) if (!quests.has(q)) out.push(`trail ${t.id}: unknown quest ${q}`);
  }
  return out;
}
