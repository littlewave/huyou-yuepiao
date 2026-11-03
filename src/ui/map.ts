import { exclusionLabel } from "../domain/constants";
import { isVisited } from "../domain/pass";
import type { Fragment, Mark, Place, Quest, Venue } from "../domain/types";
import { esc } from "./format";
import { offlineNote, passHead, tabBar, type ViewState } from "./views";

export type Layer = "active" | "weak" | "visited" | "excluded" | "others" | "quests" | "now" | "thin";
export type Extent = "city" | "all";

export const LAYERS: { id: Layer; label: string }[] = [
  { id: "active", label: "已激活线索" },
  { id: "weak", label: "弱信号" },
  { id: "visited", label: "已去过" },
  { id: "excluded", label: "明确排除" },
  { id: "others", label: "其余精选" },
  { id: "quests", label: "探索任务" },
  { id: "now", label: "正在发生" },
  { id: "thin", label: "信息稀薄区" },
];

const EXTENTS: Record<Extent, { s: number; n: number; w: number; e: number }> = {
  city: { s: 31.1, n: 31.42, w: 121.3, e: 121.66 },
  all: { s: 30.85, n: 31.7, w: 121.1, e: 122.0 },
};

// Rough river courses for orientation only; the map is a schematic, not survey-accurate.
const HUANGPU: [number, number][] = [
  [31.395, 121.508], [31.33, 121.545], [31.285, 121.545], [31.258, 121.525], [31.248, 121.505], [31.242, 121.492],
  [31.232, 121.49], [31.215, 121.5], [31.198, 121.493], [31.18, 121.473], [31.162, 121.466], [31.145, 121.478],
  [31.11, 121.48], [31.06, 121.45], [31.02, 121.37], [30.98, 121.25],
];
const SUZHOU_CREEK: [number, number][] = [
  [31.244, 121.49], [31.243, 121.475], [31.248, 121.458], [31.252, 121.443], [31.238, 121.428], [31.232, 121.41], [31.222, 121.385], [31.215, 121.35],
];

type Point = { id: string; layer: Exclude<Layer, "thin">; lat: number; lng: number; name: string; href: string; detail: string };

function layerOf(mark: Mark | undefined, fallback: Point["layer"]): Point["layer"] {
  if (!mark) return fallback;
  if (isVisited(mark.state)) return "visited";
  if (mark.state === "dismissed") return "excluded";
  return "active";
}

export function mapPoints(s: ViewState, quests: Quest[] = [], venues: Venue[] = []): Point[] {
  const pts: Point[] = s.places.map((p: Place) => ({
    id: p.id,
    layer: layerOf(s.pass.marks[p.id], "others"),
    lat: p.lat,
    lng: p.lng,
    name: p.name,
    href: `#/p/${p.id}`,
    detail: `${p.area}${s.pass.marks[p.id]?.reason ? ` · ${exclusionLabel(s.pass.marks[p.id]!.reason)}` : ""}`,
  }));
  for (const f of s.fragments as Fragment[]) {
    if (f.lat === undefined || f.lng === undefined || f.relatedPlaceId) continue;
    const base: Point["layer"] = f.tier === "anti" ? "excluded" : f.tier === "weak" ? "weak" : "others";
    pts.push({
      id: f.id,
      layer: layerOf(s.pass.marks[f.id], base),
      lat: f.lat,
      lng: f.lng,
      name: f.text.length > 30 ? f.text.slice(0, 30) + "…" : f.text,
      href: `#/clues`,
      detail: `${f.area}${f.antiReason ? ` · ${exclusionLabel(f.antiReason)}` : ""}${f.coordsApprox ? " · 坐标约略" : ""}`,
    });
  }
  for (const q of quests)
    pts.push({
      id: q.id,
      layer: "quests",
      lat: q.lat,
      lng: q.lng,
      name: q.question,
      href: `#/q/${q.id}`,
      detail: `${q.scope ?? ""}${q.coordsApprox ? " · 坐标约略" : ""}`,
    });
  for (const v of venues)
    if (v.geo && !v.placeId)
      pts.push({
        id: `now-${v.id}`,
        layer: "now",
        lat: v.geo.lat,
        lng: v.geo.lng,
        name: v.name,
        href: `#/c/${v.cultureIds[0]}`,
        detail: `${v.area} · 坐标约略${v.geo.precision === "street" ? "（只到街道）" : ""}`,
      });
  return pts;
}

/** Grid cells (about 3 km) inside the city extent with no Place or Fragment: where we have no signal, not where nothing is. */
export function thinCells(points: { lat: number; lng: number }[], step = 0.03): { lat: number; lng: number }[] {
  const { s, n, w, e } = EXTENTS.city;
  const cells: { lat: number; lng: number }[] = [];
  for (let lat = s; lat < n - 1e-9; lat += step)
    for (let lng = w; lng < e - 1e-9; lng += step)
      if (!points.some((p) => p.lat >= lat && p.lat < lat + step && p.lng >= lng && p.lng < lng + step)) cells.push({ lat, lng });
  return cells;
}

