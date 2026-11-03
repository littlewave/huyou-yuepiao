---
status: accepted; in-app map narrowed by ADR-0005
---

# Navigation hands off to 高德 (Amap); coordinates are stored in GCJ-02

There is no in-app navigation map (ADR-0005 adds an offline schematic for overview only). Each Place links out to 高德 via its URI API (`uri.amap.com/marker`), because Google Maps doesn't work in China and 高德 is what the family will actually navigate with. Mainland maps use the GCJ-02 datum, which is offset several hundred metres from GPS (WGS-84), so `lat`/`lng` in the Library are GCJ-02, read from 高德. Distance-from-Base is straight-line and approximate, so the small datum mismatch with browser geolocation (WGS-84) is accepted rather than converted.
