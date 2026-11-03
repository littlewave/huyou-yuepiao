import { coverage } from "../domain/coverage";
import { distanceKm } from "../domain/geo";
import { isTouched } from "../domain/pass";
import { citedEvidence, factCheck, questCounts, questsByEra, questsByTopic, questsForLens, questsIn, relatedQuests, trailStops, type FactCheck, type TodayQuests } from "../domain/quests";
import { assessSignal, SOURCE_LABEL } from "../domain/signal";
import { DOMAINS, ERAS, LENSES, LIFE_DOMAINS, domainOf, domainsOf, lensesFor, topicLabel, type DomainId, type LensId } from "../domain/taxonomy";
import type { Area, Base, Evidence, Observation, Place, Quest, Review, Trail } from "../domain/types";
import { esc, km, settingLabel } from "./format";
import { icons } from "./icons";
import { bars, explain, freshBadge } from "./signal-view";
import { offlineNote, passHead, tabBar, type ViewState } from "./views";

export interface Knowledge {
  quests: Quest[];
  trails: Trail[];
  areas: Map<string, Area>;
  evidence: Map<string, Evidence>;
  places: Map<string, Place>;
}

const DIFFICULTY = ["", "入门", "要动脑", "有挑战"];
const domainLabel = (id: DomainId) => DOMAINS.find((d) => d.id === id)!.label;

function checkTag(fc: FactCheck): string {
  if (fc.problems) return `<span class="qcheck is-open">${icons.alert}你标了 ${fc.problems} 条有问题</span>`;
  if (fc.checked < fc.total) return `<span class="qcheck is-open">${icons.alert}部分证据未核对</span>`;
  if (fc.aiOnly) return `<span class="qcheck is-ai">已比对来源 · 待你复核</span>`;
  return `<span class="qcheck is-ok">已核实</span>`;
}

function progressTag(q: Quest, obs: Observation | undefined): string {
  if (obs?.doneOn) return `<span class="qprog is-done">${icons.punch}做过 · <span class="num">${Number(obs.doneOn.slice(5, 7))}/${Number(obs.doneOn.slice(8, 10))}</span></span>`;
  if (obs?.found.length) return `<span class="qprog">找到 <span class="num">${obs.found.length}/${q.lookFor.length}</span></span>`;
  return "";
}

function questCard(q: Quest, k: Knowledge, o: { distance?: number; obs?: Observation; reason?: string; reviews?: Record<string, Review> } = {}): string {
  const { distance, obs, reason, reviews } = o;
  const fc = factCheck(q, k.evidence, reviews);
  return `
  <li class="qcard ${obs?.doneOn ? "is-done" : ""}">
    <a href="#/q/${q.id}" class="slip-link qcard-link">
      <div class="slip-stub" aria-hidden="true"><span class="stub-h num">${q.minutes}</span><span class="stub-u">分钟</span></div>
      <div class="slip-body">
        <h3 class="qcard-q">${esc(q.question)}</h3>
        ${reason ? `<p class="qcard-why">${esc(reason)}</p>` : ""}
        <p class="slip-meta">${esc(q.scope ?? k.places.get(q.placeIds[0]!)?.name ?? "")}${distance === undefined ? "" : ` · 直线 <span class="num">${km(distance)}</span> km`} · ${settingLabel[q.setting]} · ${DIFFICULTY[q.difficulty]}</p>
        <p class="qcard-domains">${[...new Set(q.topics.map(domainOf))].map((d) => `<span>${esc(domainLabel(d))}</span>`).join("")}</p>
        <div class="slip-foot">${bars(assessSignal(fc.sources, null, ""))}${checkTag(fc)}${progressTag(q, obs)}</div>
      </div>
    </a>
  </li>`;
}

function trailCard(t: Trail, k: Knowledge): string {
  const steps = t.questIds.map((id) => k.quests.find((q) => q.id === id)).filter((q): q is Quest => !!q);
  return `
  <details class="trail">
    <summary>
      <span class="trail-kicker">探索线路 · 约 <span class="num">${Math.round(t.minutes / 60)}</span> 小时 · <span class="num">${steps.length}</span> 站</span>
      <b>${esc(t.title)}</b>
      <span class="trail-q">${esc(t.question)}</span>
      <span class="trail-more">展开 ${steps.length} 站 ▾</span>
    </summary>
    <ol class="trail-steps">${steps.map((q) => `<li><a href="#/q/${q.id}">${esc(q.question)}</a></li>`).join("")}</ol>
  </details>`;
}

