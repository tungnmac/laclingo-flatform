'use client'

import { useState, type FormEvent } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { useFocusOnOpen } from '@/hooks/useFocusOnOpen'
import { api, ApiError } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { ORDER_STATUSES, isExecuted, type ManualMarket, type OrderStatus } from '@/server/journal/manual-markets'
import type { LedgerDto, ManualTradeDto } from '@/server/journal/manual-service'
import { EMOTIONS } from '@/server/journal/validation'

const inputClass = 'mt-1 block w-full rounded-lg border-0 px-3 py-2 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-emerald-600'

/** Giờ địa phương cho <input type="datetime-local"> */
function localDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Làm tròn phí/thuế gợi ý: VND về đồng, còn lại 8 số lẻ */
// toFixed (không String(số)) — số rất nhỏ như 5e-8 phải thành "0.00000005", server không nhận dạng số mũ
const roundFee = (n: number, currency: string) => (currency === 'VND' ? Math.round(n).toFixed(0) : n.toFixed(8).replace(/\.?0+$/, '') || '0')

interface Form {
  status: OrderStatus
  filled_qty: string
  executed_at: string
  symbol: string
  side: 'buy' | 'sell'
  qty: string
  price: string
  fee: string
  tax: string
  reason: string
  lesson: string
  emotion: string
  rating: string
  tags: string
}

const fromTrade = (tr: ManualTradeDto): Form => ({
  status: tr.status,
  filled_qty: tr.filled_qty ?? '',
  executed_at: localDateTime(new Date(tr.executed_at)),
  symbol: tr.symbol,
  side: tr.side,
  qty: tr.qty,
  price: tr.price,
  fee: tr.fee,
  tax: tr.tax,
  reason: tr.note?.reason ?? '',
  lesson: tr.note?.lesson ?? '',
  emotion: tr.note?.emotion ?? '',
  rating: tr.note?.rating ? String(tr.note.rating) : '',
  tags: tr.note?.tags.join(', ') ?? '',
})

