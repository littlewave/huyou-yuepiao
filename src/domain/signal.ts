import type { Source, SourceKind } from "./types";

export type Strength = "cross" | "single" | "anonymous" | "editorial";
export type Freshness = "fresh" | "recent" | "aging" | "stale" | "unknown";

export interface Signal {
  strength: Strength;
  strengthLabel: string;
  /** 1–3, for the signal bars. */
  bars: 1 | 2 | 3;
  freshness: Freshness;
  freshnessLabel: string;
  latest: string | null;
  /** Reasons to trust, and reasons to doubt, in plain words for the 来源说明 note. */
  why: string[];
  doubt: string[];
}

const ANONYMOUS: SourceKind[] = ["reddit", "community"];
const OWN: SourceKind[] = ["model", "editorial"];

export const SOURCE_LABEL: Record<SourceKind, string> = {
  news: "新闻",
  gov: "政府",
  reddit: "Reddit",
  blog: "博客",
  osm: "OSM",
  community: "社区",
  guide: "指南",
  model: "AI整理",
  editorial: "编辑",
};

/** Months-or-days precision dates become a comparable day; YYYY-MM counts as the 15th. */
function toTime(date: string): number {
  const full = date.length === 7 ? `${date}-15` : date;
  return Date.parse(full + "T00:00:00Z");
}

export function freshnessOf(date: string | null, today: string): { freshness: Freshness; label: string } {
  if (!date) return { freshness: "unknown", label: "日期不明" };
  const days = Math.max(0, Math.round((toTime(today) - toTime(date)) / 86_400_000));
  if (days <= 7) return { freshness: "fresh", label: "本周" };
  if (days <= 31) return { freshness: "fresh", label: "本月" };
  if (days < 365) return { freshness: days <= 180 ? "recent" : "aging", label: `${Math.max(1, Math.round(days / 30))} 个月前` };
  const years = Math.round(days / 365);
  return { freshness: days <= 730 ? "aging" : "stale", label: `${years} 年前` };
}

/**
 * How much to trust a Place or Fragment: independent outside sources make it stronger,
 * anonymous posts and our own editorial notes make it weaker; the newest dated source sets freshness.
 */
export function assessSignal(sources: Source[], verifiedAt: string | null, today: string): Signal {
  const outside = sources.filter((s) => !OWN.includes(s.kind));
  // One outlet counts once: "上海市政府英文网：A" and "上海市政府英文网：B" are the same voice.
  const independent = new Set(outside.map((s) => s.name.split("：")[0]!.replace(/（.*）$/, ""))).size;
  const anonymousOnly = outside.length > 0 && outside.every((s) => ANONYMOUS.includes(s.kind));

  let strength: Strength;
  if (verifiedAt || independent >= 2) strength = "cross";
  else if (outside.length === 0) strength = "editorial";
  else if (anonymousOnly) strength = "anonymous";
  else strength = "single";

  // An OSM date is when we queried, not when the map data was made, so it never makes a claim fresh.
  const dated = sources.filter((s) => s.kind !== "osm").map((s) => s.date).filter((d): d is string => !!d).sort();
  const latest = verifiedAt ?? dated[dated.length - 1] ?? null;
  const { freshness, label } = freshnessOf(latest, today);

  const why: string[] = [];
  const doubt: string[] = [];
  if (verifiedAt) why.push(`${verifiedAt} 实地核实过开放和预约信息`);
  if (independent >= 2) why.push(`${independent} 个互相独立的外部来源都提到`);
  else if (independent === 1 && !anonymousOnly) why.push(`有 1 个具名外部来源（${outside[0]!.name}）`);
  if (outside.some((s) => s.kind === "gov")) why.push("包含政府或官方渠道发布的信息");
  if (anonymousOnly) doubt.push("只有匿名帖子提到，无法确认发帖人是否真的去过");
  if (strength === "editorial") doubt.push("只来自 AI 整理或编辑判断，没有外部来源佐证");
  if (!verifiedAt) doubt.push("还没有实地核实");
  if (freshness === "stale") doubt.push(`最新来源已是 ${label}，地点可能已变化或关闭`);
  if (freshness === "unknown") doubt.push("来源没有标注日期，无法判断是否过时");
  if (outside.some((s) => s.kind === "osm")) doubt.push("开放地图在上海覆盖稀疏，常缺名称和描述");

  const strengthLabel = {
    cross: "多来源交叉确认",
    single: "单一具名来源",
    anonymous: "单一匿名帖子提到",
    editorial: "仅编辑判断",
  }[strength];
  const bars = strength === "cross" ? 3 : strength === "single" ? 2 : 1;
  return { strength, strengthLabel, bars, freshness, freshnessLabel: label, latest, why, doubt };
}
