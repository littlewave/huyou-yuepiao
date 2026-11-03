import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "./styles.css";

import { selectCandidates, surprisePick } from "./domain/candidates";
import { questsForToday } from "./domain/quests";
import { BASES } from "./domain/constants";
import { distanceKm } from "./domain/geo";
import { loadPass, savePass, setConditions, setExclusionReason, setNote, setReview, setPunchDay, toggleFound, toggleMark, toggleQuestDone, tryParsePass } from "./domain/pass";
import type { DomainId, LensId } from "./domain/taxonomy";
import type { Area, Base, Culture, CultureEvent, CultureState, Evidence, ExclusionReason, Fragment, MarkState, Pass, Place, Quest, TimeBudget, Trail, Trend, Venue } from "./domain/types";
import areaRaw from "./data/areas.json";
import evidenceRaw from "./data/evidence.json";
import questRaw from "./data/quests.json";
import trailRaw from "./data/trails.json";
import cultureRaw from "./data/now/cultures.json";
import nowEventRaw from "./data/now/events.json";
import trendRaw from "./data/now/trends.json";
import venueRaw from "./data/now/venues.json";
import { setCultureState, venueState } from "./domain/now";
import { cultureView, nowView, questNowLinks, type NowData, type NowMode, type NowState, type NowWindow } from "./ui/now";
import fragRaw from "./data/fragments.json";
import raw from "./data/places.json";
import { cluesView, type ClueGroup } from "./ui/clues";
import { todayISO } from "./ui/format";
import { mapView, type Extent, type Layer } from "./ui/map";
import { coverageView, placeQuests, questsView, questView, todayQuests, type DiscoverMode, type DiscoverState, type Knowledge } from "./ui/quests";
import { notFoundView, passView, placeView, todayView, type ViewState } from "./ui/views";

const places = raw as Place[];
const fragments = fragRaw as Fragment[];
const byId = new Map(places.map((p) => [p.id, p]));
const fragById = new Map(fragments.map((f) => [f.id, f]));
const knowledge: Knowledge = {
  quests: questRaw as Quest[],
  trails: trailRaw as Trail[],
  areas: new Map((areaRaw as Area[]).map((a) => [a.id, a])),
  evidence: new Map((evidenceRaw as Evidence[]).map((e) => [e.id, e])),
  places: byId,
};
const now: NowData = {
  cultures: cultureRaw as Culture[],
  venues: venueRaw as Venue[],
  events: nowEventRaw as CultureEvent[],
  trends: trendRaw as Trend[],
  quests: knowledge.quests,
  places: byId,
  areaDistricts: new Map([...knowledge.areas].map(([id, a]) => [id, a.district])),
};
const app = document.getElementById("app")!;

let pass: Pass = loadPass();
let justPunched: string | undefined;
let picked: string | undefined;
let lastRoute = "";
// View-only state; not worth persisting.
let clueGroup: ClueGroup = "place";
let mapExtent: Extent = "city";
let mapSel: string | undefined;
const discover: DiscoverState = { mode: "space", domain: null, lens: null };
const nowState: NowState = { mode: "radar", window: "trip", district: "", freeOnly: false };
const mapLayers = new Set<Layer>(["active", "weak", "visited", "excluded", "others", "quests", "now"]);

const currentBase = (): Base =>
  (pass.baseId === "here" ? pass.customBase : BASES.find((b) => b.id === pass.baseId)) ?? BASES[0]!;

function update(next: Pass) {
  pass = next;
  savePass(pass);
  render();
}

