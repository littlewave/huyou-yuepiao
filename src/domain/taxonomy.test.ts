import { describe, expect, it } from "vitest";
import { DOMAINS, ERAS, LENSES, domainCoverage, isTopic, lensesFor, topicLabel } from "./taxonomy";

describe("taxonomy", () => {
  it("has the twelve Domains, each with unique Topics", () => {
    expect(DOMAINS).toHaveLength(12);
    for (const d of DOMAINS) expect(new Set(d.topics.map((t) => t.id)).size).toBe(d.topics.length);
  });

  it("accepts known topics and their sub-topics, rejects the rest", () => {
    expect(isTopic("infrastructure/transit")).toBe(true);
    expect(isTopic("infrastructure/transit/ferry")).toBe(true);
    expect(isTopic("infrastructure/teleport")).toBe(false);
    expect(isTopic("art")).toBe(false);
  });

  it("labels a sub-topic by its parent", () => {
    expect(topicLabel("infrastructure/transit/ferry")).toBe("轨交、轮渡与交通");
  });

  it("counts coverage per Domain once per item, zeroes included", () => {
    const c = domainCoverage([{ topics: ["ecology/rivers", "ecology/wetland"] }, { topics: ["food/markets"] }]);
    expect(c.ecology).toBe(1);
    expect(c.food).toBe(1);
    expect(c.rhythm).toBe(0);
    expect(Object.keys(c)).toHaveLength(12);
  });

  it("ranks Lenses by how many of their Domains an item touches", () => {
    expect(lensesFor(["infrastructure/port", "economy/trade"])[0]).toBe("engineer");
    expect(lensesFor(["food/markets"])).toEqual(["observer"]);
  });

  it("Lenses only lean on real Domains; Eras run in order", () => {
    const ids = new Set(DOMAINS.map((d) => d.id));
    for (const l of LENSES) for (const d of l.domains) expect(ids.has(d)).toBe(true);
    for (let i = 1; i < ERAS.length; i++) expect(ERAS[i]!.from!).toBeGreaterThanOrEqual(ERAS[i - 1]!.to!);
  });
});
