import { TIME_LIMIT } from "./constants";
import { distanceKm } from "./geo";
import { DOMAINS, domainsOf, type DomainId } from "./taxonomy";
import type { Base, Conditions, Mark, Place } from "./types";

export interface Slip {
  place: Place;
  km: number;
  mark?: Mark;
}

export interface Selection {
  /**
   * Places meeting today's Conditions that are not Punched or Excluded: Shortlist, then Revisit, then Clue, then nearest,
   * except that the first three slots are spread across lead Domains where the marks leave room.
   */
  candidates: Slip[];
  /** Punched or Excluded Places that would otherwise meet the Conditions. They stay visible, stamped. */
  stamped: Slip[];
  /** Candidates per Domain under every Condition except the Domain choice itself. */
  domainCounts: Record<DomainId, number>;
}

export function selectCandidates(
  places: Place[],
  conditions: Conditions,
  base: Base,
  marks: Record<string, Mark>,
): Selection {
  const domainCounts = Object.fromEntries(DOMAINS.map((d) => [d.id, 0])) as Record<DomainId, number>;
  const candidates: Slip[] = [];
  const stamped: Slip[] = [];

  for (const place of places) {
    const km = distanceKm(base, place);
    if (place.hours > TIME_LIMIT[conditions.time]) continue;
    if (conditions.maxKm !== null && km > conditions.maxKm) continue;
    if (conditions.rainSafe && place.setting !== "indoor") continue;

    const mark = marks[place.id];
    const open = mark?.state !== "punched" && mark?.state !== "dismissed";
    const domains = domainsOf(place.topics);
    if (open) for (const d of domains) domainCounts[d]++;

    const domainOk = conditions.domains.length === 0 || domains.some((d) => conditions.domains.includes(d));
    if (!domainOk) continue;
    (open ? candidates : stamped).push({ place, km, mark });
  }

  candidates.sort((a, b) => rank(a) - rank(b) || a.km - b.km);
  spreadTop(candidates, 3);
  stamped.sort((a, b) => a.km - b.km);
  return { candidates, stamped, domainCounts };
}

/**
 * Reorder the unmarked Candidates so the first `n` slots lead with different Domains, nearest first,
 * so three museums of the same kind never fill the top of the list. Marked Candidates keep their places.
 */
function spreadTop(list: Slip[], n: number): void {
  const marked = list.filter((x) => rank(x) < 3).length;
  if (marked >= n) return;
  const rest = list.slice(marked);
  const lead = (x: Slip) => domainsOf(x.place.topics)[0];
  const seen = new Set(list.slice(0, marked).map(lead));
  const top: Slip[] = [];
  for (const x of rest) {
    if (top.length === n - marked) break;
    if (seen.has(lead(x))) continue;
    seen.add(lead(x));
    top.push(x);
  }
  list.splice(marked, rest.length, ...top, ...rest.filter((x) => !top.includes(x)));
}

const RANK: Record<string, number> = { shortlist: 0, revisit: 1, clue: 2 };
const rank = (s: Slip) => RANK[s.mark?.state ?? ""] ?? 3;

export function surprisePick(candidates: Slip[], random: () => number = Math.random): Slip | undefined {
  return candidates[Math.floor(random() * candidates.length)];
}