export type DiscoverMode = "space" | "time" | "topic" | "life";

export interface DiscoverState {
  mode: DiscoverMode;
  domain: DomainId | null;
  lens: LensId | null;
}

const MODES: { id: DiscoverMode; label: string; hint: string }[] = [
  { id: "space", label: "空间", hint: "按区域排，离出发点近的在前。地图页打开「探索任务」图层，可以看到它们在城里的位置。" },
  { id: "time", label: "时间", hint: "按时代地层排，从先民到当下。一个任务跨几个时代，就会出现在几处。" },
  { id: "topic", label: "主题", hint: "先选一个领域，再按主题往下钻。" },
  { id: "life", label: "生活", hint: "只看城市日常：菜场、街道、通勤、早饭、公共空间和邻里。" },
];

function group(s: ViewState, title: string, sub: string, qs: Quest[], k: Knowledge, extra = "", base?: Base): string {
  return `
  <section class="pool">
    <h2>${esc(title)} <span class="num">${qs.length}</span>${sub ? `<span class="pool-sub">${sub}</span>` : ""}</h2>
    ${extra}
    <ul class="qcards">${qs.map((q) => questCard(q, k, { distance: base ? distanceKm(base, q) : undefined, obs: s.pass.observations?.[q.id], reviews: s.pass.reviews })).join("")}</ul>
  </section>`;
}

export function questsView(s: ViewState, k: Knowledge, d: DiscoverState): string {
  const pool = d.lens ? questsForLens(k.quests, d.lens) : questsIn(k.quests, null);
  const mode = MODES.find((m) => m.id === d.mode)!;
  let body = "";
  if (d.mode === "space" || d.mode === "life") {
    const list = d.mode === "life" ? pool.filter((q) => domainsOf(q.topics).some((x) => LIFE_DOMAINS.includes(x))) : pool;
    const byArea = new Map<string, Quest[]>();
    for (const q of list) byArea.set(q.areaId, [...(byArea.get(q.areaId) ?? []), q]);
    const near = (qs: Quest[]) => Math.min(...qs.map((q) => distanceKm(s.base, q)));
    body = [...byArea]
      .sort((a, b) => near(a[1]) - near(b[1]))
      .map(([areaId, qs]) => {
        const trails = d.mode === "space" && !d.lens ? k.trails.filter((t) => t.areaId === areaId) : [];
        const sorted = [...qs].sort((a, b) => distanceKm(s.base, a) - distanceKm(s.base, b));
        return group(s, k.areas.get(areaId)?.name ?? areaId, `最近 <span class="num">${km(near(qs))}</span> km`, sorted, k, trails.map((t) => trailCard(t, k)).join(""), s.base);
      })
      .join("");
  } else if (d.mode === "time") {
    body = questsByEra(pool)
      .map((g) => {
        const era = ERAS.find((e) => e.id === g.era)!;
        const years = era.from === null ? `${era.to} 年以前` : era.to === null ? `${era.from} 年至今` : `${era.from}–${era.to}`;
        return group(s, era.label, `<span class="num">${years}</span>`, g.quests, k);
      })
      .join("");
    const undated = pool.filter((q) => !q.eras?.length).length;
    if (undated) body += `<p class="hint">另有 <b class="num">${undated}</b> 个任务没有标时代（只在有把握时才标）。</p>`;
  } else {
    const counts = questCounts(pool);
    body = `
    <div class="domain-grid">
      ${DOMAINS.map(
        (x) =>
          `<button type="button" class="dgrid ${d.domain === x.id ? "is-on" : ""}" data-action="quest-domain" data-value="${d.domain === x.id ? "" : x.id}" aria-pressed="${d.domain === x.id}" ${counts[x.id] ? "" : "disabled"}><span>${esc(x.label)}</span><b class="num">${counts[x.id] ?? 0}</b></button>`,
      ).join("")}
    </div>
    ${d.domain ? questsByTopic(pool, d.domain).map((g) => group(s, topicLabel(g.topic), "", g.quests, k)).join("") : `<p class="hint">点一个领域，看它下面的主题。灰掉的领域还没有任务。</p>`}`;
  }
  const lensCount = (id: LensId) => questsForLens(k.quests, id).length;
  return `
  ${passHead(s, "探索")}
  <section class="conditions" aria-label="发现方式">
    <div class="seg seg-4" role="group" aria-label="发现方式">
      ${MODES.map((m) => `<button type="button" data-action="discover-mode" data-value="${m.id}" aria-pressed="${d.mode === m.id}">${m.label}</button>`).join("")}
    </div>
    <div class="chips" role="group" aria-label="探索身份">
      <button type="button" class="chip" data-action="quest-lens" data-value="" aria-pressed="${d.lens === null}">不限身份</button>
      ${LENSES.map((l) => `<button type="button" class="chip" data-action="quest-lens" data-value="${l.id}" aria-pressed="${d.lens === l.id}">${esc(l.label)}<span class="count num">${lensCount(l.id)}</span></button>`).join("")}
    </div>
  </section>
  <main class="sheet" id="main">
    ${offlineNote(s)}
    <p class="hint pool-note">${mode.hint}${d.lens ? ` 现在以「${esc(LENSES.find((l) => l.id === d.lens)!.label)}」的眼光看：只留下和这个身份相关的任务，最贴合的排在前面。` : ""}</p>
    ${body || `<p class="hint">这个组合下还没有任务。</p>`}
  </main>
  ${tabBar("quests")}`;
}

