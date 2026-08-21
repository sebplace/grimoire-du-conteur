/* Service worker — Grimoire du Conteur (cache pour usage hors-ligne) */
const CACHE = "grimoire-mj-v11";
const ASSETS = [
  "./",
  "index.html",
  "css/theme.css",
  "js/app.js",
  "data/game.json",
  "data/all-roles.json",
  "data/scripts/trouble-brewing.json",
  "data/scripts/sects-and-violets.json",
  "data/scripts/bad-moon-rising.json",
  "manifest.webmanifest",
  "assets/icons/icon.svg",
  "assets/icons/icon-maskable.svg",
  "assets/fonts/cinzel-latin.woff2",
  "assets/fonts/cinzel-latinext.woff2"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
/* Stratégie : network-first pour les JSON de données (mises à jour),
   cache-first pour le reste, avec repli cache hors-ligne. */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const isData = req.url.includes("/data/");
  if (isData) {
    e.respondWith(
      fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req))
    );
  } else {
    e.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res;
      }).catch(() => caches.match("index.html")))
    );
  }
});
