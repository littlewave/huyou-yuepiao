---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

## Scope

The whole app shell: today's candidate list, filters, place detail, the pass (想去 / 去过), settings for base. Visitor mode: **Operate**.

## Task

On a phone, the family narrows the curated library to 2–3 candidates for today in under three minutes, opens one, and hands off to 高德. Important states: empty filter result, offline, unverified data, all-visited.

## Direction contract

THESIS: The December trip is one 上海公交月票. Every place visited gets punched into it. Refuses the category default of photo-card feeds with a search bar and bottom tabs over white.

OWN-WORLD: Shell in 月票孔雀绿 (#0E5E5A) with a pale mint pass-stock ground (#E6F2EC) carrying a fine diagonal guilloche hatch; white candidate slips with a die-cut punch notch; 月份黄 (#F3D34A) for the active filter and the big month numeral; 印泥红 (#C8361F) reserved for the 去过 stamp only; theme hues as thin top rule on slips (pass-type colours). Condensed DIN numerals for every figure; PingFang for words.

STORY: The returning Shanghainese sees at once this is *their* city's object, trusts that each entry was chosen, filters by today's conditions, and leaves with one decision.

FIRST VIEWPORT: Green header: app name + base line left, 72px "12" numeral right; trip-day strip below (days punched where a visit happened). Filter chip row on green, each theme chip showing its count. Mint sheet rises with rounded top: result count + 随便来一个 action, then candidate slips (name, area + distance, local reason, 9岁 / 16岁 hooks, duration bar). Primary action: tap a slip.

FORM: The 月票 pass, 4th of 7 grounded candidates. seed:8946fef85a8bd58c. Signature interaction: marking 去过 punches the slip (hole cut + stamp lands, one 220ms move) and the same day punches on the trip strip. Raises: stamps never remove (ticket wallet); duration bar length = hours (labanotation); fixed furniture on every slip (character catalog); chip counts (acetate tabs); cinnabar for one state only (mono marketing).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

Map view; sharing the shortlist with relatives.
