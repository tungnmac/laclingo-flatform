'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useMemo, useState } from 'react'
import { ManualTradeDetail } from '@/components/journal/ManualTradeDetail'
import { ManualTradeForm } from '@/components/journal/ManualTradeForm'
import { pnlColor } from '@/components/trading/labels'
import { useT } from '@/i18n/I18nProvider'
import { api, ApiError } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { takeFromJournal } from '@/lib/journal-nav'
import { moneyFormat } from '@/lib/money-format'
import { isExecuted, type ManualMarket } from '@/server/journal/manual-markets'
import type { ManualTradeDetailDto } from '@/server/journal/manual-service'

/** Trang chi tiết 1 lệnh ghi tay: thông tin đầy đủ + diễn biến vị thế / giá vốn của cùng mã */
export default function ManualTradePage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params)
  const { t, locale } = useT()
  const router = useRouter()
  const [data, setData] = useState<ManualTradeDetailDto | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [editing, setEditing] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let alive = true
    setError(null)
    api<ManualTradeDetailDto>(`/api/journal/manual/trades/${encodeURIComponent(id)}`).then(
      (d) => alive && setData(d),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [id, reload])

  const money = useMemo(() => moneyFormat(data?.ledger.currency ?? 'USD', locale), [data?.ledger.currency, locale])
  const journalHref = `/journal?tab=${data?.trade.market ?? 'vn'}`
  // Vào từ Nhật ký (có cờ) → Back của trình duyệt giữ nguyên bộ lọc / trang / mục đang mở;
  // mở link trực tiếp / tab mới → về tab thị trường của lệnh (không dùng history.length: có thể đưa ra khỏi app)
  const back = () => (takeFromJournal() ? router.back() : router.push(journalHref))
  const fmt = (iso: string) => new Date(iso).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })

  if (error !== null) {
    return (
      <div className="space-y-3 py-10 text-center">
        <p className="text-slate-500">{error instanceof ApiError && error.status === 404 ? t('manual.notFound') : errorMessage(error, t)}</p>
        <button onClick={back} className="text-sm font-semibold text-emerald-700 hover:underline">
          {t('manual.backToJournal')}
        </button>
      </div>
    )
  }
  if (!data) return <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>
  const tr = data.trade

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <button onClick={back} className="text-sm font-semibold text-emerald-700 hover:underline">
        {t('manual.backToJournal')}
      </button>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">
          <span className={tr.side === 'buy' ? 'text-emerald-700' : 'text-rose-600'}>{t(`manual.${tr.side}`)}</span> {tr.symbol}{' '}
          <span className="text-base font-semibold text-slate-500">
            {money.plain(tr.qty)} × {money.plain(tr.price)}
          </span>
        </h1>
        <p className="text-sm text-slate-500">
          {t(`journalTabs.${tr.market}`)} · {fmt(tr.executed_at)} · {t(`manual.status_${tr.status}`)}
          {tr.status === 'partial' && ` ${money.plain(tr.executed_qty)}/${money.plain(tr.qty)}`}
        </p>
      </div>

      {editing ? (
        <ManualTradeForm
          market={tr.market as ManualMarket}
          ledger={data.ledger}
          trade={tr}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false)
            setReload((n) => n + 1)
          }}
        />
      ) : (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <ManualTradeDetail
            trade={tr}
            money={money}
            actions={
              <button onClick={() => setEditing(true)} className="font-semibold text-slate-600 hover:underline">
                {t('manual.edit')}
              </button>
            }
          />
        </section>
      )}

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <h2 className="border-b border-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">{t('manual.timeline', { symbol: tr.symbol })}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">{t('manual.date')}</th>
                <th className="px-3 py-2">{t('manual.side')}</th>
                <th className="px-3 py-2 text-right">{t('manual.qty')}</th>
                <th className="px-3 py-2 text-right">{t('manual.price')}</th>
                <th className="px-3 py-2 text-right">{t('manual.afterLabel')}</th>
                <th className="px-3 py-2 text-right">{t('manual.avgAfter')}</th>
                <th className="px-3 py-2 text-right">{t('manual.realized')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.timeline.map((x) => {
                const current = x.id === tr.id
                return (
                  <tr key={x.id} aria-current={current ? 'true' : undefined} className={`${current ? 'bg-emerald-50 font-semibold' : ''} ${isExecuted(x.status) ? '' : 'opacity-50'}`}>
                    <td className="whitespace-nowrap px-3 py-2">
                      {current ? (
                        fmt(x.executed_at)
                      ) : (
                        <Link href={`/journal/trades/${x.id}`} replace className="text-emerald-700 hover:underline">
                          {fmt(x.executed_at)}
                        </Link>
                      )}
                      {current && <span className="ml-1 text-xs text-emerald-700">· {t('manual.thisTrade')}</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {t(`manual.${x.side}`)}
                      {!isExecuted(x.status) && <span className="ml-1 text-xs">({t(`manual.status_${x.status}`)})</span>}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{x.status === 'partial' ? `${money.plain(x.executed_qty)}/${money.plain(x.qty)}` : money.plain(x.qty)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{money.plain(x.price)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{x.position_after === null ? '—' : money.plain(x.position_after)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{x.avg_price_after === null || Number(x.position_after) === 0 ? '—' : money.plain(x.avg_price_after)}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${Number(x.closed_qty) > 0 ? pnlColor(x.realized_pnl) : 'text-slate-300'}`}>
                      {Number(x.closed_qty) > 0 ? money.pnl(x.realized_pnl) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
