import { assessSignal, SOURCE_LABEL, type Signal } from "../domain/signal";
import type { Source } from "../domain/types";
import { esc } from "./format";
import { icons } from "./icons";

export const bars = (sig: Signal) =>
  `<span class="bars b${sig.bars}" role="img" aria-label="信号强度：${sig.strengthLabel}"><i></i><i></i><i></i></span>`;

export const freshBadge = (sig: Signal) => `<span class="fresh f-${sig.freshness}">${esc(sig.freshnessLabel)}</span>`;

/** One-line signal summary for slips and fragment cards. */
export function signalLine(sources: Source[], verifiedAt: string | null, today: string): string {
  const sig = assessSignal(sources, verifiedAt, today);
  const kinds = [...new Set(sources.map((s) => SOURCE_LABEL[s.kind]))];
  return `<span class="signal">${bars(sig)}<span class="src-tags">${kinds.map((k) => `<b>${esc(k)}</b>`).join("")}</span>${freshBadge(sig)}</span>`;
}

/** Full source block: strength, freshness, each source with its date and link, and the 来源说明 note. */
export function sourceBlock(sources: Source[], verifiedAt: string | null, today: string): string {
  const sig = assessSignal(sources, verifiedAt, today);
  return `
  <section class="sources">
    <h2>来源</h2>
    <p class="sig-head">${bars(sig)}<b>${esc(sig.strengthLabel)}</b>${freshBadge(sig)}</p>
    <ul class="src-list">
      ${sources
        .map(
          (s) => `<li>
            <span class="src-kind k-${s.kind}">${SOURCE_LABEL[s.kind]}</span>
            ${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}${icons.external}</a>` : `<span>${esc(s.name)}</span>`}
            <span class="src-date num">${s.date ? esc(s.date) : "日期不明"}</span>
            ${s.note ? `<span class="src-note">${esc(s.note)}</span>` : ""}
          </li>`,
        )
        .join("")}
    </ul>
    ${explain(sig)}
  </section>`;
}

export function explain(sig: Signal): string {
  return `
  <details class="explain">
    <summary>${icons.info}来源说明：为什么可信 / 为什么存疑</summary>
    ${sig.why.length ? `<p class="why"><b>可信</b>${sig.why.map(esc).join("；")}。</p>` : ""}
    ${sig.doubt.length ? `<p class="doubt"><b>存疑</b>${sig.doubt.map(esc).join("；")}。</p>` : ""}
  </details>`;
}