function render() {
  const base = currentBase();
  const s: ViewState = {
    pass,
    base,
    places,
    fragments,
    today: todayISO(),
    selection: selectCandidates(places, pass.conditions, base, pass.marks),
    online: navigator.onLine,
    justPunched,
    picked,
  };
  const route = location.hash.replace(/^#/, "") || "/";
  // Keep a chip row's horizontal scroll across re-renders of the same view, not across views.
  const chipScroll = route === lastRoute ? (app.querySelector(".chips")?.scrollLeft ?? 0) : 0;
  lastRoute = route;

  if (route.startsWith("/p/")) {
    const p = byId.get(route.slice(3));
    app.innerHTML = p ? placeView(s, p, distanceKm(base, p), placeQuests(p, knowledge)) : notFoundView();
    document.title = p ? `${p.name} · 沪游月票` : "沪游月票";
  } else if (route.startsWith("/q/")) {
    const q = knowledge.quests.find((x) => x.id === route.slice(3));
    app.innerHTML = q ? questView(s, q, knowledge, questNowLinks(q, now)) : notFoundView();
    document.title = q ? `${q.question} · 沪游月票` : "沪游月票";
  } else if (route === "/now") {
    app.innerHTML = nowView(s, now, nowState);
    document.title = "正在发生 · 沪游月票";
  } else if (route.startsWith("/c/")) {
    const c = now.cultures.find((x) => x.id === route.slice(3));
    app.innerHTML = c ? cultureView(s, c, now) : notFoundView();
    document.title = c ? `${c.label} · 沪游月票` : "沪游月票";
  } else if (route === "/quests") {
    app.innerHTML = questsView(s, knowledge, discover);
    document.title = "探索 · 沪游月票";
  } else if (route === "/pass") {
    app.innerHTML = passView(s, byId, fragById, coverageView(s, knowledge));
    document.title = "我的月票 · 沪游月票";
  } else if (route === "/clues") {
    app.innerHTML = cluesView(s, clueGroup, byId);
    document.title = "线索流 · 沪游月票";
  } else if (route === "/map") {
    // Only Venues the app shows as active go on the map.
    app.innerHTML = mapView(s, mapLayers, mapExtent, mapSel, knowledge.quests, now.venues.filter((v) => venueState(v, s.today) === "active"));
    document.title = "地图 · 沪游月票";
  } else {
    app.innerHTML = todayView(s, todayQuests(s, questsForToday(knowledge.quests, pass.conditions, base, { observations: pass.observations, evidence: knowledge.evidence, reviews: pass.reviews }), knowledge));
    document.title = "沪游月票";
  }

  const chips = app.querySelector(".chips");
  if (chips) chips.scrollLeft = chipScroll;
  if (picked) document.getElementById(`slip-${picked}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  justPunched = undefined;
  picked = undefined;
}

// ── Events ───────────────────────────────────────────────────────────────

app.addEventListener("click", (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!el || el.tagName === "SELECT" || el.tagName === "INPUT") return;
  const c = pass.conditions;
  const v = el.dataset.value;

  switch (el.dataset.action) {
    case "time":
      return update(setConditions(pass, { ...c, time: v as TimeBudget }));
    case "rain":
      return update(setConditions(pass, { ...c, rainSafe: !c.rainSafe }));
    case "domain": {
      const d = v as DomainId;
      const domains = c.domains.includes(d) ? c.domains.filter((x) => x !== d) : [...c.domains, d];
      return update(setConditions(pass, { ...c, domains }));
    }
    case "clear-domains":
      return update(setConditions(pass, { ...c, domains: [] }));
    case "distance-widen":
      return update(setConditions(pass, { ...c, maxKm: 35 }));
    case "surprise": {
      const sel = selectCandidates(places, c, currentBase(), pass.marks);
      picked = surprisePick(sel.candidates)?.place.id;
      return render();
    }
    case "mark": {
      const id = el.dataset.id!;
      const state = el.dataset.state as MarkState;
      if (state === "punched" && pass.marks[id]?.state !== "punched") justPunched = id;
      return update(toggleMark(pass, id, state, todayISO()));
    }
    case "found":
      return update(toggleFound(pass, el.dataset.id!, Number(el.dataset.index), new Date().toISOString()));
    case "review":
      return update(setReview(pass, el.dataset.id!, v as "ok" | "problem", todayISO()));
    case "quest-done":
      return update(toggleQuestDone(pass, el.dataset.id!, todayISO(), new Date().toISOString()));
    case "reason":
      return update(setExclusionReason(pass, el.dataset.id!, v as ExclusionReason));
    case "quest-domain":
      discover.domain = (v || null) as DomainId | null;
      return render();
    case "now-mode":
      nowState.mode = v as NowMode;
      return render();
    case "now-window":
      nowState.window = v as NowWindow;
      nowState.district = "";
      return render();
    case "now-district":
      nowState.district = v ?? "";
      return render();
    case "now-free":
      nowState.freeOnly = !nowState.freeOnly;
      return render();
    case "culture-state":
      return update(setCultureState(pass, el.dataset.id!, v as CultureState));
    case "discover-mode":
      discover.mode = v as DiscoverMode;
      return render();
    case "quest-lens":
      discover.lens = (v || null) as LensId | null;
      return render();
    case "ev-jump":
      // In-page jump without touching the hash router.
      e.preventDefault();
      return document.getElementById(`ev-${el.dataset.id}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
    case "clue-group":
      clueGroup = v as ClueGroup;
      return render();
    case "map-extent":
      mapExtent = v as Extent;
      return render();
    case "map-layer": {
      const l = v as Layer;
      if (mapLayers.has(l)) mapLayers.delete(l);
      else mapLayers.add(l);
      return render();
    }
    case "map-pick":
      mapSel = el.dataset.id === mapSel ? undefined : el.dataset.id;
      return render();
    case "locate":
      return locate(el);
    case "copy": {
      const ta = app.querySelector<HTMLTextAreaElement>("[data-role=transfer]");
      if (ta) navigator.clipboard?.writeText(ta.value).then(() => flash(el, "已复制"), () => ta.select());
      return;
    }
    case "import": {
      const ta = app.querySelector<HTMLTextAreaElement>("[data-role=transfer]");
      const next = tryParsePass(ta?.value.trim() ?? null);
      return next ? update(next) : flash(el, "内容无法识别，请粘贴完整的导出内容");
    }
  }
});

