# Upgrade plan: from a venue shortlist to a question-led discovery engine

Status: all five phases done (2026-11-03). Phase 5: `npm run audit` (src/domain/audit.ts) lists Evidence needing a person, worst first, with the Quests citing it, plus thin Domains, empty Eras and unverified Places; Evidence describing a current state is marked `volatile` and only that goes stale. The owner reviews Evidence on the phone (对得上 / 有问题, stored in the Pass) and the audit reads the exported Pass. `docs/review-checklist.md` is the pre-trip routine. `src/data/ranking.eval.test.ts` asserts recommendation quality on the real data across 120 scenarios, and the first three Candidates are now spread across Domains. Phase 4: Phase 4: Observations (found look-for items, a note, a Done day) live in the Pass under `observations` and export with it; 我的月票 shows 探索覆盖面 by Domain, Area and Era plus in-progress and done Quests; today's Quests rank by an effective distance (km − 3 for an untouched Domain − 1.5 for an untouched Area + up to 2 for unchecked Evidence), drop done Quests, say why they were picked, and never use popularity. Phase 3: Phase 3: the 探索 tab has four entrances (空间 by Area and distance, 时间 by Era, 主题 as a Domain grid drilling into Topics, 生活 for everyday Domains), a Lens picker that filters and orders by fit, 相关探索 and Trail previous/next on each Quest, and a Quest layer on the map. Phase 2: 杨浦滨江 (10 Quests), 苏州河 (11), 陆家嘴 → 张江 (10), 嘉定 (11), 老城厢 (10) and 衡复 (9): 61 Quests, 59 Evidence, 6 Trails, the 探索 tab, Quest detail and Quests on Place detail. The 今日候选 chips filter by Domain, and the today view shows up to three Domain-diverse Quests after the first three Candidates.

## Diagnosis: why the Library is mostly museums

Measured on the 47 Places before migration: 23 fully indoor, 12 mixed, 12 outdoor. Roughly 30 are ticketed venues (美术馆, 博物馆, 书店, 展示馆).

The cause, in order of weight:

1. **Taxonomy (main cause).** The seven themes (艺术, 历史建筑, 城市漫步, 自然, 书店, 科学动手, 市集美食) are *venue types*, not knowledge. `art`, `books` and `science` can only be filled by galleries, bookshops and science museums. A wet market, a pumping station, a 里弄 committee notice board or a 7 a.m. ferry has no theme to belong to, so it never got curated.
2. **Entity model.** A Place is shaped like a venue: `hours` (visit length), `booking`, a single point, "open in December". A public-space range (a street, a riverbank, a district) fits awkwardly, and "what to do there" is implied by the venue rather than written down.
3. **Content source and curation brief.** The Library was compiled from model knowledge with the brief "cultural texture, both kids glad they came, December weather". Venues are what gets written about online and in the model's training data, and "rain-safe" plus "a 9-year-old will be glad" both pull toward indoor attractions.
4. **Ranking (minor).** It is *not* popularity ranking: there is no popularity signal at all. But the sort is "marked first, then nearest", with no diversity term, so the three nearest venues to 陆家嘴 win every morning. The 雨天 condition removes all outdoor and mixed Places.

After the Phase 1 migration, the same 47 Places map onto the 12 Domains like this (a Place counts once per Domain):

| Domain | Places | | Domain | Places |
|---|---|---|---|---|
| 建筑、设计与城市美学 | 17 | | 城市肌理与街巷 | 8 |
| 文学、艺术与思想史 | 17 | | 城市历史与时代地层 | 5 |
| 江河、自然与城市生态 | 11 | | 郊野、乡村与江南文化 | 5 |
| 工业文明与基础设施 | 11 | | 经济、产业与全球化 | 3 |
| | | | 饮食文化与商业生态 | 3 |
| | | | 市井生活与社会观察 | 2 |
| | | | 社会结构与城市治理 | 2 |
| | | | 城市节律与特殊体验 | 1 |

Eras are recorded only where certain: 28 of 47 Places carry none. The gaps that seed content must fill are 市井, 治理, 节律, 饮食 and every Era before 1990.

## What stays

