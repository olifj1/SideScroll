const CACHE = "sidescroll-v0.2.47";
const APP_SHELL = [
  "./",
  "./index.html",
  "./play.html",
  "./walk-lab.html",
  "./manifest.json",
  "./site-config.js",
  "./home.js",
  "./core.js",
  "./style.css",
  "./icon-192.png",
  "./icon-512.png",
  "./walk-rig.js",
  "./sidescroll.js",
  "./baked-game-design.js",
  "./puzzle-groups.js",
  "./walk-lab.js",
  "./sidescroll-dressing-atlas.png",
  "./walklab-rig-v4.png",
  "./walklab-character-source.png",
  "./puzzle-log-a.png",
  "./puzzle-log-b.png",
  "./puzzle-log-c.png",
  "./puzzle-log-d.png",
  "./fallen-tree.png",
  "./tree-stump.png",
  "./broken-branch.png",
  "./stone-wall.png",
  "./stone-piece-a.png",
  "./stone-piece-b.png",
  "./stone-piece-c.png",
  "./sidescroll-tree-01.png",
  "./sidescroll-tree-02.png",
  "./sidescroll-tree-03.png",
  "./sidescroll-tree-04.png",
  "./sidescroll-tree-05.png",
  "./sidescroll-tree-06.png",
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
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request, { cache: "no-store" })
      .then(response => {
        if (response && (response.ok || response.type === "opaque")) {
          caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request, { ignoreSearch: true });
        if (cached) return cached;
        if (event.request.mode === "navigate") return (await caches.match("./index.html")) || Response.error();
        return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
      })
  );
});
