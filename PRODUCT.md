# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Mobile-first PWA: static front end (Vite + TypeScript, no framework runtime required), curated place data shipped as a local JSON file, installable to the home screen and usable offline. No backend, no login, no API keys.

## Users

A returning Shanghainese who lives abroad and comes back for a few weeks at a time. Knows the old city well, but not what changed since, so every visit loops back to the same well-known spots (外滩, 淮海路, 城隍庙, 文化名人街).

A winter trip of a few weeks with family: a primary-school child and a teenager (the app's Kid Hooks are written for a 9-year-old and a 16-year-old), both of whom must find the place worth the trip. The default Base is 陆家嘴; it can be changed in the app.

Job: on a free half-day or day, open the app, narrow a curated list down to two or three good candidates for *today*, and pick one. Browsing happens over breakfast or on the metro, on a phone.

## Product Purpose

A personal shortlist engine for "the Shanghai locals and the city's white-collar crowd actually go to" — places with cultural texture that adults and kids both enjoy exploring at a relaxed pace. Success: over the trip the family visits at least eight or ten places none of them had been to, and never falls back to a tourist checklist for lack of ideas.

Since November 2026 the product is also a **city discovery engine**: Quests (a question, what to observe, what to look for, cited Evidence) across twelve knowledge Domains, so the family comes home understanding how Shanghai works (its rivers, industry, streets, everyday life and governance), not only having seen more venues. Places stay as anchors; much of what a Quest looks at is public space.

It is still not an itinerary planner and not a daily check-in game: Observations are field notes and Coverage shows gaps, with no streaks, points or badges. Today's Quests favour Domains and Areas the family hasn't touched yet, and the first three Candidates come from different Domains. The owner can mark each Evidence 对得上 / 有问题 on the phone; `npm run audit` turns that and the data's own gaps into a pre-trip fix list (`docs/review-checklist.md`).

## Positioning

Every entry is curated, not crawled, and says *why a local goes there* and *what the 9-year-old and the 16-year-old each get out of it*. The "not on the tourist circuit" bar is applied editorially to every entry; the obvious landmarks are deliberately absent.

## Operating Context

- Phone, often on mobile data or offline (metro, ferry), in December weather: cold, sometimes wet. Indoor/outdoor and weather fit matter.
- Decisions are made by a family in a few minutes: who's coming, how much time, how far from the Base, rain or not.
- Place facts (hours, booking rules, closures) change; the owner verifies before leaving. The app links out to 高德/大众点评 rather than duplicating volatile details.

## Capabilities and Constraints

- Filter candidates by: time available (2h / half day / full day), distance from base, rain-safe (indoor), knowledge Domain (the twelve in `src/domain/taxonomy.ts`). The same Conditions pick up to three Quests for today, nearest first and each from a different Domain where possible. Kid fit is not a filter: every entry must already work for both the 9- and 16-year-old (principle 2), and shows each child's hook.
- Mark a place as 线索 / 想去 / 去过 / 想再去, or 排除 with a reason (商业化陷阱, 本地人回避, 当前不可进入, 季节性关闭, 信息过时, 不适合我们); a "surprise me" pick from the current filtered set.
- 深度探索: each place can carry a hook, vibe tags, best / avoid windows, anti-signals, a 顺路看一眼 and its sources. A 线索流 shows raw Fragments, a 弱信号 zone and anti-recommendations (负空间), each with source, date, strength and freshness. An offline schematic 地图 has layers (activated clues, weak signals, visited, excluded) and an optional 信息稀薄区.
- 探索: Quests reached by four entrances (空间, 时间, 主题, 生活) and six Lenses (城市侦探, 城市考古学家, 社会观察家, 基础设施工程师, 建筑评论家, 自然观察员); each Quest links to related Quests and its Trail stops, and Quests appear as a layer on the map.
- 上海正在发生 (Shanghai Now), beside the history side: 16 Culture cards with a 第一次体验 guide, real Venues and programmes, dated Events that drop out once ended, and Trends kept apart from long-standing Cultures. 潮流雷达 ranks by independent sources, not exposure; 兴趣扩散 moves to neighbouring Cultures; 潮流探索日 puts a history Quest and several Venues of one district into a half day or day; 我的文化版图 records 想试 / 试过 / 喜欢. Cultures and Quests link both ways (当代延伸 / 回到城市历史). Data is research-time and refreshed by `npm run audit` (ADR-0007, `docs/now-pipeline.md`).
- Data lives in `src/data/places.json`; each entry records `verifiedAt` — entries not yet checked against a live source show that status honestly.
- Undecided: whether to share the shortlist with relatives; how often to refresh the Clue Pool before departure.

## Evidence on Hand

Initial dataset is compiled from the assistant's knowledge (cutoff mid-2026) and must be re-verified. The Clue Pool (`src/data/fragments.json`, 19 Fragments) was gathered by web research on 2026-10-30, and every outside claim links its source. Anti-recommendations are editorial judgement and are labelled as such. The first 61 Quests (杨浦滨江, 苏州河, 陆家嘴 → 张江, 嘉定, 老城厢, 衡复) and their 59 Evidence records were researched on 2026-11-03; the assistant read each linked source, so Evidence shows 「已比对来源 · 待你复核」 until the owner checks it. Places still need re-verifying (opening hours, reservations, temporary closures) before the December 2026 trip. No photos are bundled; the app must not fabricate opening hours, prices, or ratings.

## Product Principles

1. **Fewer, better candidates.** The app's value is the curated "no" — anything a first-time tourist would find on page one stays out.
2. **Both kids, every entry.** A place earns its slot only when there is a concrete reason the 9-year-old *and* the 16-year-old would be glad they came.
3. **Choose, then leave.** Get the family from "what shall we do today" to a decision in under three minutes, then hand off to maps.
4. **Honest about freshness.** Unverified facts are labeled, never dressed up as certain.
5. **Questions before venues.** A good outing starts from something worth finding out; a ticket desk is optional.
6. **Evidence or silence.** A Quest's background is cited claim by claim. What cannot be sourced is left out, not paraphrased from memory.

## Accessibility & Inclusion

Readable outdoors on a phone in winter light; touch targets sized for gloved or hurried thumbs; works without network once installed.
