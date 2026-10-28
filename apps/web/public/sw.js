// Service worker: web push nhắc học (xem features/reminder/push.ts) + chạy offline cho PWA / app iOS-Android.
// Payload push do backend gửi: { title, body, url, tag } — xem ReminderService.
//
// Offline (dữ liệu ôn tập nằm ở IndexedDB — xem features/srs-review/offline.ts; ở đây chỉ lo giao diện):
// - /_next/static/* có hash trong tên file (bản build production — không bao giờ đổi nội dung) → lấy cache trước,
//   chưa có mới tải. File không hash (next dev) đi mạng như thường, không thì sửa code xong vẫn chạy bản cũ
// - Mở trang trong OFFLINE_PAGES: luôn tải mạng trước (luôn mới nhất); bản không query string tải được thì lưu lại
//   kèm JS/CSS trang đó dùng. Mất mạng thì trả bản đã lưu cho MỌI query string (?language=, ?deck=... — trang tự đọc
//   query trên URL), chưa lưu thì trang offline (có nút mở trang ôn tập đã lưu)
// - Request khác (API ở domain khác, RSC của Next...) đi mạng như bình thường

// Đổi hậu tố khi đổi cách lưu / sửa offline.html — activate xoá cache cũ cùng tiền tố
const OFFLINE_CACHE = 'laclingo-offline-v3'
const STATIC_CACHE = 'laclingo-static-v1'
const PAGES_CACHE = 'laclingo-pages-v1'
const CACHES = [OFFLINE_CACHE, STATIC_CACHE, PAGES_CACHE]
// Chỉ dọn cache của các họ trên (bản cũ) — cache laclingo-* khác không phải của SW này
const OFFLINE_URL = '/offline.html'
// Trang dùng được khi offline (pathname, khớp đúng — khớp OFFLINE_PAGES ở features/srs-review/offline.ts): hub ôn tập,
// ôn tập (cả theo list), học từ vựng, danh sách ôn tập. Trang khác cần API nên mất mạng thì hiện trang offline
const OFFLINE_PAGES = ['/review', '/review/vocabulary', '/review/new', '/review/new/subtopics', '/review/new/topic', '/review/lists']
// Giới hạn số file JS/CSS giữ lại — bản deploy cũ để lại file hash cũ, bỏ file lưu lâu nhất trước
const MAX_STATIC_ENTRIES = 400

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, '/logo.svg']))
      // Không cache được trang offline vẫn phải cài SW — nhắc học (push) phụ thuộc vào nó
      .catch(() => {})
      // Kiểm soát ngay các tab đang mở (kể cả tab vừa đăng ký SW) để notificationclick điều hướng được
      .then(() => self.skipWaiting()),
  )
})
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => /^laclingo-(offline|static|pages)-v\d+$/.test(k) && !CACHES.includes(k))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(navigate(event, request, url))
  } else if (isHashedAsset(url.pathname)) {
    event.respondWith(staticAsset(event, request))
  } else if (url.pathname === '/logo.svg') {
    event.respondWith(fetch(request).catch(() => caches.match('/logo.svg').then((r) => r || Response.error())))
  }
})

async function navigate(event, request, url) {
  const offlinePage = OFFLINE_PAGES.includes(url.pathname)
  try {
    const response = await fetch(request)
    if (offlinePage && !url.search && isCacheablePage(response)) event.waitUntil(savePage(url.pathname, response.clone()))
    return response
  } catch {
    const saved = offlinePage && (await caches.match(url.pathname, { cacheName: PAGES_CACHE, ignoreVary: true }))
    return saved || (await caches.match(OFFLINE_URL)) || Response.error()
  }
}

// File JS/CSS/font của bản build production: tên có hash (vd 1120-e4ed17206765abc1.js, 6ac56c8627433e47.css)
function isHashedAsset(pathname) {
  if (!pathname.startsWith('/_next/static/') || pathname.includes('hot-update')) return false
  return /[0-9a-f]{12,}/.test(pathname.slice(pathname.lastIndexOf('/') + 1))
}

