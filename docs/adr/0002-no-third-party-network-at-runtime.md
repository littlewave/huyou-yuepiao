# Nothing loads from third-party hosts at runtime

The app is used inside mainland China, where Google Fonts, Google Maps and many CDNs (jsDelivr, unpkg, Vercel's edge) are blocked or slow. So every font, icon and script is self-hosted in the build, and the service worker caches the whole app on first load. Install it to the phone's home screen *before* flying, while the hosting is reachable. A future change that adds a `<link>` to fonts.googleapis.com, or a map SDK, will look fine abroad and break silently in Shanghai.
