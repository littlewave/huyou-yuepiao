import type { Selection, Slip } from "../domain/candidates";
import { BASES, DISTANCE_OPTIONS, EXCLUSION_REASONS, exclusionLabel, TIME_OPTIONS } from "../domain/constants";
import { DOMAINS } from "../domain/taxonomy";
import { isVisited, punchedDays, tripDays } from "../domain/pass";
import { assessSignal } from "../domain/signal";
import type { Base, Fragment, Mark, Pass, Place } from "../domain/types";
import { bookingLabel, dayOfMonth, durationPct, esc, hours, km, links, settingLabel, todayISO } from "./format";
import { icons } from "./icons";
import { signalLine, sourceBlock } from "./signal-view";

export interface ViewState {
  pass: Pass;
  base: Base;
  places: Place[];
  fragments: Fragment[];
  selection: Selection;
  online: boolean;
  today: string;
  /** Place id whose stamp should animate in on this render. */
  justPunched?: string;
  /** Place id highlighted by Surprise Pick. */
  picked?: string;
}

export type Tab = "today" | "quests" | "now" | "clues" | "map" | "pass";

// ── Shell ────────────────────────────────────────────────────────────────

export function passHead(s: ViewState, title: string): string {
  const days = tripDays(s.pass.trip);
  const punched = punchedDays(s.pass);
  const today = todayISO();
  const month = Number(s.pass.trip.start.slice(5, 7));
  const marks = Object.values(s.pass.marks);
  const visited = marks.filter((m) => isVisited(m.state)).length;
  const wanted = marks.filter((m) => m.state === "shortlist").length;
  const clues = marks.filter((m) => m.state === "clue").length;
  const landingDay = s.justPunched ? s.pass.marks[s.justPunched]?.day : undefined;
  return `
  <header class="head">
    <div class="head-top">
      <div>
        <h1>${esc(title)}</h1>
        <p class="head-sub">${esc(s.base.name)}出发 · 去过 <b class="num">${visited}</b> · 想去 <b class="num">${wanted}</b> · 线索 <b class="num">${clues}</b></p>
      </div>
      <div class="month num" aria-label="${month} 月">${month}</div>
    </div>
    <ol class="strip" aria-label="行程日">
      ${days
        .map((d) => {
          const cls = [punched.has(d) ? "is-punched" : "", d === today ? "is-today" : "", d === landingDay ? "is-landing" : ""].join(" ");
          const label = `${dayOfMonth(d)} 日${punched.has(d) ? "，已打孔" : ""}`;
          return `<li class="day ${cls}" aria-label="${label}"><span class="num">${dayOfMonth(d)}</span></li>`;
        })
        .join("")}
    </ol>
  </header>`;
}

export function tabBar(active: Tab): string {
  const tab = (id: Tab, href: string, icon: string, label: string) =>
    `<a href="${href}" class="tab" ${active === id ? 'aria-current="page"' : ""}>${icon}<span>${label}</span></a>`;
  return `
  <nav class="tabs" aria-label="主导航">
    ${tab("today", "#/", icons.list, "今日候选")}
    ${tab("quests", "#/quests", icons.compass, "探索")}
    ${tab("now", "#/now", icons.spark, "正在发生")}
    ${tab("clues", "#/clues", icons.clue, "线索流")}
    ${tab("map", "#/map", icons.map, "地图")}
    ${tab("pass", "#/pass", icons.ticket, "我的月票")}
  </nav>`;
}

export function offlineNote(s: ViewState): string {
  return s.online ? "" : `<p class="offline" role="status">${icons.offline}离线中 · 精选库照常可用，导航和来源链接需要网络</p>`;
}

/** The stamp for a mark, or nothing. Cinnabar only ever means 去过. */
export function stampFor(mark: Mark | undefined, landing: boolean, large = false): string {
  if (!mark) return "";
  const lg = large ? "stamp-lg" : "";
  if (isVisited(mark.state)) {
    const day = mark.day ? ` · ${dayOfMonth(mark.day)}日` : "";
    // On a slip, 想再去 rides as a tag beside the name so the stamp stays short.
    return `<span class="stamp ${lg} ${landing ? "is-landing" : ""}">去过${day}${large && mark.state === "revisit" ? " · 想再去" : ""}</span>`;
  }
  if (mark.state === "dismissed") return `<span class="stamp stamp-void ${lg}">排除${mark.reason ? ` · ${exclusionLabel(mark.reason)}` : ""}</span>`;
  return "";
}