function evidenceItem(e: Evidence, n: number, today: string, review?: Review): string {
  const sig = assessSignal(e.sources, null, today);
  const vbtn = (v: Review["verdict"], label: string) =>
    `<button type="button" class="chip chip-review v-${v}" data-action="review" data-id="${e.id}" data-value="${v}" aria-pressed="${review?.verdict === v}">${label}</button>`;
  return `
  <li class="ev" id="ev-${e.id}">
    <p class="ev-claim"><span class="ev-n num">${n}</span>${esc(e.claim)}</p>
    <p class="sig-head">${bars(sig)}<b>${esc(sig.strengthLabel)}</b>${freshBadge(sig)}
      ${
        review?.verdict === "ok" || e.checkedBy === "owner"
          ? `<span class="qcheck is-ok">你已核实 <span class="num">${esc(review?.on ?? e.checkedAt ?? "")}</span></span>`
          : review?.verdict === "problem"
            ? `<span class="qcheck is-open">${icons.alert}你标了有问题</span>`
            : e.checkedAt
              ? `<span class="qcheck is-ai">AI 已比对原文 <span class="num">${esc(e.checkedAt)}</span></span>`
              : `<span class="qcheck is-open">${icons.alert}未核对</span>`
      }
    </p>
    ${e.disputed ? `<p class="ev-disputed">${icons.alert}<span><b>说法不一</b>${esc(e.disputed)}</span></p>` : ""}
    <ul class="src-list">
      ${e.sources
        .map(
          (src) => `<li>
            <span class="src-kind k-${src.kind}">${SOURCE_LABEL[src.kind]}</span>
            ${src.url ? `<a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(src.name)}${icons.external}</a>` : `<span>${esc(src.name)}</span>`}
            <span class="src-date num">${src.date ? esc(src.date) : "日期不明"}</span>
          </li>`,
        )
        .join("")}
    </ul>
    ${explain(sig)}
    <div class="ev-review" role="group" aria-label="你读了原文以后"><span>读了原文以后：</span>${vbtn("ok", "对得上")}${vbtn("problem", "有问题")}</div>
  </li>`;
}

