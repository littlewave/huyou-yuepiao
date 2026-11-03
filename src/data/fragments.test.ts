import { describe, expect, it } from "vitest";
import type { Fragment, Place } from "../domain/types";
import fragRaw from "./fragments.json";
import placeRaw from "./places.json";

const fragments = fragRaw as Fragment[];
const placeIds = new Set((placeRaw as Place[]).map((p) => p.id));

// The Clue Pool is never invented: every outside claim carries a link.
describe("Clue Pool", () => {
  it("has unique ids that never collide with Place ids (marks share one keyspace)", () => {
    expect(new Set(fragments.map((f) => f.id)).size).toBe(fragments.length);
    for (const f of fragments) expect(placeIds.has(f.id)).toBe(false);
  });

  it.each(fragments.map((f) => [f.id, f] as const))("%s is sourced and well-formed", (_, f) => {
    expect(f.sources.length).toBeGreaterThan(0);
    for (const s of f.sources) if (s.kind !== "editorial" && s.kind !== "model") expect(s.url).toMatch(/^https:\/\//);
    if (f.relatedPlaceId) expect(placeIds.has(f.relatedPlaceId)).toBe(true);
    if (f.tier === "weak") expect(f.weakReason).toBeTruthy();
    if (f.tier === "anti") expect(f.antiReason).toBeTruthy();
  });
});