app.addEventListener("keydown", (e) => {
  const el = e.target as HTMLElement;
  if ((e.key === "Enter" || e.key === " ") && el.dataset.action === "map-pick") {
    e.preventDefault();
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }
});

app.addEventListener("change", (e) => {
  const el = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  const c = pass.conditions;
  switch (el.dataset.action) {
    case "distance":
      return update(setConditions(pass, { ...c, maxKm: el.value === "" ? null : Number(el.value) }));
    case "base":
      return update({ ...pass, baseId: el.value });
    case "note":
      // Save without re-rendering: the blur that fires this can come from tapping a button, and a re-render would eat that tap.
      pass = setNote(pass, el.dataset.id!, el.value, new Date().toISOString());
      return savePass(pass);
    case "punch-day":
      return el.value && update(setPunchDay(pass, el.dataset.id!, el.value));
    case "trip-start":
      return el.value && update({ ...pass, trip: { ...pass.trip, start: el.value } });
    case "trip-end":
      return el.value && update({ ...pass, trip: { ...pass.trip, end: el.value } });
  }
});

function locate(btn: HTMLElement) {
  if (!navigator.geolocation) return flash(btn, "这台设备不支持定位");
  btn.setAttribute("aria-busy", "true");
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const t = new Date();
      const name = `${t.getMonth() + 1}月${t.getDate()}日 ${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
      update({ ...pass, baseId: "here", customBase: { id: "here", name, lat: coords.latitude, lng: coords.longitude } });
    },
    () => {
      btn.removeAttribute("aria-busy");
      flash(btn, "没有拿到位置，请在系统设置里允许定位");
    },
    { timeout: 10000, maximumAge: 300000 },
  );
}

function flash(el: HTMLElement, msg: string) {
  const note = document.createElement("span");
  note.className = "flash";
  note.setAttribute("role", "status");
  note.textContent = msg;
  el.after(note);
  setTimeout(() => note.remove(), 2400);
}

window.addEventListener("hashchange", () => {
  render();
  window.scrollTo(0, 0);
});
window.addEventListener("online", render);
window.addEventListener("offline", render);

render();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register("./sw.js").catch(() => {
    // No offline cache this session; the app still works online.
  });
}
