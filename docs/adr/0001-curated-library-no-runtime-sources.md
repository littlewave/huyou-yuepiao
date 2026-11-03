# The Library is curated by hand and shipped with the app

Places live in `src/data/places.json`, written and verified by hand before the trip; the app makes no runtime calls to 大众点评, 小红书, map APIs or an LLM. The product's value is the editorial "no" (keeping the Tourist Circuit out and requiring a Local Reason plus both Kid Hooks), and live sources can't apply that bar. They also need keys and network access, both unreliable on a phone in mainland China. The cost is that facts go stale, so each Place carries `verifiedAt`, and the UI shows Unverified Places honestly instead of hiding the gap.

## Considered Options

- **Curated + Claude API suggestions**: rejected for v1 (needs an API key, plus network access abroad and in China); revisit after the December 2026 trip.
