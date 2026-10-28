'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { useTranslation } from '@/hooks/useTranslation'
import { ApiError, inlineError } from '@/lib/api'
import { isNativeApp } from '@/lib/native'
import { cn } from '@/lib/utils'
import type { CatalogItem, CatalogResponse, PaymentProvider, SubscriptionInfo } from '@/types/api'
import { billingService } from '../billing.service'
import {
  buyFromStore,
  loadStorePrices,
  manageStoreSubscriptions,
  restoreStorePurchases,
  storeEnabled,
  processUnfinishedTransactions,
  storeName,
  StorePurchaseCancelled,
  StorePurchasePending,
} from '../iap'
import { formatProviderPrice } from '../pricing'

/**
 * Trong app native: giá store theo quốc gia tài khoản store (store_product_id → "79.000 ₫"); web → {}. Đồng thời xử
 * lý giao dịch đã trả tiền mà chưa hoàn tất (thanh toán chờ đã xong...) — có món vừa được cấp thì gọi onGranted.
 */
export function useStorePrices(catalog: CatalogResponse | null | undefined, onGranted?: () => void): Record<string, string> {
  const [prices, setPrices] = useState<Record<string, string>>({})
  useEffect(() => {
    if (!catalog || !storeEnabled(catalog.providers)) return
    loadStorePrices(catalog.items).then(setPrices, () => {})
    processUnfinishedTransactions(catalog.items).then((n) => n > 0 && onGranted?.(), () => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog])
  return prices
}

type CheckoutProps = {
  item: CatalogItem
  providers: CatalogResponse['providers']
  compact?: boolean
  storePrice?: string // giá store (app native)
  onPurchased?: () => void // app native: mua xong → nơi gọi tải lại gói / ví
}

/**
 * Nút thanh toán 1 món. Web: theo từng cổng đang bật — tạo đơn rồi chuyển sang trang của cổng. App iOS/Android: chỉ
 * mua qua App Store / Google Play (chính sách store không cho dẫn sang VNPay/Stripe).
 */
export function CheckoutButtons(props: CheckoutProps) {
  return isNativeApp() ? <StoreBuyButton {...props} /> : <WebCheckoutButtons {...props} />
}

function StoreBuyButton({ item, providers, compact, storePrice, onPurchased }: CheckoutProps) {
  const t = useTranslation()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!storeEnabled(providers)) return <p className="text-xs text-slate-500">{t.billing.storeUnavailable}</p>

  const buy = async () => {
    setBusy(true)
    setError(null)
    try {
      await buyFromStore(item)
      toast(t.billing.purchased)
      onPurchased?.()
    } catch (err) {
      if (err instanceof StorePurchasePending) setError(t.billing.storePending)
      else if (!(err instanceof StorePurchaseCancelled)) setError(err instanceof ApiError ? inlineError(err) : t.billing.storeError)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => void buy()}
        className={cn(
          'rounded-xl bg-indigo-600 px-3 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60',
          compact ? 'py-1.5 text-xs' : 'py-2 text-sm',
        )}
      >
        {busy ? t.billing.processing : storePrice ? `${t.billing.buyInApp} · ${storePrice}` : t.billing.buyInApp}
      </button>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  )
}

function WebCheckoutButtons({ item, providers, compact }: CheckoutProps) {
  const t = useTranslation()
  const [busy, setBusy] = useState<PaymentProvider | null>(null)
  const [error, setError] = useState<string | null>(null)
  const enabled: PaymentProvider[] = [...(providers.vnpay ? (['VNPAY'] as const) : []), ...(providers.stripe ? (['STRIPE'] as const) : [])]

  const pay = async (provider: PaymentProvider) => {
    setBusy(provider)
    setError(null)
    try {
      const { url } = await billingService.checkout(item.id, provider)
      window.location.href = url // giữ trạng thái "đang chuyển" tới khi trang cổng mở
    } catch (err) {
      setError(inlineError(err))
      setBusy(null)
    }
  }

  if (enabled.length === 0) return <p className="text-xs text-slate-500">{t.billing.noProvider}</p>
  return (
    <div className="flex flex-col gap-2">
      {enabled.map((p) => (
        <button
          key={p}
          type="button"
          disabled={busy !== null}
          onClick={() => void pay(p)}
          className={cn(
            'rounded-xl px-3 font-semibold transition disabled:opacity-60',
            compact ? 'py-1.5 text-xs' : 'py-2 text-sm',
            p === 'VNPAY' ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-slate-900 text-white hover:bg-slate-700',
          )}
        >
          {busy === p ? t.billing.redirecting : `${p === 'VNPAY' ? t.billing.payVNPay : t.billing.payStripe} · ${formatProviderPrice(item, p)}`}
        </button>
      ))}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  )
}

/**
 * Quản lý gói tự gia hạn theo nơi đã mua: Stripe → trang Stripe (chỉ trên web), App Store / Google Play → trang quản
 * lý của store (chỉ trong app). Không mở được ở môi trường hiện tại → dòng hướng dẫn.
 */
export function ManageSubscriptionButton({ sub }: { sub: SubscriptionInfo }) {
  const t = useTranslation()
  const store = sub.payment_provider === 'APPLE_IAP' || sub.payment_provider === 'GOOGLE_PLAY'
  if (store !== isNativeApp()) {
    return <span className="text-xs font-normal">{store ? t.billing.manageOnPhone : t.billing.manageOnWeb}</span>
  }
  if (store) {
    return (
      <button
        type="button"
        onClick={() => void manageStoreSubscriptions().catch(() => {})}
        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
      >
        {t.billing.manageInStore(storeName())}
      </button>
    )
  }
  return <StripePortalButton />
}

/** App native: khôi phục giao dịch đã mua (App Store bắt buộc có nút này) */
export function RestorePurchasesButton({ catalog, onRestored }: { catalog: CatalogResponse; onRestored?: () => void }) {
  const t = useTranslation()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  if (!storeEnabled(catalog.providers)) return null
  const restore = async () => {
    setBusy(true)
    try {
      toast(t.billing.restored(await restoreStorePurchases(catalog.items)))
      onRestored?.()
    } catch {
      toast(t.billing.storeError, 'error')
    } finally {
      setBusy(false)
    }
  }
  return (
    <button type="button" disabled={busy} onClick={() => void restore()} className="text-sm font-medium text-indigo-600 hover:underline disabled:opacity-60">
      {busy ? t.billing.processing : t.billing.restore}
    </button>
  )
}

/** Nút mở trang Stripe quản lý gói tự gia hạn */
function StripePortalButton() {
  const t = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const open = async () => {
    setBusy(true)
    setError(null)
    try {
      window.location.href = (await billingService.portal()).url
    } catch (err) {
      setError(inlineError(err))
      setBusy(false)
    }
  }
  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => void open()}
        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-60"
      >
        {busy ? t.billing.redirecting : t.billing.manageSubscription}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </span>
  )
}
