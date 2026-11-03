# Shanghai Now: data pipeline and iteration plan

## Files

`src/data/now/` holds four editable files. Types are in `src/domain/types.ts` (Culture, Venue, CultureEvent, Trend); `src/data/now.test.ts` enforces links and references.

| File | One entry is | Changes |
|---|---|---|
| `cultures.json` | a long-standing kind of culture with a first-time guide | rarely; add, or fold one into another with `mergedInto` |
| `venues.json` | a real place or long-running programme, with `lastSeen` | each refresh: bump `lastSeen` when a new source shows it active, set `status: "closed"` when it closes |
| `events.json` | one dated happening, or a weekly one with `validUntil` | every refresh |
| `trends.json` | something warming up now, with its sources | each refresh; drop when no new source in a year |

## Refresh routine (before the trip, and once in December)

1. `npm run audit` and read the `# Shanghai Now` part: events to re-confirm, ended ones to archive, Venues gone 待确认, single-source Trends, Cultures with no active Venue.
2. For each item, find a dated source you can read in full (official site or account, city government site, a named outlet). Search snippets don't count.
3. Edit the JSON:
   - Events: `start`, `end`, `status`, `checkedAt`, `sources`. Weekly events need `validUntil` (usually the next refresh date). When a source names only the month, set `datePrecision: "month"`, span the month with `start`/`end`, and keep `status: "unconfirmed"`; the app shows「12 月 · 日期未公布」and lists it after dated Events. Add `price` only when the source states it.
   - Venues: new source first in `sources`, `lastSeen` = its date.
   - Leave ended events in place until the trip ends; they no longer show, and they record what was there.
4. `npm test`, `npm run build`, open the app once online so the phone caches the new data.

## What the app does with time

- Events past their end date never appear. Weekly events past `validUntil` show 待确认.
- Venues show 待确认 once their newest source is older than: business 18 months, institution 36 months, project 24 months; public spaces never age.
- Trend and fact strength come from `assessSignal`: one outlet counts once however many articles it ran.

## v1 (2026-11-03)

16 Culture cards, 53 Venues and programmes (48 recorded active; the app shows 40 as active today, 12 待确认, 1 closed), 9 Events (5 inside the December trip window), 6 Trends (2 multi-source). Features: 潮流雷达, 活动 list (date window, district, sourced-free filter), 第一次体验 on each Culture card, 兴趣扩散 (per card and from 我的版图), 我的文化版图 (想试 / 试过 / 喜欢, in the Pass), links to and from Quests (当代延伸 / 回到城市历史).

## v1.1 (2026-11-03)

- Gaps filled: 7 climbing gyms (SmartShanghai, 2026-08; city government, 2025-07), 亚洲大厦星空间 and 第一百货's immersive stages (Xinhua, 2025-05), 喜剧联合国 (Jiemian, Spring Festival 2025; already 待确认 by the 18-month rule). A climbing Trend on three outlets.
- Still empty: comedy has no Venue with a source from the last 18 months; no board-game or jubensha shop and no public pickleball court with a reliable source. The five mid-2024 performance spaces stay 待确认.
- 潮流探索日 (`planDays`): within one district, a history Quest first, then up to two Venues of the Culture and one of a neighbouring Culture; adults-only stops last. On every Culture card and, from 喜欢 / 想试, in 我的版图. Venues have no coordinates, so plans group by district instead of routing.

## v1.2 (2026-11-03): coordinates

- 42 of 63 Venues have `geo` (GCJ-02, always approximate): 10 copied from a Library Place or Quest, 17 from OSM Nominatim matches on the venue or its building, 15 only street-level. Nominatim returns WGS-84; the standard WGS-84 → GCJ-02 transform was applied. Matches were kept only when they fell in the Venue's stated district; three plausible-looking ones were dropped by hand (静安大悦城 matched the railway station, 宜梅路 matched 益梅路, 杨树浦路 is 5 km long). 21 have none.
- 潮流探索日 orders stops nearest-next and shows straight-line legs; Venues with coordinates get a 高德 link; the map has a 正在发生 layer (active Venues only). OSM-derived coordinates carry © OpenStreetMap contributors.
- `npm run audit` lists active Venues with no or street-level coordinates. Replace those from 高德 (copy GCJ-02 from the web map) and set `precision: "poi"`, `via: "高德"`.

## v1.3 (2026-11-03): December events

12 Events now fall in the December trip window. Dated and confirmed: 2026 上海马拉松 (Dec 6) and its mini race (Dec 5), 《爱因斯坦》 at 文化广场 (Dec 12–20), 上海大歌剧院跨年音乐会 with the Shanghai Symphony Orchestra (Dec 31), West Bund Museum's *Computer Worlds* (to Feb 14, 2027). Month-only, 待确认: 艾夫曼芭蕾舞团 10-day residency and 《胡桃夹子》 at the new 上海大歌剧院, Comicup, the children's chorus festival. 外滩德国圣诞市集 (Nov 25 – Dec 27) rests on a search snippet only and is 待确认. New Venue: 上海大歌剧院 (opened Oct 17, 2026). Searched without a December result: Shanghai Grand Theatre, Shanghai Symphony Hall, Power Station of Art; the 12th comedy festival is listed for November with no days.

## Next iterations

1. **Fill the gaps the audit names**: comedy and board-game venues with a 2025–26 source; pickleball courts; re-confirm the five mid-2024 performance spaces.
2. **Better coordinates**: replace the street-level and missing ones from 高德 before the trip.
3. **文化生态地图**: Creators and Communities as entities, drawn as a graph of who plays, shows or meets where. Needs sources that name people with their consent; start with public collectives and festivals.
4. **Events for the trip**: a December pass over venues' own calendars (theatres, jazz clubs, Culture Square, SFC) the week before flying.
5. **Owner reviews** for Now facts, as for Evidence.