export function questView(s: ViewState, q: Quest, k: Knowledge, nowLinks = ""): string {
  const obs = s.pass.observations?.[q.id];
  const cited = citedEvidence(q);
  const ref = (id: string) => `<a href="#ev-${id}" class="ev-ref num" data-action="ev-jump" data-id="${id}" aria-label="证据 ${cited.indexOf(id) + 1}">${cited.indexOf(id) + 1}</a>`;
  const fc = factCheck(q, k.evidence, s.pass.reviews);
  const places = q.placeIds.map((id) => k.places.get(id)).filter((p): p is Place => !!p);
  const eras = (q.eras ?? []).map((id) => ERAS.find((e) => e.id === id)!.label);
  const lenses = lensesFor(q.topics).slice(0, 2).map((id) => LENSES.find((l) => l.id === id)!.label);
  const amap = `https://uri.amap.com/marker?position=${q.lng},${q.lat}&name=${encodeURIComponent(q.scope ?? places[0]?.name ?? q.question)}&coordinate=gaode&callnative=1`;
  return `
  <header class="detail-head">
    <a href="#/quests" class="back" aria-label="返回探索">${icons.back}</a>
    <div class="detail-title">
      <p>${esc(k.areas.get(q.areaId)?.name ?? "")} · 探索任务</p>
      <h1>${esc(q.question)}</h1>
    </div>
  </header>
  <main class="sheet detail" id="main">
    ${offlineNote(s)}
    <article class="ticket quest">
      <p class="hook">${esc(q.why)}</p>
      <dl class="facts">
        <div><dt>约需</dt><dd><span class="num">${q.minutes}</span> 分钟</dd></div>
        <div><dt>场地</dt><dd>${settingLabel[q.setting]}</dd></div>
        <div><dt>难度</dt><dd>${DIFFICULTY[q.difficulty]}</dd></div>
        <div><dt>光线</dt><dd>${q.daylight ? "要白天" : "不限"}</dd></div>
      </dl>
      <ul class="vibes" aria-label="主题">${q.topics.map((t) => `<li>${esc(topicLabel(t))}</li>`).join("")}${eras.map((e) => `<li class="era">${esc(e)}</li>`).join("")}</ul>
      ${lenses.length ? `<p class="lens-line">适合 ${lenses.map((l) => `<b>${esc(l)}</b>`).join(" · ")}</p>` : ""}
      ${q.scope ? `<section><h2>范围</h2><p>${esc(q.scope)}</p></section>` : ""}
      <section>
        <h2>背景</h2>
        ${q.background.map((b) => `<p>${esc(b.text)}${b.evidence.map(ref).join("")}</p>`).join("")}
      </section>
      <section>
        <h2>现场怎么看</h2>
        <ol class="steps">${q.tasks.map((t) => `<li>${esc(t)}</li>`).join("")}</ol>
      </section>
      <section>
        <h2>要找的证据 <span class="h-sub">在现场找到就点一下</span></h2>
        <ul class="look">${q.lookFor
          .map((t, i) => {
            const on = !!obs?.found.includes(i);
            return `<li><button type="button" class="look-btn" data-action="found" data-id="${q.id}" data-index="${i}" aria-pressed="${on}"><i aria-hidden="true">${on ? icons.check : ""}</i>${esc(t)}</button></li>`;
          })
          .join("")}</ul>
      </section>
      <section class="hooks hooks-lg">
        <div><h2><span class="num">9</span> 岁看点</h2><p>${esc(q.kid9)}</p></div>
        <div><h2><span class="num">16</span> 岁看点</h2><p>${esc(q.kid16)}</p></div>
      </section>
      ${q.further.length ? `<section><h2>回家再想想</h2><ul class="further">${q.further.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></section>` : ""}
      <section>
        <h2>怎么去</h2>
        <p>${esc(q.access.transit)}${q.access.stepFree === true ? "；步道无障碍贯通" : ""}${q.coordsApprox ? "。起点为约略坐标" : ""}</p>
        ${places.length ? `<p class="q-places">相关地点 ${places.map((p) => `<a href="#/p/${p.id}">${esc(p.name)}</a>`).join("、")}</p>` : ""}
      </section>
      ${trailStops(q, k.trails)
        .map(({ trail, index, prev, next }) => {
          const name = (id?: string) => (id ? k.quests.find((x) => x.id === id) : undefined);
          const p = name(prev);
          const n = name(next);
          return `<section class="q-trail"><h2>探索线路 · 第 <span class="num">${index + 1}</span> / <span class="num">${trail.questIds.length}</span> 站</h2>
            <p><b>${esc(trail.title)}</b></p>
            <div class="q-trail-nav">${p ? `<a href="#/q/${p.id}"><span>上一站</span>${esc(p.question)}</a>` : ""}${n ? `<a href="#/q/${n.id}"><span>下一站</span>${esc(n.question)}</a>` : ""}</div></section>`;
        })
        .join("")}
      ${(() => {
        const rel = relatedQuests(q, k.quests);
        return rel.length
          ? `<section class="q-related"><h2>相关探索</h2><ul>${rel
              .map((x) => {
                const shared = x.topics.filter((t) => q.topics.includes(t)).map(topicLabel);
                const why = shared.length ? `同为「${shared.join("、")}」` : x.areaId === q.areaId ? `同在${k.areas.get(x.areaId)?.name ?? ""}` : "相近领域";
                return `<li><a href="#/q/${x.id}">${icons.clue}<span>${esc(x.question)}<small>${esc(why)} · ${esc(k.areas.get(x.areaId)?.name ?? "")}</small></span></a></li>`;
              })
              .join("")}</ul></section>`
          : "";
      })()}
      ${nowLinks}
      <section class="sources">
        <h2>证据与出处</h2>
        <ol class="evs">${cited.map((id, i) => (k.evidence.get(id) ? evidenceItem(k.evidence.get(id)!, i + 1, s.today, s.pass.reviews?.[id]) : "")).join("")}</ol>
      </section>
      <p class="verify ${fc.checked === fc.total && !fc.aiOnly ? "is-ok" : ""}">
        ${icons.alert}<span>${
          fc.problems
            ? `<b>你标了 ${fc.problems} 条证据有问题</b>：背景里相应的说法先别信；导出月票后运行 npm run audit -- --pass 文件，可以列出要改的地方。`
            : fc.checked < fc.total
            ? `<b>部分证据未核对</b>：有 ${fc.total - fc.checked} 条证据还没比对原文，背景里相应的说法请当作待查。`
            : fc.aiOnly
              ? `<b>已比对来源，待你复核</b>：每条证据都由 AI 读过链接原文，${fc.disputed ? `其中 ${fc.disputed} 条各来源说法不一。` : ""}开放情况和能否进入请出发前在高德确认。`
              : "证据均已由你核实。"
        }</span>
      </p>
    </article>
    <section class="observe" aria-label="观察记录">
      <h2>观察记录</h2>
      <label class="field"><span>在现场看到了什么？和背景里说的一样吗？</span>
        <textarea data-action="note" data-id="${q.id}" rows="4" placeholder="比如：塔顶的钟已经没了，但挂钟的铁架还在。">${esc(obs?.note ?? "")}</textarea>
      </label>
      <p class="hint">只存在这台手机上，随月票一起导出。${obs?.updatedAt ? ` 上次更新 ${esc(obs.updatedAt.slice(5, 10).replace("-", "/"))} ${esc(obs.updatedAt.slice(11, 16))}。` : ""}</p>
      <button type="button" class="btn ${obs?.doneOn ? "" : "btn-primary"} btn-wide" data-action="quest-done" data-id="${q.id}" aria-pressed="${!!obs?.doneOn}">${icons.punch}${obs?.doneOn ? `做过了 · ${Number(obs.doneOn.slice(5, 7))} 月 ${Number(obs.doneOn.slice(8, 10))} 日（再点取消）` : "做完了，记下这一天"}</button>
    </section>
    <ul class="handoff" aria-label="打开其他应用">
      <li><a href="${amap}" target="_blank" rel="noopener">${icons.pin}高德导航到起点${icons.external}</a></li>
    </ul>
  </main>`;
}

/** The Quests list on a Place's detail view, or nothing. */
export function placeQuests(p: Place, k: Knowledge): string {
  const qs = k.quests.filter((q) => q.placeIds.includes(p.id));
  if (!qs.length) return "";
  return `<section class="place-quests"><h2>在这里可以做的探索</h2><ul>${qs.map((q) => `<li><a href="#/q/${q.id}">${icons.clue}${esc(q.question)}</a></li>`).join("")}</ul></section>`;
}

/** The 今天也可以做的探索 block under today's Candidates, or a one-line pointer when nothing fits. */
export function todayQuests(s: ViewState, t: TodayQuests, k: Knowledge): string {
  if (t.total === 0) return `<p class="hint today-quests-none">今天的条件下没有合适的探索任务，<a href="#/quests">去探索页看看全部</a>。</p>`;
  return `
  <section class="pool today-quests">
    <div class="pool-head">
      <h2>今天也可以做的探索 <span class="num">${t.total}</span></h2>
      <a class="more" href="#/quests">全部</a>
    </div>
    <p class="hint">按距离排，你们还没碰过的领域和区域会往前提；做过的不再出现，每条尽量来自不同领域。</p>
    <ul class="qcards">${t.picks.map((x) => questCard(x.quest, k, { distance: x.km, obs: s.pass.observations?.[x.quest.id], reason: x.reasons[0], reviews: s.pass.reviews })).join("")}</ul>
  </section>`;
}

function bar(t: { touched: number; total: number }): string {
  const pct = t.total ? Math.round((t.touched / t.total) * 100) : 0;
  return `<span class="cov-bar" role="img" aria-label="${t.touched} / ${t.total}"><i style="width:${pct}%"></i></span><span class="num cov-n">${t.touched}/${t.total}</span>`;
}

/** 探索覆盖面 for the Pass view: Domains, Areas and Eras touched against what the Quests cover, and the done list. */
export function coverageView(s: ViewState, k: Knowledge): string {
  const obs = s.pass.observations ?? {};
  const c = coverage(k.quests, obs);
  const untouched = DOMAINS.filter((d) => c.domains[d.id].touched === 0);
  const done = k.quests.filter((q) => obs[q.id]?.doneOn).sort((a, b) => obs[a.id]!.doneOn!.localeCompare(obs[b.id]!.doneOn!));
  const open = k.quests.filter((q) => isTouched(obs[q.id]) && !obs[q.id]?.doneOn);
  const row = (q: Quest, extra: string) => `<li class="row"><a href="#/q/${q.id}"><b>${esc(q.question)}</b><span>${esc(k.areas.get(q.areaId)?.name ?? "")}</span></a>${extra}</li>`;
  return `
  <section class="pass-group coverage">
    <h2>探索覆盖面 <span class="num">${c.touched}</span><span class="pool-sub">共 <span class="num">${c.total}</span> 个任务，做完 <span class="num">${c.done}</span></span></h2>
    ${c.touched === 0 ? `<p class="hint">在任务里点「找到」、写观察记录或者点「做完了」，这里就会亮起来。</p>` : ""}
    <h3 class="cov-h">领域</h3>
    <ul class="cov">${DOMAINS.map((d) => `<li class="${c.domains[d.id].touched ? "" : "is-dark"}"><span>${esc(d.label)}</span>${bar(c.domains[d.id])}</li>`).join("")}</ul>
    ${c.touched > 0 && untouched.length ? `<p class="hint">还没碰过：${untouched.map((d) => esc(d.label)).join("、")}。</p>` : ""}
    <h3 class="cov-h">区域</h3>
    <ul class="cov">${c.areas.map((a) => `<li class="${a.touched ? "" : "is-dark"}"><span>${esc(k.areas.get(a.areaId)?.name ?? a.areaId)}</span>${bar(a)}</li>`).join("")}</ul>
    <h3 class="cov-h">时代</h3>
    <ul class="cov">${ERAS.filter((e) => c.eras[e.id].total).map((e) => `<li class="${c.eras[e.id].touched ? "" : "is-dark"}"><span>${esc(e.label)}</span>${bar(c.eras[e.id])}</li>`).join("")}</ul>
  </section>
  ${open.length ? `<section class="pass-group"><h2>进行中的探索 <span class="num">${open.length}</span></h2><ul class="rows">${open.map((q) => row(q, progressTag(q, obs[q.id]))).join("")}</ul></section>` : ""}
  ${done.length ? `<section class="pass-group"><h2>做过的探索 <span class="num">${done.length}</span></h2><ul class="rows">${done.map((q) => row(q, progressTag(q, obs[q.id]))).join("")}</ul></section>` : ""}`;
}
