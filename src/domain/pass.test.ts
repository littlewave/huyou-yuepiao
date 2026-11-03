import { describe, expect, it } from "vitest";
import { emptyPass, isTouched, setReview, parsePass, punchedDays, setExclusionReason, setNote, toggleFound, toggleMark, toggleQuestDone, tripDays } from "./pass";

describe("Pass", () => {
  it("punches with the Trip Day and un-punches on a second toggle", () => {
    const once = toggleMark(emptyPass(), "x", "punched", "2026-12-05");
    expect(once.marks.x).toEqual({ state: "punched", day: "2026-12-05" });
    expect(punchedDays(once)).toEqual(new Set(["2026-12-05"]));
    expect(toggleMark(once, "x", "punched", "2026-12-06").marks.x).toBeUndefined();
  });

  it("leaves the Trip Day unset when punching outside the trip window", () => {
    expect(toggleMark(emptyPass(), "x", "punched", "2026-10-28").marks.x).toEqual({ state: "punched" });
  });

  it("replaces a Shortlist with a Punch", () => {
    const p = toggleMark(toggleMark(emptyPass(), "x", "shortlist", "2026-12-01"), "x", "punched", "2026-12-02");
    expect(p.marks.x?.state).toBe("punched");
  });

  it("Revisit keeps the Trip Day of the Punch, and un-punching clears it", () => {
    const punched = toggleMark(emptyPass(), "x", "punched", "2026-12-05");
    const again = toggleMark(punched, "x", "revisit", "2026-12-09");
    expect(again.marks.x).toEqual({ state: "revisit", day: "2026-12-05" });
    expect(punchedDays(again)).toEqual(new Set(["2026-12-05"]));
    expect(toggleMark(again, "x", "revisit", "2026-12-09").marks.x).toEqual({ state: "punched", day: "2026-12-05" });
    expect(toggleMark(again, "x", "punched", "2026-12-09").marks.x).toBeUndefined();
  });

  it("records an Exclusion reason only on an Excluded mark", () => {
    const ex = toggleMark(emptyPass(), "x", "dismissed", "2026-12-01");
    expect(setExclusionReason(ex, "x", "commercial").marks.x).toEqual({ state: "dismissed", reason: "commercial" });
    expect(setExclusionReason(emptyPass(), "x", "commercial").marks.x).toBeUndefined();
  });

  it("lists every December Trip Day", () => {
    const days = tripDays({ start: "2026-12-01", end: "2026-12-31" });
    expect(days).toHaveLength(31);
    expect(days[30]).toBe("2026-12-31");
  });

  it("falls back to an empty Pass on malformed input", () => {
    expect(parsePass("{not json").marks).toEqual({});
    expect(parsePass('{"version":2}').marks).toEqual({});
  });
  it("drops the theme filter from Passes saved before Domains", () => {
    const old = JSON.stringify({ ...emptyPass(), conditions: { time: "2h", maxKm: 5, rainSafe: true, themes: ["art"] } });
    expect(parsePass(old).conditions).toEqual({ time: "2h", maxKm: 5, rainSafe: true, domains: [] });
  });
});

describe("Observations", () => {
  const T = "2026-12-05T10:00:00.000Z";
  it("records found items in order and a note, and marks a Quest done on a Trip Day", () => {
    let p = toggleFound(emptyPass(), "q", 2, T);
    p = toggleFound(p, "q", 0, T);
    p = setNote(p, "q", "钟还在", T);
    p = toggleQuestDone(p, "q", "2026-12-05", T);
    expect(p.observations!.q).toEqual({ note: "钟还在", found: [0, 2], doneOn: "2026-12-05", updatedAt: T });
    expect(isTouched(p.observations!.q)).toBe(true);
  });

  it("un-does each change and drops an Observation that ends up empty", () => {
    let p = toggleFound(emptyPass(), "q", 1, T);
    p = toggleQuestDone(p, "q", "2026-12-05", T);
    p = toggleQuestDone(p, "q", "2026-12-05", T);
    expect(p.observations!.q!.doneOn).toBeUndefined();
    p = toggleFound(p, "q", 1, T);
    expect(p.observations).toEqual({});
    expect(isTouched(undefined)).toBe(false);
  });

  it("travels with the Pass through export and import", () => {
    const p = setNote(emptyPass(), "q", "看到了", T);
    expect(parsePass(JSON.stringify(p)).observations).toEqual(p.observations);
  });
});

describe("Reviews", () => {
  it("records a verdict, switches it, and clears it on a repeat", () => {
    let p = setReview(emptyPass(), "e", "ok", "2026-11-20");
    expect(p.reviews).toEqual({ e: { verdict: "ok", on: "2026-11-20" } });
    p = setReview(p, "e", "problem", "2026-11-21");
    expect(p.reviews!.e!.verdict).toBe("problem");
    expect(setReview(p, "e", "problem", "2026-11-21").reviews).toEqual({});
  });
});
