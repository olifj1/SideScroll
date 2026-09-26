const CACHE = "sidescroll-v1.0.57";
const APP_SHELL = [
  "./",
  "./index.html",
  "./play.html",
  "./walk-lab.html",
  "./asset-lab.html",
  "./design-lab.html",
  "./design-lab.css",
  "./design-lab.js",
  "./design-doc.json",
  "./manifest.json",
  "./site-config.js",
  "./home.js",
  "./core.js",
  "./style.css",
  "./icon-192.png",
  "./icon-512.png",
  "./splash-screen.png",
  "./walk-rig.js",
  "./sidescroll.js",
  "./baked-game-design.js",
  "./puzzle-groups.js",
  "./audio.js",
  "./sidescroll-music.m4a",
  "./walk-lab.js",
  "./asset-lab.js",
  "./sidescroll-tree-atlas.png",
  "./sidescroll-tree-01.png",
  "./sidescroll-tree-02.png",
  "./sidescroll-tree-03.png",
  "./sidescroll-tree-04.png",
  "./sidescroll-tree-05.png",
  "./sidescroll-tree-06.png",
  "./sidescroll-tree-07.png",
  "./sidescroll-tree-08.png",
  "./walklab-rig-v4.png",
  "./walklab-rig-v4-alt-hero2.png",
  "./walklab-character-source.png",
  "./puzzle-log-a.png",
  "./puzzle-log-b.png",
  "./puzzle-log-c.png",
  "./puzzle-log-d.png",
  "./fallen-tree.png",
  "./tree-stump.png",
  "./broken-branch.png",
  "./bridge-left.png",
  "./bridge-right.png",
  "./handcart-body.png",
  "./handcart-wheel.png",
  "./axle-pin.png",
  "./stone-wall.png",
  "./stone-piece-a.png",
  "./stone-piece-b.png",
  "./stone-piece-c.png",
  "./sidescroll-ground-01.png",
  "./sidescroll-ground-02.png",
  "./sidescroll-ground-03.png",
  "./sidescroll-ground-04.png",
  "./sidescroll-ground-05.png",
  "./sidescroll-ground-06.png",
  "./sidescroll-ground-07.png",
  "./sidescroll-ground-08.png",
  "./sidescroll-ground-09.png",
  "./sidescroll-ground-10.png",
  "./sidescroll-ground-11.png",
  "./sidescroll-ground-12.png",
  "./terrain-dirt.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // The splash page may already have warmed most of these files into this
    // release cache. Only fetch anything that is still missing.
    await Promise.all(APP_SHELL.map(async url => {
      const cached = await cache.match(url, { ignoreSearch: true });
      if (!cached) await cache.add(url);
    }));
  })());
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Keep navigations fresh; versioned static files come straight from the
  // current release cache so the splash-page preload is useful immediately.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          if (response && response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
          return response;
        })
        .catch(async () => (await caches.match(request, { ignoreSearch: true })) || (await caches.match("./index.html")) || Response.error())
    );
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && (response.ok || response.type === "opaque")) {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch (_) {
      return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
    }
  })());
});