// ── Today ────────────────────────────────────────────────────────────────

function conditionsBar(s: ViewState): string {
  const c = s.pass.conditions;
  return `
  <section class="conditions" aria-label="今日条件">
    <div class="seg" role="group" aria-label="有多少时间">
      ${TIME_OPTIONS.map((t) => `<button type="button" data-action="time" data-value="${t.id}" aria-pressed="${c.time === t.id}">${t.label}</button>`).join("")}
    </div>
    <div class="chips">
      <label class="chip chip-select">${icons.pin}
        <select data-action="distance" aria-label="离${esc(s.base.name)}多远">
          ${DISTANCE_OPTIONS.map((d) => `<option value="${d.km ?? ""}" ${c.maxKm === d.km ? "selected" : ""}>${d.label}</option>`).join("")}
        </select>
      </label>
      <button type="button" class="chip" data-action="rain" aria-pressed="${c.rainSafe}">${icons.umbrella}下雨也行</button>
      ${DOMAINS.map((d) => {
        const n = s.selection.domainCounts[d.id];
        const on = c.domains.includes(d.id);
        return `<button type="button" class="chip" data-action="domain" data-value="${d.id}" aria-pressed="${on}" ${n === 0 && !on ? "disabled" : ""}>${d.label}<span class="count num">${n}</span></button>`;
      }).join("")}
    </div>
  </section>`;
}

const stateTag: Partial<Record<Mark["state"], string>> = {
  shortlist: `<span class="want">${icons.bookmark}想去</span>`,
  clue: `<span class="want want-clue">${icons.clue}线索</span>`,
  revisit: `<span class="want">${icons.again}想再去</span>`,
};

function slip(s: ViewState, x: Slip): string {
  const p = x.place;
  const state = x.mark?.state;
  const sig = assessSignal(p.sources, p.verifiedAt, s.today);
  return `
  <li class="slip ${state ? `is-${state}` : ""} ${s.picked === p.id ? "is-picked" : ""} ${sig.freshness === "stale" ? "is-stale" : ""}" id="slip-${p.id}" style="--slip-hue: var(--t-${p.themes[0]})">
    <a href="#/p/${p.id}" class="slip-link">
      <div class="slip-stub" aria-hidden="true">
        <span class="stub-h num">${p.hours < 1 ? Math.round(p.hours * 60) : p.hours}</span>
        <span class="stub-u">${p.hours < 1 ? "分钟" : "小时"}</span>
      </div>
      <div class="slip-body">
        ${stampFor(x.mark, s.justPunched === p.id)}
        <h2 class="slip-name">${esc(p.name)}${state ? (stateTag[state] ?? "") : ""}</h2>
        <p class="slip-meta">${esc(p.area)} · 直线 <span class="num">${km(x.km)}</span> km · ${settingLabel[p.setting]}</p>
        <p class="slip-why">${esc(p.hook ?? p.localReason)}</p>
        <dl class="hooks">
          <div><dt><span class="num">9</span> 岁</dt><dd>${esc(p.kid9)}</dd></div>
          <div><dt><span class="num">16</span> 岁</dt><dd>${esc(p.kid16)}</dd></div>
        </dl>
        ${p.antiSignals?.length ? `<p class="anti">${icons.alert}${esc(p.antiSignals[0]!)}</p>` : ""}
        <div class="slip-foot">
          ${signalLine(p.sources, p.verifiedAt, s.today)}
          <span class="dur" role="img" aria-label="约 ${hours(p.hours)}"><i style="width:${durationPct(p.hours)}%"></i></span>
        </div>
      </div>
    </a>
  </li>`;
}

function emptyState(s: ViewState): string {
  const c = s.pass.conditions;
  const relax: string[] = [];
  if (c.domains.length) relax.push(`<button type="button" class="btn btn-quiet" data-action="clear-domains">不限领域</button>`);
  if (c.rainSafe) relax.push(`<button type="button" class="btn btn-quiet" data-action="rain">户外也可以</button>`);
  if (c.maxKm !== null && c.maxKm < 35) relax.push(`<button type="button" class="btn btn-quiet" data-action="distance-widen">放宽到 <span class="num">35</span> km</button>`);
  if (c.time !== "day") relax.push(`<button type="button" class="btn btn-quiet" data-action="time" data-value="day">时间放宽到一整天</button>`);
  const allDone = s.selection.stamped.length > 0 && relax.length === 0;
  return `
  <div class="empty">
    <p class="empty-title">${allDone ? "这些条件下的地方都盖过章了" : "今天的条件下没有候选"}</p>
    <p class="empty-sub">${allDone ? "换一个出发点，或者去线索流里找找新碎片。" : "放宽一项试试："}</p>
    ${relax.length ? `<div class="empty-actions">${relax.join("")}</div>` : ""}
  </div>`;
}