The Library, Pass, Clue Pool, schematic map, Signal (strength and freshness derived from Sources), offline PWA, no runtime network (ADR-0001/0002/0004/0005) all stay. `themes` stays as each Place's venue type (it colours the slip); the 今日候选 filter now uses `topics` → Domains. Nothing is rewritten that already works.

## Phase 1: review, model, taxonomy (done)

- `src/domain/taxonomy.ts`: 12 Domains with Topics (`domain/topic`, optional third level), 8 Eras, 6 Lenses (探索身份) as weightings over Domains, `LIFE_DOMAINS` for 生活地图, and `domainCoverage` / `lensesFor`.
- `src/domain/types.ts`: Place gains `areaId`, `topics`, optional `eras`. New `Area`, `Evidence`, `Quest`, `Trail`, `Observation`.
- `src/domain/graph.ts`: `checkGraph` lists every dangling id and editorial-bar failure (a Quest with no Evidence, a background paragraph without a citation, a "checked" Quest citing unchecked Evidence, a linked Source without https).
- Data: `areas.json` (23 Areas), empty `quests.json`, `trails.json`, `evidence.json`; all 47 Places migrated (`areaId`, `topics`, `eras` where certain).
- Many-to-many: Quest ↔ Place, Quest ↔ Topic, Quest ↔ Evidence, Trail → Quest, Place → Area. Strength and freshness of Evidence come from `assessSignal`, as for Places.

## Phase 2: seed content, Quest cards, topic filter

Six seed areas, ten Quests each (60), every Quest backed by Evidence the curator has read:

1. **杨浦滨江** — infrastructure, industry (water works, power, textile mills, wharves).
2. **苏州河** — rivers and water governance, warehouses, the old concession boundary.
3. **衡复风貌区** (avoiding 武康路/安福路) — 里弄 types, period architecture, a wet market, 路名.
4. **老城厢** (董家渡, 文庙, 梦花街; not 豫园) — the walled county town, layers, street life.
5. **陆家嘴 → 张江** — finance, planning, globalisation, near the Base.
6. **嘉定老城** — county town, 江南 water, the 科举 history.

Rules: no opening hours, prices or booking claims in a Quest; volatile facts stay behind 高德 / official links. A Quest whose facts cannot be sourced is not written. Quests prefer public space, so most are free and need no booking. UI: a Quest card (question, why, steps, look-for, further, Evidence with strength and freshness, fact-check state), Quests listed under each Place and Area, today's chips switch to Domains.

## Phase 3: map exploration, knowledge links, Trails

Four entrances on the 发现 tab: 空间 (the existing schematic, adding Areas and unexplored Areas), 时间 (Quests by Era), 主题 (Domain → Topic → Quests), 生活 (`LIFE_DOMAINS`). Lens picker re-weights what is shown. Related Quests by shared Topic and Area. Trails as ordered walks inside an Area.

## Phase 4: Observations, knowledge progress, personal ranking

Observation notes per Quest (device-local, same storage rules as the Pass; exported with it). A coverage view: Domains, Areas and Eras touched versus still unknown. The ranking becomes a scored mix, in `src/domain/` and tested: interest (Lens / chosen Domains), diversity (penalise a Domain already in today's list), novelty (untouched Domain or Area), distance and time, conditions (rain, daylight, setting), age fit, and credibility (Signal strength). Popularity is never an input.

## Phase 5: data refresh, review, ranking evaluation

A research-time refresh script that lists Evidence by staleness and flags Quests whose Evidence went stale or disputed. A review checklist. A ranking evaluation: fixed condition scenarios with asserted properties (diversity across Domains, no venue monopoly, rain days still offer outdoor-short options where honest).

## Tensions with the existing product

- PRODUCT.md said "a list of candidates, not a daily check-in game" and "choose, then leave". Observations and progress are field notes and coverage, never streaks, points or badges. Lenses are ways of looking, not levels.
- The Library's "both kids, every entry" bar carries over to Quests as `kid9` / `kid16`.
- 60 checked Quests is real research work (roughly a day per area). Quests ship with `checkedAt: null` until a person has read each cited source; the UI shows that honestly.
