// TravelingWithMe! - 서비스 워커
// PWA 설치(앱 설치) 요건을 충족시키고, 앱의 기본 화면(껍데기)을 캐싱해서
// 오프라인이거나 네트워크가 느릴 때도 앱이 빠르게 열리도록 도와줘요.
// Firebase, 외부 CDN, 지도/이미지 API 요청은 캐싱하지 않고 항상 네트워크로 보내요.

const CACHE_NAME = 'twm-cache-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // GET 요청만 처리, 그 외(POST 등)는 그대로 네트워크로
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 같은 출처(우리 앱 파일)만 캐시 대상으로, 외부 도메인(Firebase/CDN/지도 등)은 항상 네트워크
  if (url.origin !== self.location.origin) return;

  // 네트워크 우선, 실패하면 캐시 → 오프라인에서도 마지막으로 본 화면이 열려요
  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
