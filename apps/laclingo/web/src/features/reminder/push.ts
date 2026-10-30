import { registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import { isNativeApp } from '@/lib/native'
import type { MyReminderSettings } from '@/types/api'
import { reminderService } from './reminder.service'

// Thông báo đẩy nhắc học, 2 kênh:
// - Trình duyệt: web push — đăng ký service worker (public/sw.js), xin quyền và gửi subscription lên backend.
//   iOS chỉ hỗ trợ khi web được "Thêm vào Màn hình chính" (PWA) — trình duyệt thường thì isPushSupported() = false.
// - App iOS/Android (Capacitor, apps/laclingo/mobile): Firebase Cloud Messaging qua plugin @capacitor-firebase/messaging
//   (cài ở app native, web chỉ gọi qua bridge) — gửi FCM token lên backend.

/** Phần plugin @capacitor-firebase/messaging mà web dùng (plugin chỉ có ở app native) */
interface FirebaseMessagingPlugin {
  checkPermissions(): Promise<{ receive: string }>
  requestPermissions(): Promise<{ receive: string }>
  getToken(): Promise<{ token: string }>
  deleteToken(): Promise<void>
  addListener(event: 'tokenReceived', cb: (e: { token: string }) => void): Promise<PluginListenerHandle>
  addListener(
    event: 'notificationActionPerformed',
    cb: (e: { notification: { data?: Record<string, unknown> } }) => void,
  ): Promise<PluginListenerHandle>
  addListener(
    event: 'notificationReceived',
    cb: (e: { notification: { title?: string; body?: string } }) => void,
  ): Promise<PluginListenerHandle>
}

/** Sự kiện cửa sổ khi app đang mở mà nhận thông báo đẩy — PushReceivedToaster hiện toast (Android không hiện lên thanh) */
export const PUSH_RECEIVED_EVENT = 'laclingo:push-received'
export type PushReceived = { title?: string; body?: string }

const FirebaseMessaging = registerPlugin<FirebaseMessagingPlugin>('FirebaseMessaging')

/** FCM token đã gửi lên backend từ thiết bị này (có = người dùng đã bật thông báo trong app) */
const NATIVE_TOKEN_KEY = 'laclingo-native-push-token'
/** Đăng xuất mà huỷ token FCM lỗi (offline...) → thử lại lần mở app sau, kẻo nhắc học của tài khoản cũ vẫn tới */
const NATIVE_REVOKE_KEY = 'laclingo-native-push-revoke'
/** iOS chờ APNs cấp token — thiếu capability Push / simulator có thể treo mãi */
const NATIVE_TOKEN_TIMEOUT_MS = 15_000

/** Plugin không cấp được token (Firebase chưa cấu hình, APNs lỗi, quá thời gian) — thẻ Nhắc học hiện câu dễ hiểu */
export class NativePushUnavailable extends Error {}

async function nativeToken(): Promise<string> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const { token } = await Promise.race([
      FirebaseMessaging.getToken(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), NATIVE_TOKEN_TIMEOUT_MS)
      }),
    ])
    if (!token) throw new Error('empty token')
    return token
  } catch (err) {
    throw new NativePushUnavailable((err as Error).message)
  } finally {
    clearTimeout(timer)
  }
}

// Đánh dấu trước rồi mới huỷ: lỗi / trang tải lại giữa chừng (đăng xuất) thì lần mở app sau huỷ lại
async function revokeNativeToken() {
  try {
    localStorage.setItem(NATIVE_REVOKE_KEY, '1')
  } catch {
    // localStorage bị chặn — không thử lại được
  }
  try {
    await FirebaseMessaging.deleteToken()
    localStorage.removeItem(NATIVE_REVOKE_KEY)
  } catch {
    // giữ cờ để thử lại
  }
}

