import { describe, expect, it } from "vitest";
import { selectCandidates } from "../domain/candidates";
import { BASES, DEFAULT_CONDITIONS } from "../domain/constants";
import { coverage, touchedDomains } from "../domain/coverage";
import { toggleQuestDone, emptyPass } from "../domain/pass";
import { questsForToday } from "../domain/quests";
import { domainOf, domainsOf, type DomainId } from "../domain/taxonomy";
import type { Conditions, Evidence, Place, Quest, TimeBudget } from "../domain/types";
import evidenceRaw from "./evidence.json";
import placesRaw from "./places.json";
import questsRaw from "./quests.json";

// Recommendation quality on the real data: properties that must hold for every realistic morning,
// so a data edit or a ranking change that brings back a venue monopoly fails here.
const places = placesRaw as Place[];
const quests = questsRaw as Quest[];
const evidence = new Map((evidenceRaw as Evidence[]).map((e) => [e.id, e]));
const TIMES: TimeBudget[] = ["2h", "half", "day"];
const DISTANCES = [5, 15, 35, null];

const scenarios = BASES.flatMap((base) =>
  TIMES.flatMap((time) =>
    DISTANCES.flatMap((maxKm) => [false, true].map((rainSafe) => ({ base, c: { ...DEFAULT_CONDITIONS, time, maxKm, rainSafe } as Conditions }))),
  ),
);
const name = (s: (typeof scenarios)[number]) => `${s.base.id} ${s.c.time} ${s.c.maxKm ?? "any"}km${s.c.rainSafe ? " rain" : ""}`;

describe("today's Quests on real data", () => {
  it.each(scenarios.map((s) => [name(s), s] as const))("%s: picks lead with different Domains whenever the fit allows", (_, s) => {
    const all = questsForToday(quests, s.c, s.base, { evidence, limit: 1000 }).picks;
    const available = new Set(all.map((x) => domainOf(x.quest.topics[0]!))).size;
    const picks = questsForToday(quests, s.c, s.base, { evidence }).picks;
    const leads = new Set(picks.map((x) => domainOf(x.quest.topics[0]!)));
    expect(leads.size).toBe(Math.min(picks.length, available));
  });

  it("on rain days offers only indoor Quests, and says so honestly by offering fewer", () => {
    for (const s of scenarios.filter((x) => x.c.rainSafe)) {
      const r = questsForToday(quests, s.c, s.base, { evidence });
      for (const x of r.picks) expect(x.quest.setting).toBe("indoor");
      expect(r.total).toBeLessThanOrEqual(quests.filter((q) => q.setting === "indoor").length);
    }
  });

  it("across dry mornings, no Domain leads more than a quarter of all picks, and at least eight Domains lead somewhere", () => {
    const leads: DomainId[] = scenarios
      .filter((s) => !s.c.rainSafe)
      .flatMap((s) => questsForToday(quests, s.c, s.base, { evidence }).picks.map((x) => domainOf(x.quest.topics[0]!)));
    const counts = new Map<DomainId, number>();
    for (const d of leads) counts.set(d, (counts.get(d) ?? 0) + 1);
    expect(Math.max(...counts.values()) / leads.length).toBeLessThanOrEqual(1 / 4);
    expect(counts.size).toBeGreaterThanOrEqual(8);
  });

  it("a family doing the top pick every day for two weeks never repeats and touches most Domains", () => {
    let pass = emptyPass();
    const done: string[] = [];
    const c: Conditions = { ...DEFAULT_CONDITIONS, time: "day", maxKm: null };
    for (let day = 1; day <= 14; day++) {
      const top = questsForToday(quests, c, BASES[0]!, { evidence, observations: pass.observations }).picks[0]!;
      done.push(top.quest.id);
      pass = toggleQuestDone(pass, top.quest.id, `2026-12-${String(day).padStart(2, "0")}`, "t");
    }
    expect(new Set(done).size).toBe(14);
    expect(touchedDomains(coverage(quests, pass.observations)).size).toBeGreaterThanOrEqual(10);
  });
});

describe("today's Candidates on real data", () => {
  it.each(scenarios.filter((s) => !s.c.rainSafe).map((s) => [name(s), s] as const))(
    "%s: the first three Places lead with different Domains whenever the list allows",
    (_, s) => {
      const list = selectCandidates(places, s.c, s.base, {}).candidates;
      const available = new Set(list.map((x) => domainsOf(x.place.topics)[0])).size;
      const top = new Set(list.slice(0, 3).map((x) => domainsOf(x.place.topics)[0]));
      expect(top.size).toBe(Math.min(3, list.length, available));
    },
  );
});
