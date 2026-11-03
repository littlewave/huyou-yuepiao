import { THEMES } from "../domain/constants";
import type { Booking, Place, Setting, ThemeId } from "../domain/types";

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const themeLabel = (id: ThemeId) => THEMES.find((t) => t.id === id)?.label ?? id;

export const settingLabel: Record<Setting, string> = { indoor: "室内", outdoor: "户外", mixed: "室内外" };

export const bookingLabel: Record<Booking, string> = {
  required: "需预约",
  recommended: "建议预约",
  none: "无需预约",
  unknown: "预约方式待查",
};

export const km = (n: number) => (n < 10 ? n.toFixed(1) : Math.round(n).toString());

export const hours = (h: number) => (h < 1 ? `${Math.round(h * 60)} 分钟` : `${h} 小时`);

/** Duration bar scale: a full bar is an 8-hour day. */
export const durationPct = (h: number) => Math.min(100, (h / 8) * 100);

export const dayOfMonth = (iso: string) => Number(iso.slice(8, 10));

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const links = (p: Place) => ({
  amap: `https://uri.amap.com/marker?position=${p.lng},${p.lat}&name=${encodeURIComponent(p.name)}&coordinate=gaode&callnative=1`,
  dianping: `https://www.dianping.com/search/keyword/1/0_${encodeURIComponent(p.name)}`,
  xhs: `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(p.name)}`,
});