export function isPushSupported(): boolean {
  if (isNativeApp()) return true
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/** Server đã cấu hình kênh đẩy dùng được trên thiết bị này chưa (FCM cho app, VAPID cho trình duyệt) */
export function pushConfigured(settings: MyReminderSettings): boolean {
  return isNativeApp() ? settings.native_push_configured : settings.push_configured
}

function pendingRevoke(): boolean {
  try {
    return localStorage.getItem(NATIVE_REVOKE_KEY) === '1'
  } catch {
    return false
  }
}

function storedNativeToken(): string | null {
  try {
    return localStorage.getItem(NATIVE_TOKEN_KEY)
  } catch {
    return null
  }
}

function storeNativeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(NATIVE_TOKEN_KEY, token)
    else localStorage.removeItem(NATIVE_TOKEN_KEY)
  } catch {
    // localStorage bị chặn — chỉ mất trạng thái "đã bật" trên máy này
  }
}

async function subscribeNativeToken(token: string) {
  const old = storedNativeToken()
  await reminderService.subscribeNative(token, browserTimezone())
  if (old && old !== token) await reminderService.unsubscribe(old).catch(() => {})
  storeNativeToken(token)
}

/**
 * App native: bấm thông báo → mở đúng trang; FCM đổi token → cập nhật backend. Gọi 1 lần khi app mở
 * (components/pwa/NativeAppBridge).
 */
let nativePushInitialized = false

export function initNativePush(navigate: (url: string) => void) {
  // 1 lần cho cả app (React dev chạy effect 2 lần → không đăng ký listener trùng)
  if (!isNativeApp() || nativePushInitialized) return
  nativePushInitialized = true
  if (pendingRevoke()) void revokeNativeToken()
  // .catch: bản app thiếu plugin push thì bỏ qua, không ném lỗi chưa xử lý
  FirebaseMessaging.addListener('notificationActionPerformed', (e) => {
    const url = e.notification.data?.url
    if (typeof url === 'string' && /^\/(?!\/)/.test(url)) navigate(url) // chỉ đường dẫn trong app (không "//host")
  }).catch(() => {})
  // App đang mở: hệ điều hành không hiện thông báo — báo cho giao diện tự hiện
  FirebaseMessaging.addListener('notificationReceived', (e) => {
    const { title, body } = e.notification
    window.dispatchEvent(new CustomEvent<PushReceived>(PUSH_RECEIVED_EVENT, { detail: { title, body } }))
  }).catch(() => {})
  FirebaseMessaging.addListener('tokenReceived', (e) => {
    if (storedNativeToken() && e.token) void subscribeNativeToken(e.token).catch(() => {})
  }).catch(() => {})
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
  if (isNativeApp() || !isPushSupported()) return null
  const reg = await navigator.serviceWorker.getRegistration('/sw.js')
  return reg ? reg.pushManager.getSubscription() : null
}

/** Xin quyền + đăng ký push + lưu lên backend. Trả về false nếu người dùng từ chối quyền. */
export async function enablePush(): Promise<boolean> {
  if (isNativeApp()) {
    const { receive } = await FirebaseMessaging.requestPermissions()
    if (receive !== 'granted') return false
    await subscribeNativeToken(await nativeToken())
    return true
  }
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
  if (isNativeApp()) {
    // Huỷ token FCM (kể cả khi không còn nhớ token — storage bị xoá): backend tự xoá khi FCM báo UNREGISTERED
    storeNativeToken(null)
    await revokeNativeToken()
    return
  }
  const subscription = await currentSubscription()
  await subscription?.unsubscribe()
}

/** Đồng bộ subscription sẵn có của trình duyệt lên backend (user hiện tại + múi giờ hiện tại). Trả về có subscription hay không. */
export async function syncPush(): Promise<boolean> {
  if (isNativeApp()) {
    if (!storedNativeToken()) return false
    if ((await FirebaseMessaging.checkPermissions()).receive !== 'granted') {
      // Người dùng tắt quyền thông báo trong Cài đặt của máy
      await reminderService.unsubscribe(storedNativeToken()!).catch(() => {})
      storeNativeToken(null)
      return false
    }
    await subscribeNativeToken(await nativeToken())
    return true
  }
  const subscription = await currentSubscription()
  if (!subscription) return false
  await reminderService.subscribe(subscription.toJSON(), browserTimezone())
  return true
}

/** Huỷ push trên trình duyệt này (cả ở trình duyệt lẫn backend) */
export async function disablePush(): Promise<void> {
  if (isNativeApp()) {
    const token = storedNativeToken()
    if (token) await reminderService.unsubscribe(token)
    storeNativeToken(null)
    await revokeNativeToken()
    return
  }
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