export function mapView(s: ViewState, layers: Set<Layer>, extent: Extent, selected?: string, quests: Quest[] = [], venues: Venue[] = []): string {
  const ext = EXTENTS[extent];
  const k = Math.cos((31.2 * Math.PI) / 180);
  const W = 1000;
  const H = Math.round((W * (ext.n - ext.s)) / ((ext.e - ext.w) * k));
  const x = (lng: number) => ((lng - ext.w) / (ext.e - ext.w)) * W;
  const y = (lat: number) => ((ext.n - lat) / (ext.n - ext.s)) * H;
  const line = (pts: [number, number][]) => pts.map(([la, ln]) => `${x(ln).toFixed(1)},${y(la).toFixed(1)}`).join(" ");
  // Marker sizes are in viewBox units (1000 wide ≈ 360 px on a phone), so they run large.
  const r = extent === "city" ? 1.7 : 1.3;

  const all = mapPoints(s, quests, venues);
  const visible = all.filter((p) => layers.has(p.layer) && p.lat >= ext.s && p.lat <= ext.n && p.lng >= ext.w && p.lng <= ext.e);
  const counts = Object.fromEntries(LAYERS.map((l) => [l.id, all.filter((p) => p.layer === l.id).length]));
  const step = 0.03;
  const thin = layers.has("thin") && extent === "city" ? thinCells(all, step) : [];
  const sel = all.find((p) => p.id === selected);
  // Draw quiet layers first so active clues sit on top.
  const z: Point["layer"][] = ["others", "now", "quests", "excluded", "weak", "visited", "active"];
  visible.sort((a, b) => z.indexOf(a.layer) - z.indexOf(b.layer));

  const mark = (p: Point) => {
    const cx = x(p.lng).toFixed(1);
    const cy = y(p.lat).toFixed(1);
    const shape = {
      others: `<circle cx="${cx}" cy="${cy}" r="${7 * r}" class="m-others"/>`,
      now: `<rect x="${+cx - 6 * r}" y="${+cy - 6 * r}" width="${12 * r}" height="${12 * r}" rx="${2 * r}" class="m-now"/>`,
      quests: `<path d="M${cx} ${+cy - 10 * r}L${+cx + 9 * r} ${+cy + 6 * r}H${+cx - 9 * r}Z" class="m-quests"/>`,
      active: `<circle cx="${cx}" cy="${cy}" r="${13 * r}" class="m-active"/>`,
      weak: `<circle cx="${cx}" cy="${cy}" r="${11 * r}" class="m-weak"/>`,
      visited: `<circle cx="${cx}" cy="${cy}" r="${12 * r}" class="m-visited"/><circle cx="${cx}" cy="${cy}" r="${4.5 * r}" class="m-hole"/>`,
      excluded: `<path d="M${+cx - 8 * r} ${+cy - 8 * r}l${16 * r} ${16 * r}M${+cx + 8 * r} ${+cy - 8 * r}l${-16 * r} ${16 * r}" class="m-excluded"/>`,
    }[p.layer];
    return `<g class="pt ${p.id === selected ? "is-sel" : ""}" data-action="map-pick" data-id="${p.id}" role="button" tabindex="0" aria-label="${esc(p.name)}">
      <circle cx="${cx}" cy="${cy}" r="34" class="hit"/>${shape}</g>`;
  };

  return `
  ${passHead(s, "地图")}
  <section class="conditions map-controls" aria-label="图层">
    <div class="seg seg-map" role="group" aria-label="范围">
      <button type="button" data-action="map-extent" data-value="city" aria-pressed="${extent === "city"}">市区</button>
      <button type="button" data-action="map-extent" data-value="all" aria-pressed="${extent === "all"}">全市</button>
    </div>
    <div class="chips">
      ${LAYERS.map(
        (l) =>
          `<button type="button" class="chip chip-layer l-${l.id}" data-action="map-layer" data-value="${l.id}" aria-pressed="${layers.has(l.id)}"><i aria-hidden="true"></i>${l.label}${l.id === "thin" ? "" : `<span class="count num">${counts[l.id]}</span>`}</button>`,
      ).join("")}
    </div>
  </section>
  <main class="sheet sheet-map" id="main">
    ${offlineNote(s)}
    <figure class="map">
      <svg viewBox="0 0 ${W} ${H}" role="group" aria-label="上海示意地图">
        <defs>
          <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v14" class="hatch-line"/></pattern>
        </defs>
        <rect width="${W}" height="${H}" class="map-ground"/>
        ${thin.map((c) => `<rect x="${x(c.lng).toFixed(1)}" y="${y(c.lat + step).toFixed(1)}" width="${(x(c.lng + step) - x(c.lng)).toFixed(1)}" height="${(y(c.lat) - y(c.lat + step)).toFixed(1)}" class="thin"/>`).join("")}
        <polyline points="${line(HUANGPU)}" class="river"/>
        <polyline points="${line(SUZHOU_CREEK)}" class="river river-sm"/>
        <text x="${x(121.515) + 14}" y="${y(31.205)}" class="river-label">黄浦江</text>
        ${visible.map(mark).join("")}
        <g class="base-mark" aria-hidden="true"><rect x="${x(s.base.lng) - 11}" y="${y(s.base.lat) - 11}" width="22" height="22" rx="3" transform="rotate(45 ${x(s.base.lng)} ${y(s.base.lat)})"/></g>
      </svg>
      <figcaption>示意图：河道为大致走向，点位为约略坐标。△ 是探索任务的起点，◆ 是出发点（${esc(s.base.name)}）。${layers.has("now") ? "▢ 是「正在发生」的场地，部分坐标来自 © OpenStreetMap 贡献者，只精确到街道的也有。" : ""}${layers.has("thin") ? "斜线格是信息稀薄区：我们没抓到足够信号，不代表不值得去。" : ""}</figcaption>
    </figure>
    ${
      sel
        ? `<div class="map-sel" role="status"><span class="sel-layer l-${sel.layer}"><i></i>${LAYERS.find((l) => l.id === sel.layer)!.label}</span><b>${esc(sel.name)}</b><span>${esc(sel.detail)}</span><a class="btn" href="${sel.href}">打开</a></div>`
        : `<p class="hint map-hint">点地图上的标记查看是什么地方。</p>`
    }
  </main>
  ${tabBar("map")}`;
}
