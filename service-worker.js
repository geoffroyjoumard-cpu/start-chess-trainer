/* ============================================================
   Chess Openings Trainer — Service Worker
   Version du cache : change ce numéro pour forcer une mise à jour
   ============================================================ */
var CACHE_NAME = "chess-trainer-v1";

/* Tous les fichiers à mettre en cache pour le mode hors-ligne */
var FILES_TO_CACHE = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js",
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap"
];

/* ── Installation : mise en cache de tous les fichiers ── */
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  /* Active immédiatement sans attendre la fermeture des onglets */
  self.skipWaiting();
});

/* ── Activation : supprime les anciens caches ── */
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

/* ── Fetch : cache en priorité, réseau en fallback ── */
self.addEventListener("fetch", function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        /* Ne met en cache que les réponses valides */
        if (!response || response.status !== 200 || response.type === "error") {
          return response;
        }
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(function() {
        /* Si le réseau échoue et qu'il n'y a pas de cache : page offline */
        return caches.match("./index.html");
      });
    })
  );
});
