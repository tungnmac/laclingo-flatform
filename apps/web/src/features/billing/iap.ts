import { registerPlugin } from '@capacitor/core'
import { isNativeApp, nativePlatform } from '@/lib/native'
import { useSession } from '@/store/session'
import type { CatalogItem, CatalogResponse, IAPResult } from '@/types/api'
import { billingService } from './billing.service'

// Mua trong app iOS/Android (chính sách store: hàng số trong app phải qua Apple In-App Purchase / Google Play
// Billing, không dẫn sang VNPay/Stripe). Plugin @capgo/native-purchases cài ở app native (apps/mobile), web gọi qua
// bridge. Luồng: store thanh toán → gửi bằng chứng lên backend xác thực + giao hàng → mới hoàn tất giao dịch
// (iOS finishTransaction, Android consume gói gems; Android gói Pro do server acknowledge).

/** Phần plugin NativePurchases mà web dùng */
interface StoreTransaction {
  transactionId: string
  productIdentifier: string
  jwsRepresentation?: string // iOS (StoreKit 2)
  purchaseToken?: string // Android
  isAcknowledged?: boolean
}

interface StoreProduct {
  identifier: string
  priceString: string
}

interface NativePurchasesPlugin {
  getProducts(options: { productIdentifiers: string[]; productType?: 'inapp' | 'subs' }): Promise<{ products: StoreProduct[] }>
  purchaseProduct(options: {
    productIdentifier: string
    planIdentifier?: string
    productType?: 'inapp' | 'subs'
    appAccountToken?: string
    isConsumable?: boolean
    autoAcknowledgePurchases?: boolean
  }): Promise<StoreTransaction>
  restorePurchases(): Promise<void>
  getPurchases(options?: { productType?: 'inapp' | 'subs'; onlyCurrentEntitlements?: boolean }): Promise<{ purchases: StoreTransaction[] }>
  getUnfinishedTransactions(): Promise<{ transactions: StoreTransaction[] }>
  finishTransaction(options: { transactionId: string }): Promise<void>
  consumePurchase(options: { purchaseToken: string }): Promise<void>
  manageSubscriptions(): Promise<void>
  addListener(event: 'transactionUpdated', cb: (t: StoreTransaction) => void): Promise<unknown>
}

const NativePurchases = registerPlugin<NativePurchasesPlugin>('NativePurchases')

/** Base plan của gói tự gia hạn trên Google Play Console (bắt buộc khi mua subscription Android) */
const GOOGLE_BASE_PLAN: Record<string, string> = { MONTHLY: 'monthly', YEARLY: 'yearly' }

/** Người dùng tự huỷ hộp thoại thanh toán của store — không báo lỗi */
export class StorePurchaseCancelled extends Error {}

/** Thanh toán đang chờ (Android: tiền mặt / chuyển khoản; iOS: "Ask to Buy") — xong sẽ tự xử lý */
export class StorePurchasePending extends Error {}

/** Trong app native: store của nền tảng này đã cấu hình ở server chưa (chưa → không bán được trong app) */
export function storeEnabled(providers: CatalogResponse['providers']): boolean {
  if (!isNativeApp()) return false
  return nativePlatform() === 'ios' ? providers.apple : providers.google_play
}

export function storeName(): string {
  return nativePlatform() === 'ios' ? 'App Store' : 'Google Play'
}

const productType = (item: CatalogItem) => (item.recurring ? 'subs' : 'inapp')

function itemByProduct(items: CatalogItem[], productId: string) {
  return items.find((i) => i.store_product_id === productId)
}

/** Giá do store trả về theo quốc gia của tài khoản store (vd "79.000 ₫", "$4.99"): store_product_id → giá */
export async function loadStorePrices(items: CatalogItem[]): Promise<Record<string, string>> {
  const prices: Record<string, string> = {}
  const groups = nativePlatform() === 'android' ? [items.filter((i) => i.recurring), items.filter((i) => !i.recurring)] : [items]
  for (const group of groups) {
    if (group.length === 0) continue
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: group.map((i) => i.store_product_id),
      productType: productType(group[0]),
    })
    for (const p of products) prices[p.identifier] = p.priceString
  }
  return prices
}

