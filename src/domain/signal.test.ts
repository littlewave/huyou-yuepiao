import { describe, expect, it } from "vitest";
import { assessSignal, freshnessOf } from "./signal";
import type { Source } from "./types";

const today = "2026-10-30";
const s = (over: Partial<Source>): Source => ({ kind: "news", name: "X", date: "2026-10-28", ...over });

describe("freshnessOf", () => {
  it("tells this week's news from a five-year-old blog", () => {
    expect(freshnessOf("2026-10-28", today)).toEqual({ freshness: "fresh", label: "本周" });
    expect(freshnessOf("2021-09-01", today)).toEqual({ freshness: "stale", label: "5 年前" });
  });

  it("counts months, and treats a missing date as unknown", () => {
    expect(freshnessOf("2026-07-30", today).label).toBe("3 个月前");
    expect(freshnessOf(null, today).freshness).toBe("unknown");
  });
});

describe("assessSignal", () => {
  it("is cross-confirmed with two independent outside sources", () => {
    const sig = assessSignal([s({ name: "CGTN" }), s({ kind: "gov", name: "浦东政府" })], null, today);
    expect(sig.strength).toBe("cross");
    expect(sig.bars).toBe(3);
  });

  it("does not count two articles from the same outlet as independent", () => {
    const sig = assessSignal([s({ name: "上海市政府英文网" }), s({ name: "上海市政府英文网（假期客流）" })], null, today);
    expect(sig.strength).toBe("single");
  });

  it("flags a lone Reddit post as anonymous", () => {
    const sig = assessSignal([s({ kind: "reddit", name: "r/shanghai", date: "2024-05-24" })], null, today);
    expect(sig.strength).toBe("anonymous");
    expect(sig.doubt.join()).toContain("匿名");
  });

  it("treats AI-only knowledge as editorial, aged from its own date", () => {
    const sig = assessSignal([s({ kind: "model", name: "Claude 知识整理", date: "2026-06" })], null, today);
    expect(sig.strength).toBe("editorial");
    expect(sig.freshnessLabel).toBe("5 个月前");
  });

  it("does not let an OpenStreetMap query date pass for freshness", () => {
    const sig = assessSignal([s({ kind: "osm", name: "OpenStreetMap", date: today })], null, today);
    expect(sig.freshness).toBe("unknown");
  });

  it("a Verification makes it cross-confirmed and fresh from that date", () => {
    const sig = assessSignal([s({ kind: "model", name: "Claude", date: "2026-06" })], "2026-10-29", today);
    expect(sig.strength).toBe("cross");
    expect(sig.freshnessLabel).toBe("本周");
  });
  it("counts two articles from one outlet as one source", () => {
    const sig = assessSignal(
      [
        { kind: "gov", name: "上海市政府英文网：A", url: "https://a", date: "2026-01" },
        { kind: "gov", name: "上海市政府英文网：B", url: "https://b", date: "2026-02" },
      ],
      null,
      "2026-11-03",
    );
    expect(sig.strength).toBe("single");
  });
});
