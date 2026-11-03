# 沪游月票

A personal, offline-first phone PWA that turns a hand-curated Library of Shanghai Places into two or three candidates for today, for one returning family in December 2026. Product truth lives in `PRODUCT.md`, vocabulary in `GLOSSARY.md`; use the glossary's terms (Place, Candidate, Conditions, Pass, Punch…) in code, copy and commits.

## Before you change…

- **`src/data/now/`** (Cultures, Venues, Events, Trends): read `docs/now-pipeline.md`. No event, session, price or opening status without a source you read.
- **places.json, fragments.json, quests.json or evidence.json**, adding or editing Places, Fragments, Quests or Evidence: read `docs/curating-places.md` first. The editorial bar is the product, and a Fragment without a real source link is fabrication.
- **Anything visual**: read `DESIGN.md` and `.impeccable/surfaces/index-html.md`. Cinnabar `--cinnabar` is reserved for the 去过 stamp.
- **Architecture, networking, maps, storage**: read `docs/adr/`. In short: no runtime third-party requests (the phone is in mainland China: Google Fonts, Google Maps and most CDNs fail there), 高德 hand-off with GCJ-02 coordinates, the Pass lives in `localStorage` only.

The staged upgrade toward Quests is planned in `docs/upgrade-plan.md`; check its status line before starting a phase.

## Shape

- `src/domain/` is pure and tested: `taxonomy` (12 Domains, Eras, Lenses), `checkGraph` (the knowledge graph's integrity: Places, Areas, Quests, Trails, Evidence), `selectCandidates` (Conditions → Candidates + stamped + Domain counts), `questsForToday` (Conditions → a Domain-diverse handful of Quests), `relatedQuests` / `questsByEra` / `questsByTopic` / `questsForLens` / `trailStops` (the knowledge links behind the 探索 entrances), `now.ts` (Shanghai Now: event and venue states over time, 雷达, 兴趣扩散, links to Quests), Pass reducers (incl. Observations), `coverage` (Domains / Areas / Eras touched), `assessSignal` (Sources → strength, freshness, trust/doubt reasons), geo. Strength and freshness are always derived from Sources, never stored. Put logic here, behind these interfaces, and keep `src/ui/` as string templates plus event wiring.
- `src/ui/views.ts` (today, detail, pass), `quests.ts` (探索 list, Quest detail), `now.ts` (正在发生, Culture cards), `clues.ts` (线索流) and `map.ts` (SVG schematic) render whole views as HTML strings; `src/main.ts` re-renders on every state change and restores the chip row's scroll.
- User-facing copy is Simplified Chinese; code and docs are English.

## Done means

`npm test` green (includes the Library bar check in `src/data/places.test.ts`, the knowledge-graph check and the ranking evaluation in `src/data/ranking.eval.test.ts`), `npm run build` clean, and the changed screen looked at in a 390-wide viewport. The build stamps `public/sw.js` with a precache list and a content-hash `VERSION` (see `vite.config.ts`); never hand-edit those two placeholders.

Before the trip: `docs/review-checklist.md` (runs `npm run audit`).

## Deploy

Static `dist/` on any host. Live at https://littlewave.github.io/huyou-yuepiao/ via the `gh-pages` branch: `npm run deploy` (tests, build, push). The family installs to the home screen *before* flying, so offline cache is warm whatever the host's reachability from China.
