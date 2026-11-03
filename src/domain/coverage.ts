import { isTouched } from "./pass";
import { DOMAINS, ERAS, domainsOf, type DomainId, type EraId } from "./taxonomy";
import type { Observation, Quest } from "./types";

export interface Tally {
  touched: number;
  total: number;
}

export interface Coverage {
  domains: Record<DomainId, Tally>;
  eras: Record<EraId, Tally>;
  areas: { areaId: string; touched: number; total: number }[];
  touched: number;
  done: number;
  total: number;
}

/** Which Domains, Eras and Areas the family has touched through Quests, against what the Quests cover. */
export function coverage(quests: Quest[], observations: Record<string, Observation> = {}): Coverage {
  const domains = Object.fromEntries(DOMAINS.map((d) => [d.id, { touched: 0, total: 0 }])) as Record<DomainId, Tally>;
  const eras = Object.fromEntries(ERAS.map((e) => [e.id, { touched: 0, total: 0 }])) as Record<EraId, Tally>;
  const areas = new Map<string, Tally>();
  let touched = 0;
  let done = 0;
  for (const q of quests) {
    const t = isTouched(observations[q.id]) ? 1 : 0;
    touched += t;
    if (observations[q.id]?.doneOn) done++;
    for (const d of domainsOf(q.topics)) (domains[d].total++, (domains[d].touched += t));
    for (const e of q.eras ?? []) (eras[e].total++, (eras[e].touched += t));
    const a = areas.get(q.areaId) ?? { touched: 0, total: 0 };
    areas.set(q.areaId, { touched: a.touched + t, total: a.total + 1 });
  }
  return {
    domains,
    eras,
    areas: [...areas].map(([areaId, a]) => ({ areaId, ...a })),
    touched,
    done,
    total: quests.length,
  };
}

/** Domains the family has touched at least once. */
export const touchedDomains = (c: Coverage) => new Set(DOMAINS.map((d) => d.id).filter((d) => c.domains[d].touched > 0));