/** Ghi mới (trade = null) hoặc sửa 1 lệnh thủ công */
export function ManualTradeForm({
  market,
  ledger,
  trade,
  onSaved,
  onCancel,
}: {
  market: ManualMarket
  ledger: LedgerDto
  trade: ManualTradeDto | null
  onSaved: () => void
  onCancel: () => void
}) {
  const { t } = useT()
  const [form, setForm] = useState<Form>(
    trade
      ? fromTrade(trade)
      : { status: 'filled', filled_qty: '', executed_at: localDateTime(new Date()), symbol: '', side: 'buy', qty: '', price: '', fee: '', tax: '', reason: '', lesson: '', emotion: '', rating: '', tags: '' },
  )
  // Lệnh mới, hoặc sửa lệnh CHƯA khớp (phí còn 0): tự tính phí; sửa lệnh đã khớp: giữ phí/thuế đã nhập
  const [autoFee, setAutoFee] = useState(!trade || !isExecuted(trade.status))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const formRef = useFocusOnOpen<HTMLFormElement>(trade?.id ?? 'new') // mở form (ghi mới / sửa 1 dòng) → cuộn tới & focus

  const value = Number(form.qty) * Number(form.price)
  /** Phí = giá trị × % phí; thuế chỉ khi bán = giá trị × % thuế (theo cài đặt sổ) */
  const withFees = (f: Form): Form => {
    // Phí / thuế chỉ phát sinh trên phần ĐÃ khớp
    const executed = f.status === 'filled' ? Number(f.qty) : f.status === 'partial' ? Number(f.filled_qty) : 0
    const v = executed * Number(f.price)
    if (!Number.isFinite(v)) return f
    return {
      ...f,
      fee: roundFee((v * ledger.fee_rate_pct) / 100, ledger.currency),
      tax: f.side === 'sell' ? roundFee((v * ledger.sell_tax_pct) / 100, ledger.currency) : '0',
    }
  }
  // Sửa tay ô phí/thuế → tắt tự tính (không ghi đè số người dùng nhập)
  const set = (patch: Partial<Form>) => setForm((f) => (autoFee && !('fee' in patch) && !('tax' in patch) ? withFees({ ...f, ...patch }) : { ...f, ...patch }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const date = new Date(form.executed_at)
      if (Number.isNaN(date.getTime())) throw new ApiError('invalid date', 400, 'INVALID_DATE')
      const body = {
        executed_at: date.toISOString(), // giờ địa phương của người dùng → UTC
        status: form.status,
        filled_qty: form.status === 'partial' ? form.filled_qty.trim() : null,
        symbol: form.symbol,
        side: form.side,
        qty: form.qty.trim(),
        price: form.price.trim(),
        fee: form.fee.trim(),
        tax: form.tax.trim(),
        reason: form.reason || null,
        lesson: form.lesson || null,
        emotion: form.emotion || null,
        rating: form.rating ? Number(form.rating) : null,
        tags: form.tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }
      if (trade) await api(`/api/journal/manual/trades/${trade.id}`, { method: 'PUT', body: JSON.stringify(body) })
      else await api(`/api/journal/manual/${market}/trades`, { method: 'POST', body: JSON.stringify(body) })
      onSaved()
    } catch (err) {
      setError(err)
      setSaving(false)
    }
  }

  const field = (key: keyof Form, label: string, props: Record<string, unknown> = {}) => (
    <label className="block text-xs font-medium text-slate-600">
      {label}
      <input value={form[key]} onChange={(e) => set({ [key]: e.target.value })} className={inputClass} {...props} />
    </label>
  )

  return (
    <form ref={formRef} onSubmit={submit} className="scroll-mt-20 space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-200">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {field('executed_at', t('manual.date'), { type: 'datetime-local', required: true })}
        {field('symbol', t('manual.symbol'), { 'data-autofocus': trade ? undefined : true, required: true, maxLength: 30, placeholder: market === 'vn' ? 'FPT' : market === 'us' ? 'AAPL' : market === 'crypto' ? 'BTCUSDT' : 'EURUSD' })}
        <label className="block text-xs font-medium text-slate-600">
          {t('manual.side')}
          <select value={form.side} onChange={(e) => set({ side: e.target.value as Form['side'] })} className={inputClass}>
            <option value="buy">{t('manual.buy')}</option>
            <option value="sell">{t('manual.sell')}</option>
          </select>
        </label>
        {field('qty', t('manual.qty'), { inputMode: 'decimal', required: true })}
        <label className="block text-xs font-medium text-slate-600">
          {t('manual.status')}
          <select value={form.status} onChange={(e) => set({ status: e.target.value as OrderStatus })} className={inputClass}>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`manual.status_${s}`)}
              </option>
            ))}
          </select>
        </label>
        {form.status === 'partial' && field('filled_qty', t('manual.filledQty'), { inputMode: 'decimal', required: true })}
        <div>
          {field('price', t('manual.price'), { 'data-autofocus': trade ? true : undefined, inputMode: 'decimal', required: true })}
          {market === 'vn' && <p className="mt-0.5 text-[11px] text-slate-400">{t('manual.priceHintVn')}</p>}
        </div>
        {field('fee', `${t('manual.fee')} (${ledger.currency})`, { inputMode: 'decimal', onInput: () => setAutoFee(false) })}
        {field('tax', `${t('manual.tax')} (${ledger.currency})`, { inputMode: 'decimal', onInput: () => setAutoFee(false) })}
        <div className="flex flex-col justify-end text-xs text-slate-500">
          <span className="text-[11px] text-slate-400">{t('manual.statusHint')}</span>
          {Number.isFinite(value) && value > 0 && (
            <span>
              {t('manual.total')}: <b className="tabular-nums text-slate-700">{value.toLocaleString(undefined, { maximumFractionDigits: 8 })}</b>
            </span>
          )}
          <label className="mt-1 flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={autoFee}
              onChange={(e) => {
                setAutoFee(e.target.checked)
                if (e.target.checked) setForm(withFees)
              }}
              className="rounded text-emerald-600"
            />
            {t('manual.autoFee')}
          </label>
        </div>
      </div>

      <details className="rounded-lg bg-slate-50 px-3 py-2" open={!!trade?.note}>
        <summary className="cursor-pointer text-xs font-semibold text-slate-600">{t('manual.notes')}</summary>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-slate-600">
            {t('manual.reason')}
            <textarea rows={2} maxLength={2000} value={form.reason} onChange={(e) => set({ reason: e.target.value })} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            {t('manual.lesson')}
            <textarea rows={2} maxLength={2000} value={form.lesson} onChange={(e) => set({ lesson: e.target.value })} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            {t('manual.emotion')}
            <select value={form.emotion} onChange={(e) => set({ emotion: e.target.value })} className={inputClass}>
              <option value="">—</option>
              {EMOTIONS.map((e) => (
                <option key={e} value={e}>
                  {t(`journal.emotions.${e}`)}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-600">
              {t('manual.rating')}
              <select value={form.rating} onChange={(e) => set({ rating: e.target.value })} className={inputClass}>
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            {field('tags', t('manual.tags'))}
          </div>
        </div>
      </details>

      {error !== null && <p className="text-sm text-rose-600">{errorMessage(error, t)}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
          {t('manual.save')}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-slate-600 hover:underline">
          {t('manual.cancel')}
        </button>
      </div>
    </form>
  )
}
