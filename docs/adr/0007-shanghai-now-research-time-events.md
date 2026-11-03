# Shanghai Now ships research-time event data that expires by date; no live feeds

The 上海正在发生 module needs current events, venues and trends, which go stale in weeks. A live feed (Damai, Xiaohongshu, WeChat, an API) would break ADR-0002 (no runtime third-party requests; the phone is in mainland China and often offline) and would bring in listings nobody has read. So Now data is gathered at research time into `src/data/now/` like the Clue Pool (ADR-0005), and the app makes time do the cleaning: an Event whose end date has passed drops out of every list on its own, a weekly Event past `validUntil` turns 待确认, and a Venue whose newest source is older than its kind allows (business 18 months, institution 36, project 24, public space never) turns 待确认. `npm run audit` lists what needs re-confirming or archiving.

Long-standing Cultures and warming Trends are separate entities, and a Trend's heat is its Signal (independent named outlets, recency), never social-media exposure. Prices and session times are stored only when a source states them.

Considered: scraping event platforms before each trip into the same files. Rejected for now: their terms, their volatility, and the editorial bar (every listing read by a person) make a hand-run pipeline the honest size for one family.
