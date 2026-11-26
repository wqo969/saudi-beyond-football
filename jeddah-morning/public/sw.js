/* JEDDAH MORNING — service worker (hand-written, no dependencies).
 * Caches:
 *   jm-shell-v1   offline page, icons, manifest (precache)
 *   jm-static-v1  hashed build assets, fonts, pdf.js assets (cache-first)
 *   jm-pages-v1   pages visited while online (network-first fallback)
 *   jm-issues-v1  issues explicitly saved for offline (written by the page; read here)
 */
const VERSION = "v2";
const SHELL = `jm-shell-${VERSION}`;
const STATIC = `jm-static-${VERSION}`;
const PAGES = `jm-pages-${VERSION}`;
const ISSUES = "jm-issues-v1"; // saved issues survive SW upgrades
const KEEP = [SHELL, STATIC, PAGES, ISSUES];
// precache the app shell routes too, so a cold offline start still opens
const PRECACHE = ["/offline", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png", "/brand/wordmark-light.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("jm-") && !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isStatic = (url) =>
  url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/pdfjs/") || url.pathname.startsWith("/icons/");

/** Never cache auth/admin/mutation endpoints. */
const isBypass = (url) =>
  url.pathname.startsWith("/login") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin") || url.pathname.startsWith("/api/push") || url.pathname.startsWith("/api/cron");

async function cacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) (await caches.open(STATIC)).put(request, res.clone());
  return res;
}

/** Strip Next's RSC cache-busting param so saved pages match. */
function pageKey(url) {
  const u = new URL(url);
  u.searchParams.delete("_rsc");
  return u.pathname + (u.pathname.endsWith("/read") ? "" : u.search);
}

async function networkFirstPage(request) {
  const url = new URL(request.url);
  try {
    const res = await fetch(request);
    // Only cache real content pages (not login redirects).
    if (res.ok && !res.redirected && res.type === "basic") (await caches.open(PAGES)).put(pageKey(url), res.clone());
    return res;
  } catch {
    const key = pageKey(url);
    const saved = (await (await caches.open(ISSUES)).match(key)) || (await (await caches.open(ISSUES)).match(url.pathname));
    if (saved) return saved;
    const visited = (await (await caches.open(PAGES)).match(key)) || (await (await caches.open(PAGES)).match(url.pathname));
    if (visited) return visited;
    return (await caches.match("/offline")) || new Response("offline", { status: 503 });
  }
}

/** Images are immutable: serve from the saved-issue cache first, then network (cached into pages cache). */
async function cacheFirstPrivate(request) {
  const url = new URL(request.url);
  const hit = (await (await caches.open(ISSUES)).match(url.pathname)) || (await (await caches.open(PAGES)).match(url.pathname));
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && !res.redirected) (await caches.open(PAGES)).put(url.pathname, res.clone());
  return res;
}

async function networkFirstData(request) {
  const url = new URL(request.url);
  try {
    const res = await fetch(request);
    if (res.ok && !res.redirected) (await caches.open(PAGES)).put(url.pathname, res.clone());
    return res;
  } catch {
    return (await caches.match(url.pathname)) || new Response(JSON.stringify({ error: "offline" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isBypass(url)) return;

  if (isStatic(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  // RSC payloads for client navigations: let the network handle them; on failure Next falls back to a full navigation,
  // which is then served from cache below.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }
  if (url.pathname.startsWith("/api/media/")) {
    event.respondWith(cacheFirstPrivate(request));
    return;
  }
  if (url.pathname.startsWith("/api/search-index") || url.pathname.startsWith("/api/pdf/")) {
    event.respondWith(networkFirstData(request));
  }
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "JM_CLEAR_PRIVATE") {
    event.waitUntil(Promise.all([caches.delete(PAGES), caches.delete(ISSUES)]));
  }
});

/* ---- Notifications scaffold (inactive until the server enables Web Push) ---- */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {}
  const title = data.title || "صباح جدة";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "عدد جديد متاح للقراءة",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      dir: "rtl",
      lang: "ar",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) if ("focus" in w) return w.navigate(target).then((c) => c && c.focus());
      return self.clients.openWindow(target);
    }),
  );
});