export function todayView(s: ViewState, questsHtml = ""): string {
  const { candidates, stamped } = s.selection;
  return `
  ${passHead(s, "沪游月票")}
  ${conditionsBar(s)}
  <main class="sheet" id="main">
    ${offlineNote(s)}
    <div class="sheet-bar">
      <p class="result" aria-live="polite">今天可选 <b class="num">${candidates.length}</b> 处</p>
      <button type="button" class="btn btn-pick" data-action="surprise" ${candidates.length < 2 ? "disabled" : ""}>${icons.shuffle}随便来一个</button>
    </div>
    ${candidates.length ? `<ul class="slips">${candidates.slice(0, 3).map((x) => slip(s, x)).join("")}</ul>` : emptyState(s)}
    ${questsHtml}
    ${candidates.length > 3 ? `<h2 class="more-head">更多候选 <span class="num">${candidates.length - 3}</span></h2><ul class="slips">${candidates.slice(3).map((x) => slip(s, x)).join("")}</ul>` : ""}
    ${
      stamped.length
        ? `<details class="stamped" ${candidates.length === 0 ? "open" : ""}>
            <summary>盖过章的 <span class="num">${stamped.length}</span> 处</summary>
            <ul class="slips">${stamped.map((x) => slip(s, x)).join("")}</ul>
          </details>`
        : ""
    }
  </main>
  ${tabBar("today")}`;
}

// ── Place detail ─────────────────────────────────────────────────────────

function statusActions(p: Place, mark: Mark | undefined): string {
  const btn = (state: string, label: string, icon: string, on: boolean, cls = "") =>
    `<button type="button" class="btn ${cls}" data-action="mark" data-state="${state}" data-id="${p.id}" aria-pressed="${on}">${icon}${label}</button>`;
  if (isVisited(mark?.state)) {
    return `<div class="actions">
      ${btn("revisit", mark?.state === "revisit" ? "已标记想再去" : "想再去", icons.again, mark?.state === "revisit", "btn-wide")}
      <button type="button" class="btn btn-quiet btn-undo" data-action="mark" data-state="punched" data-id="${p.id}">撤销打孔</button>
    </div>`;
  }
  if (mark?.state === "dismissed") {
    return `<div class="actions">
      <fieldset class="reasons"><legend>排除原因</legend>
        ${EXCLUSION_REASONS.map((r) => `<button type="button" class="chip chip-reason" data-action="reason" data-id="${p.id}" data-value="${r.id}" aria-pressed="${mark.reason === r.id}">${r.label}</button>`).join("")}
      </fieldset>
      <button type="button" class="btn btn-quiet btn-undo" data-action="mark" data-state="dismissed" data-id="${p.id}">撤销排除</button>
    </div>`;
  }
  return `<div class="actions">
    <button type="button" class="btn btn-primary" data-action="mark" data-state="punched" data-id="${p.id}">${icons.punch}去过 · 打孔</button>
    ${btn("shortlist", mark?.state === "shortlist" ? "已在想去" : "想去", icons.bookmark, mark?.state === "shortlist")}
    ${btn("clue", mark?.state === "clue" ? "已是线索" : "设为线索", icons.clue, mark?.state === "clue")}
    ${btn("dismissed", "排除", icons.x, false, "btn-quiet btn-wide")}
  </div>`;
}

