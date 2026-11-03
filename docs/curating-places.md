# Curating Places

The Library is the product. A Place earns its slot only when all of these hold:

1. **Off the Tourist Circuit.** Exclude what a first-time visitor finds on page one (外滩, 城隍庙/豫园, 南京路, 田子坊, 新天地, 东方明珠, 武康路/安福路, 多伦路 and similar 文化名人街). The owner has done these on every trip.
2. **A Local Reason.** One sentence on why someone who lives in Shanghai, or a white-collar worker there, goes. Not a description of the place.
3. **Both Kid Hooks.** A concrete thing for the 9-year-old *and* the 16-year-old. If one child would only tolerate it, say so honestly in the hook (see 四行仓库) or leave the Place out.
4. **Facts you can stand behind.** No opening hours, prices or ratings in the data; they go stale and the detail view links to 高德 / 大众点评 / 小红书 for them. `booking` is `unknown` unless known.

## Fields

See the `Place` type in `src/domain/types.ts`. Notes that the type can't tell you:

- `lat`/`lng` are **GCJ-02**, as read from 高德 (copy from the 高德 web map, not Google). Approximate is fine; only distance filtering uses them.
- `hours` is a realistic family visit including getting around inside, not the minimum.
- `setting: "indoor"` means fully rain-safe. Anything with a meaningful outdoor part is `mixed`.
- `december` is optional: winter-specific advice only (候鸟季, 温室为主, 江边风大).
- `sources`: every Place starts with the `model` source (Claude 知识整理, 2026-06). Add each outside source you actually checked; the app derives strength and freshness from this list.
- `hook`, `vibeTags`, `bestVisitWindow`, `avoidWindow`, `antiSignals`, `nextGlance` are optional; leave a field out rather than writing filler. `nextGlance` is one door, street or shop worth a glance on the way, not another attraction.
- `areaId` names an Area in `src/data/areas.json`. `topics` are `domain/topic` ids from `src/domain/taxonomy.ts`: what the Place teaches, not what kind of venue it is. `eras` only when the Place visibly carries that period; leave it out when unsure.
- `verifiedAt`: set to the ISO date only after checking on a live source that the Place is open and how booking works. Leave `null` otherwise; the UI says 未核实.

## Fragments (线索流)

`src/data/fragments.json` holds research-time Fragments. The bar is lower than for Places, but they're never invented:

- Every non-editorial Source has a real `https://` link and the date the source published (`null` when it shows none). `npm test` enforces the link.
- Write `text` as what the source actually says. Put interpretation in `weakReason`.
- `tier`: `fragment` when the claim is complete; `weak` when something essential is missing, with `weakReason` saying what; `anti` for somewhere deliberately excluded, with `antiReason`. Anti-recommendations may be `editorial`; say so in the source.
- Set `relatedPlaceId` when the Fragment is about a Library Place. Then 转为线索 marks that Place, and the Fragment doesn't get its own map point.
- Coordinates are optional and GCJ-02; set `coordsApprox: true` unless they came from a map lookup.
- When a Fragment corrects a Place (a reopening, an ended partnership), update the Place too and add the Source to its `sources`.

## Quests and Evidence

`src/data/quests.json` and `src/data/evidence.json`. `npm test` runs `checkGraph` over them.

- Start from a question a family can answer on site. `tasks` are things to do and look at; `lookFor` names what would count as an answer. Neither states facts.
- Every factual sentence goes in `background`, and each paragraph lists the Evidence ids it rests on. If a claim has no source you have read, leave it out, including "obvious" explanations (why sawtooth roofs face a direction, why a bridge is tall). Ask it in `tasks` or `further` instead.
- Evidence `claim` says only what its sources say. Set `checkedAt` and `checkedBy` (`ai` or `owner`) only after reading the claim in the linked page; a search-result snippet does not count. When sources disagree, keep the claim and say how in `disputed`.
- Set `volatile: true` on Evidence whose claim describes a current state (open, closed, in use, under renovation, a count of people or shops). Only volatile Evidence goes stale in `npm run audit`; a 1883 opening date does not.
- No opening hours, prices or booking rules in a Quest. `access.transit` names the source when it's a specific station.
- Prefer public space (`scope`) over ticketed venues; link `placeIds` when a Library Place is involved.

## Verification pass before the trip

Every Place shipped `verifiedAt: null` in October 2026 (compiled from model knowledge to mid-2026). Before departure, go through the Library and for each Place: confirm it's open in December 2026 (special exhibitions, renovations, e.g. 城市规划展示馆 and 民生码头筒仓 are event- or renovation-dependent), confirm `booking`, fix the coordinates from 高德, then set `verifiedAt`. Run `npm run check:data` after editing.
