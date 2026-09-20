/* おうち家計簿 サービスワーカー（GitHub Pages 用）
   画面(HTML)はネットワーク優先＝新しい版を置けば次に開いたとき自動で反映。
   オフラインならキャッシュから起動。アイコン等はキャッシュ優先で速く。

   GitHub Pages は /リポジトリ名/ の下に配信されるので、
   絶対パス（/index.html）ではなく登録スコープからの相対で扱う。      */
const V = "kakeibo-gh-v1";
const SHELL = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"
];
const HOME = new URL("./index.html", self.registration.scope).href;

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(V)
      // 1つでも欠けると全体が失敗する addAll を避け、取れたものだけ入れる
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;    // 外部通信は素通し

  if (req.mode === "navigate" || url.pathname.endsWith(".html")) {
    e.respondWith(
      fetch(req)
        .then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); return r; })
        .catch(() => caches.match(req).then(r => r || caches.match(HOME)))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); return r;
    }))
  );
});
