import type { Base, Conditions, ExclusionReason, ThemeId, TimeBudget } from "./types";

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: "art", label: "艺术" },
  { id: "heritage", label: "历史建筑" },
  { id: "walk", label: "城市漫步" },
  { id: "nature", label: "自然" },
  { id: "books", label: "书店" },
  { id: "science", label: "科学动手" },
  { id: "food", label: "市集美食" },
];

export const BASES: Base[] = [
  { id: "lujiazui", name: "陆家嘴", lat: 31.2397, lng: 121.4998 },
  { id: "peoples-square", name: "人民广场", lat: 31.2304, lng: 121.4737 },
  { id: "jingan-temple", name: "静安寺", lat: 31.2235, lng: 121.4456 },
  { id: "xujiahui", name: "徐家汇", lat: 31.195, lng: 121.437 },
  { id: "century-park", name: "世纪公园", lat: 31.2155, lng: 121.5513 },
];

/** Upper bound in hours for each time budget. */
export const TIME_LIMIT: Record<TimeBudget, number> = { "2h": 2.5, half: 4.5, day: Infinity };

export const TIME_OPTIONS: { id: TimeBudget; label: string }[] = [
  { id: "2h", label: "两小时" },
  { id: "half", label: "半天" },
  { id: "day", label: "一整天" },
];

export const DISTANCE_OPTIONS: { km: number | null; label: string }[] = [
  { km: 5, label: "5 km 内" },
  { km: 15, label: "15 km 内" },
  { km: 35, label: "35 km 内" },
  { km: null, label: "不限远近" },
];

export const DEFAULT_CONDITIONS: Conditions = { time: "half", maxKm: 15, rainSafe: false, domains: [] };

export const DEFAULT_TRIP = { start: "2026-12-01", end: "2026-12-31" };

export const EXCLUSION_REASONS: { id: ExclusionReason; label: string }[] = [
  { id: "commercial", label: "商业化陷阱" },
  { id: "locals-avoid", label: "本地人回避" },
  { id: "inaccessible", label: "当前不可进入" },
  { id: "seasonal", label: "季节性关闭" },
  { id: "outdated", label: "信息过时" },
  { id: "not-for-us", label: "不适合我们" },
];

export const exclusionLabel = (id: ExclusionReason | undefined) => EXCLUSION_REASONS.find((r) => r.id === id)?.label;
