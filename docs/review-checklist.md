# Content review before the trip

Run this in November, and again the week before flying. The goal is that nothing the app states as fact is wrong on the day, and that what can't be confirmed says so.

## 1. Get the list

```sh
npm run audit                          # everything that needs a person, worst first
npm run audit -- --pass pass.json      # same, counting the reviews you made on the phone
npm run audit -- --out docs/audit.md   # keep a copy
```

`pass.json` is the text from 我的月票 → 换手机：导出, saved to a file.

## 2. Review on the phone (any order)

For each Quest you might do, open it, scroll to 证据与出处, open each source link and read the claim against it. Tap **对得上** or **有问题**. The Quest's tag turns to 已核实 once every Evidence is ok, or to 你标了 n 条有问题.

## 3. Fix the data (at the computer)

Work down the audit report. For each item:

| Audit says | Do |
|---|---|
| you flagged it | Re-read the source. Fix the `claim` to say only what the source says, or drop the Evidence and every background sentence that rests on it. |
| never read against its source | Read it, then set `checkedAt` and `checkedBy`, or remove it. A search snippet is not reading. |
| sources disagree | Keep both readings in `disputed`; the background sentence must not pick a side the sources don't. |
| describes a current state, over two years old | Find a newer source (official site, 2026 news) or rewrite the Quest so it doesn't depend on that state (e.g. "look from outside" instead of "go in"). |
| no source carries a date / only anonymous or wiki sources | Add a dated, named source when one exists. If none does, leave it; the app already shows the weaker signal. |
| you checked it on the phone | Set `checkedBy: "owner"` and today's `checkedAt` in `evidence.json`. |

Rules from `docs/curating-places.md` still apply: no opening hours, prices or booking rules in a Quest; `tasks` and `lookFor` state no facts.

## 4. Shanghai Now

Read the `# Shanghai Now` part of the audit and follow `docs/now-pipeline.md`: re-confirm weekly events, bump `lastSeen` on Venues with a new source, add December events from the venues' own calendars.

## 5. Places

`verifiedAt` stays null until you confirmed on 高德 / 大众点评 / the official account that the Place is open in December 2026 and how booking works. The audit counts the rest.

## 6. Finish

`npm test` green (it includes the graph check and the ranking evaluation), `npm run build`, open the app on the phone once while online so the new data is cached for offline use.
