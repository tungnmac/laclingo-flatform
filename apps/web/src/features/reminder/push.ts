import { reminderService } from './reminder.service'

// Web push phía trình duyệt: đăng ký service worker (public/sw.js), xin quyền
// thông báo và gửi subscription lên backend. iOS chỉ hỗ trợ khi web được
// "Thêm vào Màn hình chính" (PWA) — trình duyệt thường thì isPushSupported() = false.

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function browserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh'
}

async function registration(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register('/sw.js')
  return navigator.serviceWorker.ready
}

/** Subscription hiện tại của trình duyệt này (null = chưa bật) */
export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  const reg = await navigator.serviceWorker.getRegistration('/sw.js')
  return reg ? reg.pushManager.getSubscription() : null
}

/** Xin quyền + đăng ký push + lưu lên backend. Trả về false nếu người dùng từ chối quyền. */
export async function enablePush(): Promise<boolean> {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false
  const { public_key } = await reminderService.publicKey()
  const reg = await registration()
  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(public_key) }))
  await reminderService.subscribe(subscription.toJSON(), browserTimezone())
  return true
}

/** Huỷ subscription ở trình duyệt mà không gọi backend — dùng khi đăng xuất (token đã bị xoá) */
export async function forgetPushOnThisBrowser(): Promise<void> {
  const subscription = await currentSubscription()
  await subscription?.unsubscribe()
}

/** Đồng bộ subscription sẵn có của trình duyệt lên backend (user hiện tại + múi giờ hiện tại). Trả về có subscription hay không. */
export async function syncPush(): Promise<boolean> {
  const subscription = await currentSubscription()
  if (!subscription) return false
  await reminderService.subscribe(subscription.toJSON(), browserTimezone())
  return true
}

/** Huỷ push trên trình duyệt này (cả ở trình duyệt lẫn backend) */
export async function disablePush(): Promise<void> {
  const subscription = await currentSubscription()
  if (!subscription) return
  await reminderService.unsubscribe(subscription.endpoint)
  await subscription.unsubscribe()
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = (value + '='.repeat((4 - (value.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}
