// Service worker nhận web push nhắc học (xem features/reminder/push.ts).
// Payload do backend gửi: { title, body, url, tag } — xem ReminderService.

// Kiểm soát ngay các tab đang mở (kể cả tab vừa đăng ký SW) để notificationclick điều hướng được
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

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
