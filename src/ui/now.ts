import { culturesForQuest, diffuse, districtOf, eventsBetween, planDays, questsForCulture, radar, trendBars, trendSignal, venueState, type DayPlan, type EventState, type Listing, type VenueState } from "../domain/now";
import { SOURCE_LABEL } from "../domain/signal";
import type { Culture, CultureEvent, CultureState, Place, Quest, Source, Trend, Venue } from "../domain/types";
import { esc } from "./format";
import { icons } from "./icons";
import { bars, explain, freshBadge } from "./signal-view";
import { assessSignal } from "../domain/signal";
import { offlineNote, passHead, tabBar, type ViewState } from "./views";

export interface NowData {
  cultures: Culture[];
  venues: Venue[];
  events: CultureEvent[];
  trends: Trend[];
  quests: Quest[];
  places: Map<string, Place>;
  /** Area id → district text, so 探索日 can keep a plan inside one district. */
  areaDistricts: Map<string, string>;
}

export type NowMode = "radar" | "events" | "mine";
export type NowWindow = "week" | "month" | "trip";

export interface NowState {
  mode: NowMode;
  window: NowWindow;
  district: string;
  freeOnly: boolean;
}

const STATE_LABEL: Record<CultureState, string> = { want: "想试", tried: "试过", love: "喜欢" };
const EVENT_LABEL: Record<EventState, string> = { upcoming: "即将开始", ongoing: "进行中", unconfirmed: "待确认", ended: "已结束", cancelled: "已取消" };
const VENUE_LABEL: Record<VenueState, string> = { active: "近期有来源", unconfirmed: "待确认", closed: "已关闭" };
const WEEKDAY = ["日", "一", "二", "三", "四", "五", "六"];

