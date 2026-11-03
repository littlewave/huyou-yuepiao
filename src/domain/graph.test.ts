import { describe, expect, it } from "vitest";
import { checkGraph, type Graph } from "./graph";
import type { Quest } from "./types";

const quest: Quest = {
  id: "q1",
  question: "江边的系缆桩为什么留着？",
  why: "w",
  background: [{ text: "b", evidence: ["e1"] }],
  tasks: ["数一数"],
  lookFor: ["编号"],
  further: [],
  areaId: "a1",
  placeIds: [],
  scope: "滨江一段",
  lat: 31.25,
  lng: 121.52,
  topics: ["infrastructure/port"],
  minutes: 60,
  setting: "outdoor",
  daylight: true,
  difficulty: 1,
  kid9: "k",
  kid16: "k",
  access: { transit: "地铁", stepFree: null },
  evidence: ["e1"],
  checkedAt: null,
};

const graph = (over: Partial<Graph> = {}): Graph => ({
  places: [],
  areas: [{ id: "a1", name: "A", district: "D", kind: "corridor" }],
  quests: [quest],
  trails: [],
  evidence: [{ id: "e1", claim: "c", sources: [{ kind: "news", name: "N", url: "https://x", date: "2026-01" }], checkedAt: null }],
  ...over,
});

describe("checkGraph", () => {
  it("passes a consistent graph", () => {
    expect(checkGraph(graph())).toEqual([]);
  });

  it("flags dangling references and missing parts", () => {
    const bad = { ...quest, areaId: "nope", evidence: ["e9"], scope: undefined, tasks: [], question: "一个陈述" };
    const out = checkGraph(graph({ quests: [bad] }));
    expect(out).toEqual(
      expect.arrayContaining([
        "quest q1: question is not a question",
        "quest q1: unknown area nope",
        "quest q1: neither a Place nor a scope",
        "quest q1: no tasks",
        "quest q1: unknown evidence e9",
      ]),
    );
  });

  it("refuses a checked Quest that cites unchecked Evidence", () => {
    expect(checkGraph(graph({ quests: [{ ...quest, checkedAt: "2026-11-03" }] }))).toContain(
      "quest q1: checked but cites unchecked evidence",
    );
  });

  it("refuses linked sources without https and Evidence 'checked' against nothing outside", () => {
    const out = checkGraph(
      graph({
        evidence: [
          { id: "e1", claim: "c", sources: [{ kind: "blog", name: "B", date: null }], checkedAt: null },
          { id: "e2", claim: "c", sources: [{ kind: "model", name: "M", date: "2026-06" }], checkedAt: "2026-11-03" },
          { id: "e3", claim: "c", sources: [{ kind: "news", name: "N", url: "https://x", date: null }], checkedAt: "2026-11-03" },
        ],
      }),
    );
    expect(out).toContain("evidence e1: B has no https link");
    expect(out).toContain("evidence e2: checked against no outside source");
    expect(out).toContain("evidence e3: checked by whom?");
  });

  it("needs a Trail to string at least two known Quests", () => {
    const out = checkGraph(graph({ trails: [{ id: "t", title: "T", question: "?", areaId: "a1", questIds: ["q1", "qx"], minutes: 90 }] }));
    expect(out).toContain("trail t: unknown quest qx");
  });
});
