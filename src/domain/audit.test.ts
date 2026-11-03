import { describe, expect, it } from "vitest";
import { auditKnowledge, auditMarkdown, auditNow } from "./audit";
import type { Evidence, Quest } from "./types";

const ev = (over: Partial<Evidence>): Evidence => ({
  id: "e", claim: "c", sources: [{ kind: "news", name: "N", url: "https://n", date: "2026-06" }], checkedAt: "2026-11-03", checkedBy: "ai", ...over,
});
const quest = (id: string, evidence: string[]) => ({ id, evidence, background: [], topics: ["food/markets"] }) as unknown as Quest;

describe("auditKnowledge", () => {
  const evidence = [
    ev({ id: "fine", checkedBy: "owner" }),
    ev({ id: "ai" }),
    ev({ id: "old", volatile: true, sources: [{ kind: "news", name: "N", url: "https://n", date: "2019-01" }], checkedBy: "owner" }),
    ev({ id: "history", sources: [{ kind: "news", name: "N", url: "https://n", date: "2019-01" }], checkedBy: "owner" }),
    ev({ id: "wiki", sources: [{ kind: "community", name: "W", url: "https://w", date: null }], checkedBy: "owner" }),
    ev({ id: "open", checkedAt: null, checkedBy: undefined, disputed: "x" }),
    ev({ id: "flagged" }),
  ];
  const quests = [quest("q1", ["ai", "open"]), quest("q2", ["open"])];
  const a = auditKnowledge({ quests, evidence, places: [] }, "2026-11-20", {
    flagged: { verdict: "problem", on: "2026-11-19" },
    ai: { verdict: "ok", on: "2026-11-19" },
  });

  it("flags each problem, worst first, and leaves clean Evidence out", () => {
    expect(a.items.map((x) => [x.evidence.id, x.issues])).toEqual([
      ["flagged", ["owner-problem"]],
      ["open", ["unchecked", "disputed"]],
      ["old", ["stale"]],
      ["wiki", ["undated", "anonymous-only"]],
      ["ai", ["owner-ok-unrecorded"]],
    ]);
  });

  it("lists the Quests that cite each item, and thin Domains and empty Eras", () => {
    expect(a.items.find((x) => x.evidence.id === "open")!.quests).toEqual(["q1", "q2"]);
    expect(a.thinDomains.find((d) => d.domain === "food")).toEqual({ domain: "food", quests: 2 });
    expect(a.emptyEras).toContain("ancient");
  });

  it("renders a Markdown report", () => {
    const md = auditMarkdown(a, "2026-11-20");
    expect(md).toContain("# Knowledge audit, 2026-11-20");
    expect(md).toContain("### open");
    expect(md).toContain("cited by: q1, q2");
  });
});

describe("auditNow", () => {
  const src = { kind: "news" as const, name: "N", url: "https://n", date: "2026-03-07" };
  const base = { cultureIds: ["music"], checkedAt: "2026-11-03", sources: [src], note: "" };
  it("sorts Now data into re-confirm, archive, stale Venues, thin Trends and empty Cultures", () => {
    const a = auditNow(
      {
        cultures: [{ id: "music" }, { id: "games" }] as never,
        venues: [
          { id: "ok", name: "", kind: "business", cultureIds: ["music"], area: "", status: "seen-active", lastSeen: "2026-03-07", note: "", sources: [src] },
          { id: "old", name: "", kind: "business", cultureIds: ["games"], area: "", status: "seen-active", lastSeen: "2024-06-21", note: "", sources: [src] },
        ],
        events: [
          { id: "jam", title: "", start: "2026-03-07", end: null, status: "confirmed", weekly: [1], validUntil: "2026-09-07", ...base },
          { id: "past", title: "", start: "2026-10-01", end: "2026-10-02", status: "confirmed", ...base },
          { id: "next", title: "", start: "2026-12-12", end: "2026-12-20", status: "confirmed", ...base },
        ],
        trends: [{ id: "t", title: "", summary: "", cultureIds: ["music"], firstSeen: "2026-03", sources: [src], watch: "" }],
      },
      "2026-11-03",
    );
    expect(a.events.map((x) => x.event.id)).toEqual(["jam"]);
    expect(a.ended.map((e) => e.id)).toEqual(["past"]);
    expect(a.venues.map((x) => [x.venue.id, x.state])).toEqual([["old", "unconfirmed"]]);
    expect(a.thinTrends.map((t) => t.id)).toEqual(["t"]);
    expect(a.emptyCultures.map((c) => c.id)).toEqual(["games"]);
  });
});