const md = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
const addDays = (iso: string, n: number) => new Date(Date.parse(iso + "T00:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);

function sourceLinks(sources: Source[]): string {
  return sources
    .map((s) => `<a href="${esc(s.url ?? "")}" target="_blank" rel="noopener"><span class="src-kind k-${s.kind}">${SOURCE_LABEL[s.kind]}</span>${esc(s.name)}${s.date ? ` · <span class="num">${esc(s.date)}</span>` : ""}</a>`)
    .join("");
}

function windowRange(s: ViewState, w: NowWindow): { from: string; to: string; label: string } {
  if (w === "week") return { from: s.today, to: addDays(s.today, 6), label: "接下来 7 天" };
  if (w === "month") return { from: s.today, to: addDays(s.today, 30), label: "接下来 30 天" };
  const from = s.pass.trip.start > s.today ? s.pass.trip.start : s.today;
  return { from, to: s.pass.trip.end, label: `行程中（${md(s.pass.trip.start)}–${md(s.pass.trip.end)}）` };
}

function eventCard(l: Listing, d: NowData): string {
  const e = l.event;
  const v = e.venueId ? d.venues.find((x) => x.id === e.venueId) : undefined;
  const when = e.weekly
    ? `每周${e.weekly.map((i) => WEEKDAY[i]).join("、")}`
    : e.datePrecision === "month"
      ? `${Number(e.start.slice(5, 7))} 月`
    : e.end && e.end !== e.start
      ? `${md(e.start)}–${md(e.end)}`
      : md(e.start);
  return `
  <li class="nev nev-${l.state}">
    <div class="nev-when"><b class="num">${esc(when)}</b>${e.weekly ? `<span>窗口内 <span class="num">${l.days.length}</span> 次</span>` : e.datePrecision === "month" ? `<span>日期未公布</span>` : ""}</div>
    <div class="nev-body">
      <h3>${esc(e.title)}</h3>
      <p class="nev-where">${icons.pin}${esc(v ? `${v.name} · ${v.area}` : (e.where ?? ""))}</p>
      <p class="nev-note">${esc(e.note)}</p>
      <p class="nev-tags"><span class="ntag t-${l.state}">${EVENT_LABEL[l.state]}</span>${e.cultureIds.map((c) => `<a class="nchip" href="#/c/${c}">${esc(d.cultures.find((x) => x.id === c)?.label ?? c)}</a>`).join("")}</p>
      <details class="nsrc"><summary>来源</summary><div>${sourceLinks(e.sources)}</div></details>
    </div>
  </li>`;
}

function trendCard(tr: Trend, d: NowData, today: string): string {
  const sig = trendSignal(tr, today);
  return `
  <li class="ntrend">
    <h3>${esc(tr.title)}</h3>
    <p>${esc(tr.summary)}</p>
    <p class="sig-head">${bars(sig)}<b>${esc(sig.strengthLabel)}</b>${freshBadge(sig)}</p>
    <p class="ntrend-watch"><b>自己去看</b>${esc(tr.watch)}</p>
    <p class="nev-tags">${tr.cultureIds.map((c) => `<a class="nchip" href="#/c/${c}">${esc(d.cultures.find((x) => x.id === c)?.label ?? c)}</a>`).join("")}</p>
    <details class="nsrc"><summary>来源 <span class="num">${tr.sources.length}</span></summary><div>${sourceLinks(tr.sources)}</div>${explain(sig)}</details>
  </li>`;
}

function dayPlan(p: DayPlan, title?: string): string {
  return `
  <div class="nday">
    <h3>${title ? `${esc(title)} · ` : ""}${esc(p.district)} · ${p.length === "day" ? "一天" : "半天"} · <span class="num">${p.stops.length}</span> 站</h3>
    <ol class="nday-stops">${p.stops
      .map((st, i) =>
        (i > 0 ? `<li class="nday-leg" aria-hidden="true"><span>${p.legs[i - 1] === null ? "距离不详" : `直线约 <span class="num">${p.legs[i - 1]! < 1 ? Math.round(p.legs[i - 1]! * 1000) + " m" : p.legs[i - 1]!.toFixed(1) + " km"}</span>`}</span></li>` : "") +
        (st.kind === "quest"
          ? `<li><a href="#/q/${st.quest.id}"><span class="nday-k">历史</span>${esc(st.quest.question)}</a></li>`
          : `<li><a href="#/c/${st.culture.id}"><span class="nday-k">${esc(st.culture.short)}</span>${esc(st.venue.name)}${st.venue.ageNote && /不适合/.test(st.venue.ageNote) ? `<small>只适合大人</small>` : ""}</a></li>`),
      )
      .join("")}</ol>
    ${p.adultsPart ? `<p class="hint">标「只适合大人」的放在最后，可以分头行动或提前结束。</p>` : ""}
    <p class="hint">距离是约略坐标之间的直线距离，有的只精确到街道。</p>
  </div>`;
}

function radarView(s: ViewState, d: NowData): string {
  const rows = radar(d.cultures, d.venues, d.events, d.trends, s.today);
  const mine = s.pass.cultures ?? {};
  return `
  <p class="hint pool-note">「热度」只算最近 18 个月里有多少个独立的具名来源提到它，不看社交媒体曝光量。长期存在的文化和正在升温的趋势分开看。</p>
  <section class="pool">
    <h2>正在升温 <span class="num">${d.trends.length}</span></h2>
    <p class="hint">每条都附来源。多个独立媒体都提到的才算「升温中」；只有一家媒体的，信号条少亮一格，标「有趋势线索」。</p>
    <ul class="ntrends">${d.trends
      .slice()
      .sort((a, b) => trendSignal(b, s.today).bars - trendSignal(a, s.today).bars)
      .map((tr) => trendCard(tr, d, s.today))
      .join("")}</ul>
  </section>
  <section class="pool">
    <h2>长期文化 <span class="num">${rows.length}</span></h2>
    <p class="hint">点进去有「第一次体验」指南、场地和相邻文化。</p>
    <ul class="ncultures">${rows
      .map(
        (r) => `<li><a href="#/c/${r.culture.id}">
          <b>${esc(r.culture.label)}</b>
          <span class="nc-meta">场地 <span class="num">${r.active}</span>${r.pending ? ` · 待确认 <span class="num">${r.pending}</span>` : ""} · 30 天内活动 <span class="num">${r.upcoming}</span> · 来源 <span class="num">${r.evidence}</span></span>
          ${trendBars(r.trends, s.today) === 3 ? `<span class="ntag t-rising">升温中</span>` : r.trends.length ? `<span class="ntag">有趋势线索</span>` : ""}${mine[r.culture.id] ? `<span class="ntag t-mine">${STATE_LABEL[mine[r.culture.id]!]}</span>` : ""}
        </a></li>`,
      )
      .join("")}</ul>
  </section>`;
}

function eventsView(s: ViewState, d: NowData, st: NowState): string {
  const w = windowRange(s, st.window);
  const all = eventsBetween(d.events, d.venues, w.from, w.to, s.today);
  const districts = [...new Set(all.map((l) => districtOf((l.event.venueId ? d.venues.find((v) => v.id === l.event.venueId)?.area : l.event.where) ?? "")).filter(Boolean))];
  const list = eventsBetween(d.events, d.venues, w.from, w.to, s.today, { district: st.district || undefined, freeOnly: st.freeOnly });
  return `
  <div class="nfilters">
    <div class="seg seg-sm3" role="group" aria-label="时间">
      ${(["week", "month", "trip"] as NowWindow[]).map((x) => `<button type="button" data-action="now-window" data-value="${x}" aria-pressed="${st.window === x}">${{ week: "本周", month: "30 天", trip: "行程中" }[x]}</button>`).join("")}
    </div>
    <div class="nchips">
      <button type="button" class="chip chip-review" data-action="now-district" data-value="" aria-pressed="${!st.district}">全部地区</button>
      ${districts.map((x) => `<button type="button" class="chip chip-review" data-action="now-district" data-value="${x}" aria-pressed="${st.district === x}">${esc(x)}</button>`).join("")}
      <button type="button" class="chip chip-review" data-action="now-free" aria-pressed="${st.freeOnly}">只看标明免费</button>
    </div>
  </div>
  <p class="hint pool-note">${esc(w.label)}：<b class="num">${list.length}</b> 个活动。过期的自动消失；来源过旧或没核对的标「待确认」。票价和场次只写来源原文有的，其余以官方为准${st.freeOnly ? "；目前没有活动的来源写明免费" : ""}。</p>
  ${list.length ? `<ul class="nevs">${list.map((l) => eventCard(l, d)).join("")}</ul>` : `<p class="empty-sub">这个时间段里没有收录到活动。活动数据在出发前更新，见「我的月票 → 设置」下的说明。</p>`}`;
}

function mineView(s: ViewState, d: NowData): string {
  const mine = s.pass.cultures ?? {};
  const by = (st: CultureState) => d.cultures.filter((c) => mine[c.id] === st);
  const sugg = diffuse(d.cultures, mine).slice(0, 5);
  const row = (c: Culture) => `<li><a href="#/c/${c.id}">${esc(c.label)}</a></li>`;
  return `
  <p class="hint pool-note">在每张文化卡上点「想试」「试过」「喜欢」。这里汇总你们的文化版图，并从试过和喜欢的文化出发，推荐相邻的文化。只存在这台手机上。</p>
  <section class="pool"><h2>我的文化版图</h2>
    <div class="nmine">
      ${(["love", "tried", "want"] as CultureState[]).map((st) => `<div><h3>${STATE_LABEL[st]} <span class="num">${by(st).length}</span></h3>${by(st).length ? `<ul>${by(st).map(row).join("")}</ul>` : `<p class="hint">还没有</p>`}</div>`).join("")}
    </div>
  </section>
  ${(() => {
    const seeds = d.cultures.filter((c) => mine[c.id] === "love" || mine[c.id] === "want");
    const plans = seeds.flatMap((c) => planDays(c, d, s.today, 1).map((p) => dayPlan(p, c.short))).slice(0, 3);
    return plans.length ? `<section class="pool"><h2>潮流探索日</h2><p class="hint">从你们「喜欢」和「想试」的文化出发，同一个区里的几站。</p>${plans.join("")}</section>` : "";
  })()}
  <section class="pool"><h2>兴趣扩散</h2>
    ${
      sugg.length
        ? `<ul class="ndiffuse">${sugg.map((x) => `<li><a href="#/c/${x.culture.id}"><b>${esc(x.culture.label)}</b><span>${x.via.map((v) => `从「${esc(v.from.label)}」：${esc(v.why)}`).join("；")}</span></a></li>`).join("")}</ul>`
        : `<p class="hint">先在一张文化卡上点「试过」或「喜欢」。</p>`
    }
  </section>`;
}

export function nowView(s: ViewState, d: NowData, st: NowState): string {
  return `
  ${passHead(s, "正在发生")}
  <section class="conditions" aria-label="上海正在发生">
    <div class="seg" role="group" aria-label="视图">
      ${(["radar", "events", "mine"] as NowMode[]).map((m) => `<button type="button" data-action="now-mode" data-value="${m}" aria-pressed="${st.mode === m}">${{ radar: "潮流雷达", events: "活动", mine: "我的版图" }[m]}</button>`).join("")}
    </div>
  </section>
  <main class="sheet" id="main">
    ${offlineNote(s)}
    ${st.mode === "radar" ? radarView(s, d) : st.mode === "events" ? eventsView(s, d, st) : mineView(s, d)}
  </main>
  ${tabBar("now")}`;
}

export function cultureView(s: ViewState, c: Culture, d: NowData): string {
  const mine = s.pass.cultures?.[c.id];
  const venues = d.venues
    .filter((v) => v.cultureIds.includes(c.id))
    .map((v) => ({ v, st: venueState(v, s.today) }))
    .sort((a, b) => ["active", "unconfirmed", "closed"].indexOf(a.st) - ["active", "unconfirmed", "closed"].indexOf(b.st));
  const trip = windowRange(s, "trip");
  const events = eventsBetween(d.events, d.venues, trip.from, trip.to, s.today, { cultureIds: [c.id] });
  const trends = d.trends.filter((tr) => tr.cultureIds.includes(c.id));
  const quests = questsForCulture(c, d.quests);
  const places = c.placeIds.map((id) => d.places.get(id)).filter((p): p is Place => !!p);
  const btn = (st: CultureState) => `<button type="button" class="btn ${mine === st ? "btn-primary" : ""}" data-action="culture-state" data-id="${c.id}" data-value="${st}" aria-pressed="${mine === st}">${STATE_LABEL[st]}</button>`;
  return `
  <header class="detail-head">
    <a href="#/now" class="back" aria-label="返回正在发生">${icons.back}</a>
    <div class="detail-title"><p>上海正在发生 · 文化卡</p><h1>${esc(c.label)}</h1></div>
  </header>
  <main class="sheet detail" id="main">
    ${offlineNote(s)}
    <article class="ticket">
      <p class="hook">${esc(c.summary)}</p>
      <p class="editorial">编辑整理的通用说明；下面「上海的事实」每条都有出处。</p>
      <div class="nstate" role="group" aria-label="我的文化版图">${btn("want")}${btn("tried")}${btn("love")}</div>
      <section class="first">
        <h2>第一次体验</h2>
        <p class="first-start"><b>最容易的入门</b>${esc(c.firstTime.start)}</p>
        <h3>会遇到什么</h3><ul class="nlist">${c.firstTime.expect.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <h3>小规矩</h3><ul class="nlist">${c.firstTime.etiquette.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      </section>
      <section class="hooks hooks-lg">
        <div><h2><span class="num">9</span> 岁</h2><p>${esc(c.kid9)}</p></div>
        <div><h2><span class="num">16</span> 岁</h2><p>${esc(c.kid16)}</p></div>
      </section>
      <section class="sources">
        <h2>上海的事实</h2>
        <ul class="nfacts">${c.facts
          .map((f) => {
            const sig = assessSignal(f.sources, null, s.today);
            return `<li><p>${esc(f.text)}</p><p class="sig-head">${bars(sig)}${freshBadge(sig)}</p><div class="nsrc-open">${sourceLinks(f.sources)}</div></li>`;
          })
          .join("")}</ul>
      </section>
      ${c.gap ? `<p class="verify">${icons.alert}<span><b>还没收录</b>：${esc(c.gap)}</span></p>` : ""}
    </article>

    <section class="pool">
      <h2>场地与长期项目 <span class="num">${venues.length}</span></h2>
      <p class="hint">只写来源里有的；开放时间、票价、是否营业请出发前在高德或大众点评确认。</p>
      <ul class="nvenues">${venues
        .map(
          ({ v, st }) => `<li class="nv-${st}">
          <h3>${esc(v.name)}<span class="ntag t-v-${st}">${VENUE_LABEL[st]}</span></h3>
          <p class="nev-where">${icons.pin}${esc(v.area)}</p>
          <p>${esc(v.note)}</p>
          ${v.ageNote ? `<p class="nage">${esc(v.ageNote)}</p>` : ""}
          ${v.geo ? `<p class="q-places"><a href="https://uri.amap.com/marker?position=${v.geo.lng},${v.geo.lat}&name=${encodeURIComponent(v.name)}&coordinate=gaode&callnative=1" target="_blank" rel="noopener">${icons.pin}高德导航</a> <span class="nage-quiet">坐标约略${v.geo.precision === "street" ? "，只到街道" : ""}${v.geo.via.startsWith("OSM") ? " · © OpenStreetMap 贡献者" : ""}</span></p>` : ""}
          ${v.placeId && d.places.get(v.placeId) ? `<p class="q-places">精选库 <a href="#/p/${v.placeId}">${esc(d.places.get(v.placeId)!.name)}</a></p>` : ""}
          ${(v.questIds ?? []).map((q) => d.quests.find((x) => x.id === q)).filter((q): q is Quest => !!q).map((q) => `<p class="q-places">探索任务 <a href="#/q/${q.id}">${esc(q.question)}</a></p>`).join("")}
          <details class="nsrc"><summary>来源${v.lastSeen ? ` · 最近一次 <span class="num">${esc(v.lastSeen)}</span>` : ""}</summary><div>${sourceLinks(v.sources)}</div></details>
        </li>`,
        )
        .join("")}</ul>
    </section>

    <section class="pool">
      <h2>行程中的活动 <span class="num">${events.length}</span></h2>
      ${events.length ? `<ul class="nevs">${events.map((l) => eventCard(l, d)).join("")}</ul>` : `<p class="hint">${esc(trip.label)}没有收录到这类活动。</p>`}
    </section>

    ${trends.length ? `<section class="pool"><h2>正在升温</h2><ul class="ntrends">${trends.map((tr) => trendCard(tr, d, s.today)).join("")}</ul></section>` : ""}

    ${(() => {
      const plans = planDays(c, d, s.today);
      return `<section class="pool"><h2>潮流探索日</h2>${
        plans.length
          ? `<p class="hint">同一个区里的几站：先看一个相关的历史任务，再去这类文化和相邻文化的场地。不是路线规划，距离和开放时间请看高德。</p>${plans.map((p) => dayPlan(p)).join("")}`
          : `<p class="hint">还凑不出同一个区里的两站以上（场地太少，或资料待确认）。</p>`
      }</section>`;
    })()}
    <section class="pool">
      <h2>兴趣扩散</h2>
      <ul class="ndiffuse">${diffuse(d.cultures, {}, [c.id])
        .map((x) => `<li><a href="#/c/${x.culture.id}"><b>${esc(x.culture.label)}</b><span>${esc(x.via[0]!.why)}</span></a></li>`)
        .join("")}</ul>
    </section>

    ${
      quests.length || places.length
        ? `<section class="pool"><h2>回到城市历史</h2><p class="hint">这种文化在上海的来路：</p><ul class="ndiffuse">${quests
            .map((q) => `<li><a href="#/q/${q.id}"><b>${esc(q.question)}</b><span>探索任务</span></a></li>`)
            .join("")}${places.map((p) => `<li><a href="#/p/${p.id}"><b>${esc(p.name)}</b><span>精选库地点</span></a></li>`).join("")}</ul></section>`
        : ""
    }
  </main>`;
}

/** 当代延伸 on a Quest: the Cultures that carry its subject into today, or nothing. */
export function questNowLinks(q: Quest, d: NowData): string {
  const cs = culturesForQuest(q, d.cultures);
  if (!cs.length) return "";
  return `<section class="q-related"><h2>当代延伸</h2><ul>${cs
    .map((c) => `<li><a href="#/c/${c.id}">${icons.compass}<span>${esc(c.label)}<small>上海正在发生 · 第一次体验指南</small></span></a></li>`)
    .join("")}</ul></section>`;
}
