const CACHE = "sidescroll-runtime-v1";
const CORE_SHELL = [
  "./",
  "./index.html",
  "./play.html",
  "./walk-lab.html",
  "./asset-lab.html",
  "./puzzle-lab.html",
  "./puzzle-lab.css",
  "./puzzle-lab.js",
  "./design-lab.html",
  "./concept-lab.html",
  "./concept-lab-data.json",
  "./world-lab.html",
  "./world-lab.css",
  "./world-lab.js",
  "./design-lab.css",
  "./design-lab.js",
  "./design-doc.json",
  "./manifest.json",
  "./site-config.js",
  "./home.js",
  "./core.js",
  "./style.css",
  "./walk-rig.js",
  "./sidescroll.js",
  "./baked-game-design.js",
  "./puzzle-groups.js",
  "./audio.js",
  "./walk-lab.js",
  "./asset-lab.js",
  "./icon-192.png",
  "./icon-512.png",
  "./splash-screen.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Keep installation light. Large game art/audio is warmed by the splash
    // loader and cached on demand instead of being re-downloaded for every patch.
    await Promise.all(CORE_SHELL.map(async url => {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (response && response.ok) await cache.put(url, response.clone());
      } catch (_) {}
    }));
  })());
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith("sidescroll-") && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

const isLiveProjectFile = pathname => /\.(?:html|js|css|json)$/i.test(pathname) || pathname.endsWith('/manifest.json');

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const networkFirst = request.mode === "navigate" || isLiveProjectFile(url.pathname);

    if (networkFirst) {
      try {
        // Code/design data should reflect GitHub immediately after a patch. The
        // old cache-first/ignoreSearch path could mix files from two revisions.
        const response = await fetch(request, { cache: "no-store" });
        if (response && response.ok) await cache.put(request, response.clone());
        return response;
      } catch (_) {
        return (await cache.match(request))
          || (await cache.match(request, { ignoreSearch: true }))
          || (request.mode === "navigate" ? await cache.match("./index.html") : null)
          || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
      }
    }

    // Large immutable-ish assets stay cache-first. A changed asset should use a
    // new query/version in its referencing file; exact matching then fetches the
    // replacement once and keeps it for offline use.
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && (response.ok || response.type === "opaque")) await cache.put(request, response.clone());
      return response;
    } catch (_) {
      return (await cache.match(request, { ignoreSearch: true }))
        || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
    }
  })());
});
