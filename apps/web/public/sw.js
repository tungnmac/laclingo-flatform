// Service worker: web push nhắc học (xem features/reminder/push.ts) + trang offline cho PWA.
// Payload push do backend gửi: { title, body, url, tag } — xem ReminderService.

// Chỉ cache trang offline (đổi tên cache khi sửa offline.html) — mọi request khác vẫn đi mạng như bình thường
const OFFLINE_CACHE = 'laclingo-offline-v1'
const OFFLINE_URL = '/offline.html'

// Kiểm soát ngay các tab đang mở (kể cả tab vừa đăng ký SW) để notificationclick điều hướng được
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, '/logo.svg']))
      // Không cache được trang offline vẫn phải cài SW — nhắc học (push) phụ thuộc vào nó
      .catch(() => {})
      .then(() => self.skipWaiting()),
  )
})
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('laclingo-offline-') && k !== OFFLINE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

// Mở trang khi mất mạng → trang offline thay vì màn lỗi của trình duyệt (kèm logo trang đó dùng)
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL).then((r) => r || Response.error())))
  } else if (request.method === 'GET' && new URL(request.url).pathname === '/logo.svg') {
    event.respondWith(fetch(request).catch(() => caches.match('/logo.svg').then((r) => r || Response.error())))
  }
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
