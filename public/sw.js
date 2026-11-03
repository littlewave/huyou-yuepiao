// Offline-first cache for 沪游月票. The build (vite.config.ts → precache) fills PRECACHE with every
// asset and replaces VERSION with a hash, so installed phones pick up each new build on next launch.
const VERSION = "huyou-dev";
const PRECACHE = /* PRECACHE */ [];

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
