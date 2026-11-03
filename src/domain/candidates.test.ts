import { describe, expect, it } from "vitest";
import { selectCandidates, surprisePick } from "./candidates";
import { BASES, DEFAULT_CONDITIONS } from "./constants";
import type { Conditions, Place } from "./types";

const base = BASES[0]!; // 陆家嘴

const place = (over: Partial<Place>): Place => ({
  id: "p", name: "P", area: "浦东", areaId: "lujiazui", themes: ["art"], topics: ["culture/visual-art"], setting: "indoor", hours: 2,
  lat: base.lat, lng: base.lng, localReason: "r", kid9: "a", kid16: "b", booking: "none", verifiedAt: null, sources: [],
  ...over,
});

const near = place({ id: "near", themes: ["art"], topics: ["culture/visual-art"] });
const far = place({ id: "far", lat: 30.91, lng: 121.907, hours: 6, themes: ["science"], topics: ["culture/science"] }); // 临港
const outdoor = place({ id: "outdoor", setting: "outdoor", themes: ["walk"], topics: ["fabric/street"], lat: 31.25 });
const all = [near, far, outdoor];
const cond = (over: Partial<Conditions>): Conditions => ({ ...DEFAULT_CONDITIONS, ...over });

describe("selectCandidates", () => {
  it("drops Places over the time budget and beyond the distance", () => {
    const ids = selectCandidates(all, cond({ time: "half", maxKm: 15 }), base, {}).candidates.map((s) => s.place.id);
    expect(ids).toEqual(["near", "outdoor"]);
  });

  it("keeps far, long Places when the day and distance are open", () => {
    const ids = selectCandidates(all, cond({ time: "day", maxKm: null }), base, {}).candidates.map((s) => s.place.id);
    expect(ids).toContain("far");
  });

  it("rain-safe keeps only indoor Places", () => {
    const ids = selectCandidates(all, cond({ rainSafe: true }), base, {}).candidates.map((s) => s.place.id);
    expect(ids).toEqual(["near"]);
  });

  it("moves Punched and Dismissed Places to stamped instead of dropping them", () => {
    const sel = selectCandidates(all, cond({}), base, { near: { state: "punched", day: "2026-12-03" }, outdoor: { state: "dismissed" } });
    expect(sel.candidates).toEqual([]);
    expect(sel.stamped.map((s) => s.place.id).sort()).toEqual(["near", "outdoor"]);
  });

  it("puts Shortlisted Candidates first regardless of distance", () => {
    const ids = selectCandidates(all, cond({}), base, { outdoor: { state: "shortlist" } }).candidates.map((s) => s.place.id);
    expect(ids[0]).toBe("outdoor");
  });

  it("orders Shortlist, then Revisit, then Clue ahead of unmarked Candidates", () => {
    const four = [near, outdoor, place({ id: "c", lat: 31.24 }), place({ id: "d", lat: 31.241 })];
    const ids = selectCandidates(four, cond({}), base, {
      near: { state: "clue" },
      outdoor: { state: "revisit", day: "2026-12-02" },
      d: { state: "shortlist" },
    }).candidates.map((s) => s.place.id);
    expect(ids).toEqual(["d", "outdoor", "near", "c"]);
  });

  it("counts Domains ignoring the Domain choice but honouring the other Conditions", () => {
    const sel = selectCandidates(all, cond({ domains: ["fabric"] }), base, {});
    expect(sel.candidates.map((s) => s.place.id)).toEqual(["outdoor"]);
    expect(sel.domainCounts.culture).toBe(1); // near only; far is outside 15 km
  });
});

describe("Domain spread at the top", () => {
  const at = (km: number) => ({ lat: base.lat + km / 111, lng: base.lng });
  const art1 = place({ id: "art1", topics: ["culture/visual-art"], ...at(1) });
  const art2 = place({ id: "art2", topics: ["culture/film"], ...at(2) });
  const art3 = place({ id: "art3", topics: ["culture/publishing"], ...at(3) });
  const market = place({ id: "market", topics: ["food/markets"], ...at(4) });
  const river = place({ id: "river", topics: ["ecology/rivers"], ...at(5) });
  const list = [art1, art2, art3, market, river];

  it("fills the first three slots with different lead Domains, nearest first, then the rest by distance", () => {
    expect(selectCandidates(list, cond({ maxKm: 15 }), base, {}).candidates.map((s) => s.place.id)).toEqual(["art1", "market", "river", "art2", "art3"]);
  });

  it("keeps marked Candidates on top and spreads only the slots left", () => {
    const ids = selectCandidates(list, cond({ maxKm: 15 }), base, { art3: { state: "shortlist" } }).candidates.map((s) => s.place.id);
    expect(ids).toEqual(["art3", "market", "river", "art1", "art2"]);
  });
});

describe("surprisePick", () => {
  it("returns undefined when there is nothing to pick", () => {
    expect(surprisePick([])).toBeUndefined();
  });
});