export function placeView(s: ViewState, p: Place, distance: number, questsHtml = ""): string {
  const mark = s.pass.marks[p.id];
  const l = links(p);
  const related = s.fragments.filter((f) => f.relatedPlaceId === p.id);
  return `
  <header class="detail-head">
    <a href="#/" class="back" aria-label="返回今日候选">${icons.back}</a>
    <div class="detail-title">
      <h1>${esc(p.name)}</h1>
      <p>${esc(p.area)}</p>
    </div>
  </header>
  <main class="sheet detail" id="main">
    ${offlineNote(s)}
    <article class="ticket ${mark ? `is-${mark.state}` : ""}">
      ${mark && (isVisited(mark.state) || mark.state === "dismissed") ? `<div class="stamp-row">${stampFor(mark, s.justPunched === p.id, true)}</div>` : ""}
      ${p.hook ? `<p class="hook">${esc(p.hook)}</p>` : ""}
      <dl class="facts">
        <div><dt>约需</dt><dd class="num">${hours(p.hours)}</dd></div>
        <div><dt>离${esc(s.base.name)}</dt><dd><span class="num">${km(distance)}</span> km</dd></div>
        <div><dt>场地</dt><dd>${settingLabel[p.setting]}</dd></div>
        <div><dt>预约</dt><dd>${bookingLabel[p.booking]}</dd></div>
      </dl>
      <span class="dur dur-lg" role="img" aria-label="约 ${hours(p.hours)}，满格为 8 小时"><i style="width:${durationPct(p.hours)}%"></i></span>
      ${p.vibeTags?.length ? `<ul class="vibes" aria-label="氛围">${p.vibeTags.map((v) => `<li>${esc(v)}</li>`).join("")}</ul>` : ""}
      <section>
        <h2>本地人为什么去</h2>
        <p>${esc(p.localReason)}</p>
      </section>
      <section class="hooks hooks-lg">
        <div><h2><span class="num">9</span> 岁看点</h2><p>${esc(p.kid9)}</p></div>
        <div><h2><span class="num">16</span> 岁看点</h2><p>${esc(p.kid16)}</p></div>
      </section>
      ${
        p.bestVisitWindow || p.avoidWindow
          ? `<dl class="windows">
              ${p.bestVisitWindow ? `<div class="win-good"><dt>推荐时段</dt><dd>${esc(p.bestVisitWindow)}</dd></div>` : ""}
              ${p.avoidWindow ? `<div class="win-bad"><dt>避开</dt><dd>${esc(p.avoidWindow)}</dd></div>` : ""}
            </dl>`
          : ""
      }
      ${p.antiSignals?.length ? `<section class="anti-block"><h2>注意</h2><ul>${p.antiSignals.map((a) => `<li>${icons.alert}${esc(a)}</li>`).join("")}</ul></section>` : ""}
      ${p.december ? `<section><h2>十二月提醒</h2><p>${esc(p.december)}</p></section>` : ""}
      ${p.nextGlance ? `<section class="glance"><h2>顺路看一眼</h2><p><b>${esc(p.nextGlance.name)}</b> · ${esc(p.nextGlance.note)}</p></section>` : ""}
      ${questsHtml}
      ${sourceBlock(p.sources, p.verifiedAt, s.today)}
      ${related.length ? `<p class="related-frags">${icons.clue}线索流里有 <a href="#/clues"><b class="num">${related.length}</b> 条相关碎片</a></p>` : ""}
      <p class="verify ${p.verifiedAt ? "is-ok" : ""}">
        ${p.verifiedAt ? `已于 ${esc(p.verifiedAt)} 核实开放与预约信息。` : `${icons.alert}<span><b>未核实</b>：出发前请在高德或大众点评确认开放时间、是否闭馆和预约方式。</span>`}
      </p>
    </article>

    ${statusActions(p, mark)}

    <ul class="handoff" aria-label="打开其他应用">
      <li><a href="${l.amap}" target="_blank" rel="noopener">${icons.pin}高德导航${icons.external}</a></li>
      <li><a href="${l.dianping}" target="_blank" rel="noopener">大众点评查营业${icons.external}</a></li>
      <li><a href="${l.xhs}" target="_blank" rel="noopener">小红书看近况${icons.external}</a></li>
    </ul>
  </main>`;
}

// ── Pass ─────────────────────────────────────────────────────────────────

