import { describe, expect, it } from "vitest";
import { THEMES } from "../domain/constants";
import type { Place } from "../domain/types";
import raw from "./places.json";

const places = raw as Place[];
const themeIds = new Set(THEMES.map((t) => t.id));

// The Library's editorial bar, enforced: every Place has a Local Reason and both Kid Hooks.
describe("Library", () => {
  it("has unique ids", () => {
    expect(new Set(places.map((p) => p.id)).size).toBe(places.length);
  });

  it.each(places.map((p) => [p.name, p] as const))("%s meets the bar", (_, p) => {
    expect(p.localReason.length).toBeGreaterThan(10);
    expect(p.kid9.length).toBeGreaterThan(4);
    expect(p.kid16.length).toBeGreaterThan(4);
    expect(p.themes.length).toBeGreaterThan(0);
    for (const t of p.themes) expect(themeIds.has(t)).toBe(true);
    expect(p.hours).toBeGreaterThan(0);
    // Inside greater Shanghai
    expect(p.lat).toBeGreaterThan(30.6);
    expect(p.lat).toBeLessThan(31.9);
    expect(p.lng).toBeGreaterThan(120.8);
    expect(p.lng).toBeLessThan(122.1);
  });
});
