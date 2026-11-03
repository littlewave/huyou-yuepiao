import { describe, expect, it } from "vitest";
import { DEFAULT_CONDITIONS } from "./constants";
import { citedEvidence, factCheck, questCounts, questsByEra, questsByTopic, questsForLens, questsForToday, questsIn, relatedQuests, trailStops } from "./quests";
import type { Evidence, Quest } from "./types";

const q = (over: Partial<Quest>): Quest => ({
  id: "q", question: "？", why: "", background: [], tasks: ["t"], lookFor: ["l"], further: [], areaId: "a", placeIds: [], scope: "s",
  lat: 31, lng: 121, topics: ["ecology/rivers"], minutes: 30, setting: "outdoor", daylight: true, difficulty: 1,
  kid9: "", kid16: "", access: { transit: "", stepFree: null }, evidence: [], checkedAt: null, ...over,
});

describe("questsIn", () => {
  const river = q({ id: "river", minutes: 60, checkedAt: "2026-11-03" });
  const market = q({ id: "market", topics: ["food/markets"], minutes: 20 });
  const both = q({ id: "both", topics: ["ecology/wetland", "food/markets"], minutes: 10, checkedAt: "2026-11-03" });

  it("filters by Domain and puts checked Quests first, then shortest", () => {
    expect(questsIn([river, market, both], null).map((x) => x.id)).toEqual(["both", "river", "market"]);
    expect(questsIn([river, market, both], "food").map((x) => x.id)).toEqual(["both", "market"]);
  });

  it("counts a Quest once per Domain", () => {
    expect(questCounts([river, both])).toEqual({ ecology: 2, food: 1 });
  });
});

describe("factCheck", () => {
  const ev = new Map<string, Evidence>([
    ["a", { id: "a", claim: "", sources: [{ kind: "gov", name: "G", url: "https://g", date: "2025-01" }], checkedAt: "2026-11-03", checkedBy: "ai" }],
    ["b", { id: "b", claim: "", sources: [{ kind: "news", name: "N", url: "https://n", date: "2021-01" }], checkedAt: null, disputed: "x" }],
  ]);
  const quest = q({ background: [{ text: "", evidence: ["b"] }], evidence: ["a", "b"] });

  it("cites background Evidence first, without duplicates", () => {
    expect(citedEvidence(quest)).toEqual(["b", "a"]);
  });

  it("tallies checked, AI-only and disputed Evidence and pools the Sources", () => {
    expect(factCheck(quest, ev)).toMatchObject({ total: 2, checked: 1, aiOnly: 1, disputed: 1 });
    expect(factCheck(quest, ev).sources).toHaveLength(2);
  });
});

describe("questsForToday", () => {
  const base = { id: "b", name: "B", lat: 31.24, lng: 121.5 };
  const at = (km: number) => ({ lat: 31.24 + km / 111, lng: 121.5 });
  const qs = [
    q({ id: "port1", topics: ["infrastructure/port"], ...at(1) }),
    q({ id: "port2", topics: ["infrastructure/water"], ...at(2) }),
    q({ id: "market", topics: ["food/markets", "infrastructure/port"], ...at(3), setting: "indoor" }),
    q({ id: "far", topics: ["ecology/rivers"], ...at(40) }),
    q({ id: "long", topics: ["culture/film"], ...at(1), minutes: 400 }),
  ];
  const c = { ...DEFAULT_CONDITIONS, time: "half" as const, maxKm: 15 };

  it("keeps what fits the time and distance, nearest first, one per lead Domain before repeating", () => {
    const r = questsForToday(qs, c, base, { limit: 2 });
    expect(r.total).toBe(3);
    expect(r.picks.map((x) => x.quest.id)).toEqual(["port1", "market"]);
  });

  it("fills up with repeats when Domains run out", () => {
    expect(questsForToday(qs, c, base, { limit: 3 }).picks.map((x) => x.quest.id)).toEqual(["port1", "market", "port2"]);
  });

  it("drops done Quests and lifts untouched Domains and Areas, saying why", () => {
    const T = "2026-12-05T10:00:00.000Z";
    const obs = { port1: { note: "", found: [], doneOn: "2026-12-05", updatedAt: T } };
    const r = questsForToday(qs, c, base, { observations: obs });
    expect(r.total).toBe(2);
    // port1 is done: infrastructure is touched, so market (food, new) jumps ahead of port2 despite being farther.
    expect(r.picks.map((x) => x.quest.id)).toEqual(["market", "port2"]);
    expect(r.picks[0]!.reasons[0]).toContain("饮食文化与商业生态");
  });

  it("sinks Quests whose Evidence is not checked", () => {
    const ev = new Map([["e", { id: "e", claim: "", sources: [], checkedAt: null }]]);
    const near = q({ id: "near", topics: ["culture/film"], ...at(1), evidence: ["e"] });
    const farther = q({ id: "farther", topics: ["culture/film"], ...at(2.5) });
    expect(questsForToday([near, farther], c, base, { evidence: ev }).picks.map((x) => x.quest.id)).toEqual(["farther", "near"]);
  });

  it("honours rain and chosen Domains", () => {
    expect(questsForToday(qs, { ...c, rainSafe: true }, base).picks.map((x) => x.quest.id)).toEqual(["market"]);
    expect(questsForToday(qs, { ...c, domains: ["food"] }, base).picks.map((x) => x.quest.id)).toEqual(["market"]);
  });
});

describe("knowledge links", () => {
  const a = q({ id: "a", areaId: "x", topics: ["infrastructure/water", "layers/palimpsest"], eras: ["treaty-port"] });
  const sameTopic = q({ id: "sameTopic", areaId: "y", topics: ["infrastructure/water"] });
  const sameArea = q({ id: "sameArea", areaId: "x", topics: ["food/markets"] });
  const sameDomainArea = q({ id: "sameDomainArea", areaId: "x", topics: ["infrastructure/port"], eras: ["treaty-port"] });
  const stranger = q({ id: "stranger", areaId: "z", topics: ["culture/film"] });
  const all = [a, sameTopic, sameArea, sameDomainArea, stranger];

  it("ranks by shared Topics, then Domain, Area and Era, and drops weak links", () => {
    expect(relatedQuests(a, all).map((x) => x.id)).toEqual(["sameDomainArea", "sameTopic"]);
  });

  it("groups by Era in timeline order and by Topic within a Domain", () => {
    const b = q({ id: "b", topics: ["infrastructure/water/pier"], eras: ["jiangnan", "treaty-port"] });
    expect(questsByEra([a, b]).map((g) => [g.era, g.quests.map((x) => x.id)])).toEqual([["jiangnan", ["b"]], ["treaty-port", ["a", "b"]]]);
    expect(questsByTopic([a, b, sameDomainArea], "infrastructure").map((g) => [g.topic, g.quests.length])).toEqual([["infrastructure/port", 1], ["infrastructure/water", 2]]);
  });

  it("orders a Lens's Quests by how many of its Domains they touch", () => {
    // engineer leans on infrastructure, economy, ecology
    const both = q({ id: "both", topics: ["infrastructure/port", "economy/trade"] });
    expect(questsForLens([sameTopic, both, stranger], "engineer").map((x) => x.id)).toEqual(["both", "sameTopic"]);
  });

  it("finds a Quest's place on each Trail", () => {
    const t = { id: "t", title: "T", question: "?", areaId: "x", questIds: ["sameArea", "a", "stranger"], minutes: 60 };
    expect(trailStops(a, [t])).toEqual([{ trail: t, index: 1, prev: "sameArea", next: "stranger" }]);
    expect(trailStops(sameTopic, [t])).toEqual([]);
  });
});