export function passView(s: ViewState, byId: Map<string, Place>, fragById: Map<string, Fragment>, coverageHtml = ""): string {
  type Entry = { id: string; name: string; area: string; href: string; m: Mark };
  const entries: Entry[] = Object.entries(s.pass.marks).flatMap(([id, m]) => {
    const p = byId.get(id);
    if (p) return [{ id, name: p.name, area: p.area, href: `#/p/${id}`, m }];
    const f = fragById.get(id);
    return f ? [{ id, name: f.text.length > 26 ? f.text.slice(0, 26) + "…" : f.text, area: `碎片 · ${f.area}`, href: `#/clues`, m }] : [];
  });
  const group = (...states: Mark["state"][]) => entries.filter((e) => states.includes(e.m.state));
  const visited = group("punched", "revisit").sort((a, b) => (a.m.day ?? "").localeCompare(b.m.day ?? ""));
  const want = group("shortlist");
  const clues = group("clue");
  const excluded = group("dismissed");
  const row = (e: Entry, extra = "") =>
    `<li class="row"><a href="${e.href}"><b>${esc(e.name)}</b><span>${esc(e.area)}</span></a>${extra}</li>`;

  return `
  ${passHead(s, "我的月票")}
  <main class="sheet" id="main">
    <section class="pass-group">
      <h2>去过 <span class="num">${visited.length}</span></h2>
      ${
        visited.length
          ? `<ul class="rows">${visited
              .map((e) =>
                row(
                  e,
                  `${e.m.state === "revisit" ? `<span class="tag-again">${icons.again}想再去</span>` : ""}<label class="row-day"><span class="sr">${esc(e.name)} 的日期</span><input type="date" data-action="punch-day" data-id="${e.id}" value="${e.m.day ?? ""}" min="${s.pass.trip.start}" max="${s.pass.trip.end}"></label>`,
                ),
              )
              .join("")}</ul>`
          : `<p class="hint">去过的地方在详情页点「去过 · 打孔」，那一天会在上面的日期条上打一个孔。</p>`
      }
    </section>
    <section class="pass-group">
      <h2>想去 <span class="num">${want.length}</span></h2>
      ${want.length ? `<ul class="rows">${want.map((e) => row(e)).join("")}</ul>` : `<p class="hint">看到感兴趣的地方点「想去」，它会排在今日候选的最前面。</p>`}
    </section>
    <section class="pass-group">
      <h2>线索 <span class="num">${clues.length}</span></h2>
      ${clues.length ? `<ul class="rows">${clues.map((e) => row(e)).join("")}</ul>` : `<p class="hint">在线索流里把感兴趣的碎片「转为线索」，它们会收在这里。</p>`}
    </section>
    ${coverageHtml}
    ${
      excluded.length
        ? `<section class="pass-group"><h2>排除 <span class="num">${excluded.length}</span></h2><ul class="rows rows-quiet">${excluded
            .map((e) => row(e, e.m.reason ? `<span class="tag-reason">${exclusionLabel(e.m.reason)}</span>` : ""))
            .join("")}</ul></section>`
        : ""
    }

    <section class="pass-group settings">
      <h2>设置</h2>
      <label class="field"><span>出发点</span>
        <select data-action="base">
          ${BASES.map((b) => `<option value="${b.id}" ${s.pass.baseId === b.id ? "selected" : ""}>${b.name}</option>`).join("")}
          ${s.pass.customBase ? `<option value="here" ${s.pass.baseId === "here" ? "selected" : ""}>我的位置（定位于 ${esc(s.pass.customBase.name)}）</option>` : ""}
        </select>
      </label>
      <button type="button" class="btn" data-action="locate">${icons.locate}用我现在的位置</button>
      <div class="field-pair">
        <label class="field"><span>行程开始</span><input type="date" data-action="trip-start" value="${s.pass.trip.start}"></label>
        <label class="field"><span>行程结束</span><input type="date" data-action="trip-end" value="${s.pass.trip.end}"></label>
      </div>
      <details class="transfer">
        <summary>换手机：导出 / 导入月票</summary>
        <p class="hint">月票只存在这台手机上。复制下面的内容，在另一台手机粘贴后点「导入」。</p>
        <textarea data-role="transfer" rows="4" spellcheck="false">${esc(JSON.stringify(s.pass))}</textarea>
        <div class="empty-actions">
          <button type="button" class="btn btn-quiet" data-action="copy">复制</button>
          <button type="button" class="btn btn-quiet" data-action="import">导入</button>
        </div>
      </details>
      <p class="hint">精选库共 <span class="num">${s.places.length}</span> 处，已核实 <span class="num">${s.places.filter((p) => p.verifiedAt).length}</span> 处；线索池 <span class="num">${s.fragments.length}</span> 条碎片。</p>
    </section>
  </main>
  ${tabBar("pass")}`;
}

export function notFoundView(): string {
  return `<main class="sheet" id="main"><div class="empty"><p class="empty-title">找不到这个地方</p><a class="btn" href="#/">回到今日候选</a></div></main>`;
}
