// Offline-first cache for 沪游月票. The build (vite.config.ts → precache) fills PRECACHE with every
// asset and replaces VERSION with a hash, so installed phones pick up each new build on next launch.
const VERSION = "huyou-65fb60357b";
const PRECACHE = ["./","./index.html","./manifest.webmanifest","./icon-180.png","./icon-512.png","./assets/barlow-condensed-latin-600-normal-BFJEwTuo.woff","./assets/barlow-condensed-latin-600-normal-DepVgxBB.woff2","./assets/barlow-condensed-latin-700-normal-Dmwat-ge.woff","./assets/barlow-condensed-latin-700-normal-v1xN8_Wq.woff2","./assets/barlow-condensed-latin-ext-600-normal-18ESti3H.woff2","./assets/barlow-condensed-latin-ext-600-normal-Clv9cIcR.woff","./assets/barlow-condensed-latin-ext-700-normal-BIHFfxf0.woff","./assets/barlow-condensed-latin-ext-700-normal-CwuXbfVR.woff2","./assets/barlow-condensed-vietnamese-600-normal-A5AYRdjN.woff2","./assets/barlow-condensed-vietnamese-600-normal-CNlPk46_.woff","./assets/barlow-condensed-vietnamese-700-normal-DYeBwlKR.woff2","./assets/barlow-condensed-vietnamese-700-normal-DhIzd8Tb.woff","./assets/index-C4ItXsVp.js","./assets/index-Ck2DnOU5.css"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

// Same-origin GETs: answer from cache, refresh in the background. Everything else (高德, 点评) goes straight to the network.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const hit = await cache.match(e.request, { ignoreSearch: true });
      const fresh = fetch(e.request)
        .then((res) => {
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        })
        .catch(() => hit ?? cache.match("./index.html"));
      return hit ?? fresh;
    }),
  );
});
