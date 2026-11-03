import { exclusionLabel } from "../domain/constants";
import { assessSignal, SOURCE_LABEL } from "../domain/signal";
import type { Fragment, Place } from "../domain/types";
import { esc, themeLabel } from "./format";
import { icons } from "./icons";
import { bars, explain, freshBadge } from "./signal-view";
import { offlineNote, passHead, tabBar, type ViewState } from "./views";

export type ClueGroup = "place" | "theme";

/** The id a Fragment's 转为线索 marks: its related Place when there is one, else the Fragment itself. */
export const clueTarget = (f: Fragment) => f.relatedPlaceId ?? f.id;

function fragCard(s: ViewState, f: Fragment, byId: Map<string, Place>): string {
  const sig = assessSignal(f.sources, null, s.today);
  const lead = f.sources[0]!;
  const target = clueTarget(f);
  const mark = s.pass.marks[target];
  const related = f.relatedPlaceId ? byId.get(f.relatedPlaceId) : undefined;
  const isClue = mark?.state === "clue";
  const action =
    f.tier === "anti"
      ? ""
      : mark && mark.state !== "clue"
        ? `<span class="frag-state">已在月票：${{ shortlist: "想去", punched: "去过", revisit: "想再去", dismissed: "排除" }[mark.state] ?? ""}</span>`
        : `<button type="button" class="btn btn-frag" data-action="mark" data-state="clue" data-id="${target}" aria-pressed="${isClue}">${icons.clue}${isClue ? "已是线索" : "转为线索"}</button>`;
  return `
  <li class="frag tier-${f.tier} fr-${sig.freshness}" id="frag-${f.id}">
    <div class="frag-stub" aria-hidden="true"><span>${SOURCE_LABEL[lead.kind]}</span></div>
    <div class="frag-body">
      <p class="frag-text">${esc(f.text)}</p>
      <p class="frag-meta">
        ${bars(sig)}
        <span>${f.sources.map((src) => (src.url ? `<a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(src.name)}</a>` : esc(src.name))).join(" · ")}</span>
        ${lead.date ? `<span class="num">${lead.kind === "osm" ? "查询于 " : ""}${esc(lead.date)}</span>` : ""}
        ${freshBadge(sig)}
      </p>
      <p class="frag-where">${icons.pin}${esc(f.area)}${related ? ` · 关联 <a href="#/p/${related.id}">${esc(related.name)}</a>` : ""}${f.coordsApprox ? `<span class="approx">坐标约略</span>` : ""}</p>
      ${f.weakReason ? `<p class="frag-weak"><b>为什么是弱信号</b>${esc(f.weakReason)}</p>` : ""}
      ${f.antiReason ? `<p class="frag-anti"><span class="tag-reason">${exclusionLabel(f.antiReason)}</span></p>` : ""}
      ${f.antiSignals?.length ? `<p class="anti">${icons.alert}${f.antiSignals.map(esc).join("；")}</p>` : ""}
      <div class="frag-foot">${explain(sig)}${action}</div>
    </div>
  </li>`;
}

function grouped(s: ViewState, frags: Fragment[], by: ClueGroup, byId: Map<string, Place>): string {
  const groups = new Map<string, Fragment[]>();
  for (const f of frags) {
    const key =
      by === "place"
        ? f.relatedPlaceId
          ? (byId.get(f.relatedPlaceId)?.name ?? f.area)
          : `不在精选库 · ${f.area}`
        : f.themes?.[0]
          ? themeLabel(f.themes[0])
          : "未分类";
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  return [...groups]
    .map(([key, list]) => `<h3 class="frag-group">${esc(key)}</h3><ul class="frags">${list.map((f) => fragCard(s, f, byId)).join("")}</ul>`)
    .join("");
}

export function cluesView(s: ViewState, group: ClueGroup, byId: Map<string, Place>): string {
  const byTier = (t: Fragment["tier"]) => s.fragments.filter((f) => f.tier === t);
  // Newest first, undated last.
  const order = (a: Fragment, b: Fragment) => (b.sources[0]?.date ?? "").localeCompare(a.sources[0]?.date ?? "");
  const raw = byTier("fragment").sort(order);
  const weak = byTier("weak").sort(order);
  const anti = byTier("anti");
  return `
  ${passHead(s, "线索流")}
  <main class="sheet" id="main">
    ${offlineNote(s)}
    <p class="hint pool-note">出发前从新闻、政府发布、Reddit、博客和开放地图里收集的碎片，每条都带来源和日期。可信度不一，看「来源说明」再决定要不要跟。</p>

    <section class="pool">
      <div class="pool-head">
        <h2>原始碎片 <span class="num">${raw.length}</span></h2>
        <div class="seg seg-sm" role="group" aria-label="分组方式">
          <button type="button" data-action="clue-group" data-value="place" aria-pressed="${group === "place"}">按地点</button>
          <button type="button" data-action="clue-group" data-value="theme" aria-pressed="${group === "theme"}">按主题</button>
        </div>
      </div>
      ${grouped(s, raw, group, byId)}
    </section>

    <section class="pool">
      <h2>弱信号 <span class="num">${weak.length}</span></h2>
      <p class="hint">信息不完整，但可能有意思。值得多查一步，也可能什么都没有。</p>
      <ul class="frags">${weak.map((f) => fragCard(s, f, byId)).join("")}</ul>
    </section>

    <section class="pool">
      <h2>反推荐 · 负空间 <span class="num">${anti.length}</span></h2>
      <p class="hint">刻意不收进精选库的地方，以及原因。</p>
      <ul class="frags">${anti.map((f) => fragCard(s, f, byId)).join("")}</ul>
    </section>
  </main>
  ${tabBar("clues")}`;
}
