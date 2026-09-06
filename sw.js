/* Service worker — Grimoire du Conteur (cache pour usage hors-ligne) */
const CACHE_PREFIX = "grimoire-mj-";
const CACHE = `${CACHE_PREFIX}v25`;
const SCOPE = new URL(self.registration.scope);
const ASSETS = [
  "./",
  "index.html",
  "guide.html",
  "css/theme.css",
  "css/experience.css",
  "js/game-core.js",
  "js/persistence.js",
  "js/experience.js",
  "js/offline.js",
  "js/app.js",
  "data/game.json",
  "data/all-roles.json",
  "data/scripts/trouble-brewing.json",
  "data/scripts/sects-and-violets.json",
  "data/scripts/bad-moon-rising.json",
  "manifest.webmanifest",
  "assets/icons/icon.svg",
  "assets/icons/icon-maskable.svg",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/apple-touch-icon.png",
  "assets/icons/icon-maskable-512.png",
  "assets/fonts/cinzel-latin.woff2",
  "assets/fonts/cinzel-latinext.woff2"
];
const ASSET_URLS = ASSETS.map((asset) => new URL(asset, SCOPE).href);
const KNOWN_ASSETS = new Set(ASSET_URLS);

function inScope(url) {
  return url.origin === SCOPE.origin && url.pathname.startsWith(SCOPE.pathname);
}

function cacheKey(request) {
  if (request.method !== "GET") return null;
  const url = new URL(request.url);
  if (!inScope(url)) return null;
  // Language/test links share their own document, never another page's fallback.
  url.search = "";
  url.hash = "";
  return KNOWN_ASSETS.has(url.href) ? url.href : null;
}

self.addEventListener("install", (event) => {
  // Atomic precaching: a missing boot dependency must not produce a ready worker.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(
    ASSET_URLS.map((url) => new Request(url, {
      cache: "reload",
      credentials: "same-origin",
      redirect: "error"
    }))
  )));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
  } else if (event.data?.type === "CHECK_OFFLINE") {
    event.waitUntil((async () => {
      const status = { type: "OFFLINE_STATUS", ready: false, version: CACHE };
      try {
        const cache = await caches.open(CACHE);
        const responses = await Promise.all(ASSET_URLS.map((url) => cache.match(url)));
        status.ready = responses.every((response) => response?.ok);
      } catch (error) {
        status.error = error.message || String(error);
        console.error("Offline cache verification failed:", error);
      }
      const recipient = event.ports?.[0] || event.source;
      if (recipient) recipient.postMessage(status);
    })());
  }
});

async function fetchAsset(request, key) {
  let cache;
  let cached;
  try {
    cache = await caches.open(CACHE);
    cached = await cache.match(key);
  } catch (error) {
    console.error("Offline cache read failed:", error);
  }
  const isData = new URL(key).pathname.startsWith(`${SCOPE.pathname}data/`);
  if (cached?.ok && !isData) return cached;
  try {
    const response = await fetch(request);
    const responseURL = response.url ? new URL(response.url) : new URL(request.url);
    if (cache && response.ok && response.type !== "opaque" && inScope(responseURL) &&
        responseURL.pathname === new URL(key).pathname) {
      try {
        await cache.put(key, response.clone());
      } catch (error) {
        console.error("Offline cache write failed:", error);
      }
    }
    return response;
  } catch (error) {
    if (cached?.ok) return cached;
    // Missing scripts, styles and data must fail, not be returned as index HTML.
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const key = cacheKey(event.request);
  if (key) event.respondWith(fetchAsset(event.request, key));
});