// JS/CSS mà các trang offline đã lưu cần — không được dọn khi vượt giới hạn
function pageAssets(html) {
  return [...new Set(html.match(/\/_next\/static\/[^"'\s\\<>]+/g) || [])].filter(isHashedAsset)
}

// Chỉ lưu trang HTML trả về bình thường (không lưu trang lỗi / bị chuyển hướng)
function isCacheablePage(response) {
  return response.ok && !response.redirected && (response.headers.get('content-type') || '').includes('text/html')
}

// Lưu trang + mọi JS/CSS/font trang đó tham chiếu — trang lưu offline không thiếu file dù lúc mở chưa có SW kiểm soát
async function savePage(pathname, response) {
  const html = await response.clone().text()
  const assets = pageAssets(html)
  // Không phải trang Next (vd trang lỗi 502 của proxy lúc deploy — app Android luôn báo status 200) → không lưu
  if (assets.length === 0) return
  const staticCache = await caches.open(STATIC_CACHE)
  await Promise.all(
    assets.map(async (path) => {
      if (await staticCache.match(path)) return
      const res = await fetch(path).catch(() => null)
      if (res && res.ok) await staticCache.put(path, res)
    }),
  )
  await (await caches.open(PAGES_CACHE)).put(pathname, response)
  await trimStatic()
}

// Chưa có trong cache: trả response ngay, lưu + dọn chạy sau (không làm chậm lúc tải trang)
async function staticAsset(event, request) {
  const cache = await caches.open(STATIC_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) event.waitUntil(cache.put(request, response.clone()).then(scheduleTrim))
  return response
}

// Nhiều file tải cùng lúc chỉ dọn 1 lần
let trimTimer = null
function scheduleTrim() {
  clearTimeout(trimTimer)
  return new Promise((resolve) => {
    trimTimer = setTimeout(() => trimStatic().then(resolve, resolve), 2000)
  })
}

// keys() trả theo thứ tự lưu → vượt giới hạn thì bỏ các file lưu lâu nhất, trừ file trang offline đã lưu cần
async function trimStatic() {
  const cache = await caches.open(STATIC_CACHE)
  const keys = await cache.keys()
  let excess = keys.length - MAX_STATIC_ENTRIES
  if (excess <= 0) return
  const pages = await caches.open(PAGES_CACHE)
  const keep = new Set()
  for (const page of await pages.keys()) {
    const html = await (await pages.match(page)).text()
    for (const path of pageAssets(html)) keep.add(new URL(path, self.location.origin).href)
  }
  for (const key of keys) {
    if (excess <= 0) break
    if (keep.has(key.url)) continue
    await cache.delete(key)
    excess--
  }
}

// Trang web (dashboard) nhờ lưu trước các trang offline khi đang có mạng — người dùng chưa mở trang ôn tập lần nào
// vẫn ôn offline được. Chỉ nhận URL trong OFFLINE_PAGES cùng origin.
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'cache-offline-pages') return
  const urls = (event.data.urls || [])
    .map((u) => new URL(u, self.location.origin))
    .filter((u) => u.origin === self.location.origin && !u.search && OFFLINE_PAGES.includes(u.pathname))
  event.waitUntil(
    Promise.all(
      urls.map((u) =>
        // Accept text/html: app Android chỉ chèn bridge Capacitor vào HTML khi request khai báo nhận HTML
        fetch(u.href, { credentials: 'same-origin', headers: { Accept: 'text/html' } })
          .then((res) => (isCacheablePage(res) ? savePage(u.pathname, res) : undefined))
          .catch(() => {}),
      ),
    ),
  )
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'LacLingo', {
      body: data.body || '',
      icon: '/logo.svg',
      badge: '/logo.svg',
      tag: data.tag || 'laclingo',
      data: { url: data.url || '/' },
    }),
  )
})

// Bấm thông báo: focus tab LacLingo đang mở (điều hướng tới url) hoặc mở tab mới
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => new URL(c.url).origin === self.location.origin)
      if (!existing) return self.clients.openWindow(target)
      // navigate() lỗi với tab SW chưa kiểm soát — khi đó mở tab mới thay vì không làm gì
      return existing
        .focus()
        .then((c) => c.navigate(target))
        .catch(() => self.clients.openWindow(target))
    }),
  )
})
