import { describe, expect, it } from "vitest";
import { coverage, touchedDomains } from "./coverage";
import type { Quest } from "./types";

const q = (id: string, topics: Quest["topics"], areaId: string, eras?: Quest["eras"]) => ({ id, topics, areaId, eras }) as Quest;
const T = "2026-12-05T10:00:00.000Z";

describe("coverage", () => {
  const quests = [
    q("a", ["infrastructure/water", "layers/palimpsest"], "yp", ["treaty-port"]),
    q("b", ["food/markets"], "hf"),
    q("c", ["infrastructure/port"], "yp", ["now"]),
  ];

  it("counts totals per Domain, Era and Area, and what has been touched", () => {
    const c = coverage(quests, {
      a: { note: "", found: [0], updatedAt: T },
      b: { note: "", found: [], doneOn: "2026-12-05", updatedAt: T },
    });
    expect(c.domains.infrastructure).toEqual({ touched: 1, total: 2 });
    expect(c.domains.food).toEqual({ touched: 1, total: 1 });
    expect(c.domains.rhythm).toEqual({ touched: 0, total: 0 });
    expect(c.eras["treaty-port"]).toEqual({ touched: 1, total: 1 });
    expect(c.areas).toEqual([{ areaId: "yp", touched: 1, total: 2 }, { areaId: "hf", touched: 1, total: 1 }]);
    expect([c.touched, c.done, c.total]).toEqual([2, 1, 3]);
    expect([...touchedDomains(c)].sort()).toEqual(["food", "infrastructure", "layers"]);
  });

  it("starts at zero with no Observations", () => {
    expect(coverage(quests).touched).toBe(0);
  });
});