/** Gửi giao dịch lên server xác thực + giao hàng, rồi hoàn tất giao dịch ở store */
async function verifyAndFinish(t: StoreTransaction, item: CatalogItem): Promise<IAPResult> {
  let result: IAPResult
  if (nativePlatform() === 'ios') {
    if (!t.jwsRepresentation) throw new Error('missing jwsRepresentation')
    result = await billingService.verifyApple(t.jwsRepresentation)
    await NativePurchases.finishTransaction({ transactionId: t.transactionId })
  } else {
    if (!t.purchaseToken) throw new Error('missing purchaseToken')
    result = await billingService.verifyGoogle(item.store_product_id, t.purchaseToken)
    if (item.kind === 'gems') await NativePurchases.consumePurchase({ purchaseToken: t.purchaseToken }) // để mua lại được
  }
  return result
}

/** Mua 1 món qua store của máy */
export async function buyFromStore(item: CatalogItem): Promise<IAPResult> {
  const userId = useSession.getState().user?.id
  let t: StoreTransaction
  try {
    t = await NativePurchases.purchaseProduct({
      productIdentifier: item.store_product_id,
      planIdentifier: nativePlatform() === 'android' && item.plan ? GOOGLE_BASE_PLAN[item.plan] : undefined,
      productType: productType(item),
      appAccountToken: userId, // gắn giao dịch với tài khoản LacLingo — server kiểm khớp
      isConsumable: false, // gems: consume sau khi server đã cộng (verifyAndFinish)
      autoAcknowledgePurchases: false,
    })
  } catch (err) {
    const message = (err as Error).message ?? ''
    if (/cancel/i.test(message)) throw new StorePurchaseCancelled()
    if (/pending|deferred/i.test(message)) throw new StorePurchasePending()
    throw err
  }
  return verifyAndFinish(t, item)
}

/** Khôi phục giao dịch đã mua (đổi máy / cài lại app) — trả số món vừa được cấp lại */
export async function restoreStorePurchases(items: CatalogItem[]): Promise<number> {
  await NativePurchases.restorePurchases()
  // Chỉ gói đang hiệu lực — lịch sử gia hạn cũ (đã hết hạn) không cần gửi lại
  const { purchases } = await NativePurchases.getPurchases({ onlyCurrentEntitlements: true })
  let granted = 0
  for (const t of purchases) {
    const item = itemByProduct(items, t.productIdentifier)
    if (!item || item.kind === 'gems') continue // gems đã dùng hết khi mua, không khôi phục
    try {
      if ((await verifyAndFinish(t, item)).granted) granted++
    } catch {
      // giao dịch hết hạn / thuộc tài khoản khác — bỏ qua, xử lý các giao dịch còn lại
    }
  }
  return granted
}

/**
 * Giao dịch đã thanh toán nhưng chưa hoàn tất (thanh toán chờ đã xong, app tắt giữa chừng...) → xác thực + hoàn tất.
 * Android không có sự kiện transactionUpdated nên gọi thêm mỗi khi mở trang Bảng giá / Ví. Trả số món vừa được cấp.
 */
export async function processUnfinishedTransactions(items: CatalogItem[]): Promise<number> {
  const { transactions } = await NativePurchases.getUnfinishedTransactions()
  let granted = 0
  for (const t of transactions) {
    const item = itemByProduct(items, t.productIdentifier)
    if (!item) continue
    try {
      if ((await verifyAndFinish(t, item)).granted) granted++
    } catch {
      // thử lại lần sau
    }
  }
  return granted
}

export function manageStoreSubscriptions(): Promise<void> {
  return NativePurchases.manageSubscriptions()
}

let storeListenerStarted = false

/**
 * Giao dịch đến ngoài luồng mua (gia hạn, "Ask to Buy" được duyệt, mua dở do tắt app...) → xác thực + hoàn tất.
 * Gọi khi đã đăng nhập ((dashboard)/layout — BackgroundSync).
 */
export function initStoreTransactions() {
  if (!isNativeApp() || storeListenerStarted) return
  storeListenerStarted = true
  void (async () => {
    let items: CatalogItem[]
    try {
      const catalog = await billingService.catalog()
      if (!storeEnabled(catalog.providers)) return
      items = catalog.items
    } catch {
      storeListenerStarted = false // lỗi mạng — lần vào app sau thử lại
      return
    }
    NativePurchases.addListener('transactionUpdated', (t) => {
      const item = itemByProduct(items, t.productIdentifier)
      if (item) void verifyAndFinish(t, item).catch(() => {})
    }).catch(() => {})
    await processUnfinishedTransactions(items).catch(() => 0)
  })()
}
