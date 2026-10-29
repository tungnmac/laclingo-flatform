'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { DASH, formatNumber } from '@/lib/company-format'
import { errorMessage } from '@/lib/error-message'
import type { VnStockListDto } from '@/server/vn/repo'
import { VN_EXCHANGES } from '@/server/vn/types'

/** Nhóm mã trên URL (?group=): không có = VN30 (mặc định), HOSE / HNX / UPCOM, all = tất cả */
const GROUPS = ['VN30', ...VN_EXCHANGES, 'all'] as const
type Group = (typeof GROUPS)[number]
const DEFAULT_GROUP: Group = 'VN30'

/** Danh sách cổ phiếu VN (tab "CK Việt Nam" của trang Thị trường) — bộ lọc nằm trên URL, giữ các tham số khác (VD ?tab=vn) */
export function VnStockList() {
  const query = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { t, locale } = useT()
  const group: Group = GROUPS.find((g) => g === query.get('group')) ?? DEFAULT_GROUP
  const q = query.get('q') ?? ''
  const page = Math.max(1, Number(query.get('page')) || 1)
  const [text, setText] = useState(q)
  const [data, setData] = useState<VnStockListDto | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [retry, setRetry] = useState(0)

  const go = (next: { group?: Group; q?: string; page?: number }) => {
    const p = new URLSearchParams(query.toString())
    for (const k of ['group', 'q', 'page']) p.delete(k)
    const g = next.group ?? group
    const qq = next.q ?? q
    if (g !== DEFAULT_GROUP) p.set('group', g)
    if (qq) p.set('q', qq)
    if ((next.page ?? 1) > 1) p.set('page', String(next.page))
    router.replace(`${pathname}${p.size ? `?${p}` : ''}`, { scroll: false })
  }

  // URL đổi từ ngoài (back/forward, bấm menu) → ô tìm kiếm theo URL; giữ nguyên khi chỉ khác khoảng trắng đang gõ
  useEffect(() => setText((cur) => (cur.trim() === q ? cur : q)), [q])

  // Gõ tìm kiếm: chờ 300 ms rồi mới cập nhật URL (về trang 1). group trong deps: đổi nhóm khi đang chờ → hẹn lại với nhóm mới
  useEffect(() => {
    if (text.trim() === q) return
    const id = setTimeout(() => go({ q: text.trim() }), 300)
    return () => clearTimeout(id)
  }, [text, group]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let alive = true
    setError(null)
    const p = new URLSearchParams({ page: String(page) })
    if (group === 'VN30') p.set('index', 'VN30')
    else if (group !== 'all') p.set('exchange', group)
    if (q) p.set('q', q)
    api<VnStockListDto>(`/api/vn/stocks?${p}`).then(
      (d) => alive && setData(d),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [group, q, page, locale, retry])

  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1
  const tab = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-semibold ${active ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">{t('vnStocks.subtitle')}</p>
        <div className="flex gap-2 text-sm">
          <Link href="/vn-stocks/screener" className="rounded-lg px-3 py-1.5 font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50">
            {t('vnPro.screenerTitle')} <span className="text-xs">PRO</span>
          </Link>
          <Link href="/vn-stocks/compare" className="rounded-lg px-3 py-1.5 font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50">
            {t('vnPro.compareTitle')} <span className="text-xs">PRO</span>
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist">
          {GROUPS.map((g) => (
            <button key={g} role="tab" aria-selected={g === group} onClick={() => go({ group: g })} className={tab(g === group)}>
              {g === 'all' ? t('vnStocks.allExchanges') : g}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('vnStocks.searchPlaceholder')}
          aria-label={t('vnStocks.searchPlaceholder')}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:w-72"
        />
      </div>

      {error !== null && (
        <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          <span>{errorMessage(error, t)}</span>
          <button onClick={() => setRetry((n) => n + 1)} className="font-semibold underline">
            {t('common.retry')}
          </button>
        </div>
      )}

      {data && !data.synced ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">{t('vnStocks.notSynced')}</p>
      ) : !data ? (
        error === null && <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>
      ) : !data.basket_synced ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">{t('vnStocks.basketNotSynced')}</p>
      ) : data.items.length === 0 ? (
        <div className="space-y-2 py-10 text-center text-slate-500">
          <p>{t('vnStocks.noResults')}</p>
          {group !== 'all' && q && (
            <button onClick={() => go({ group: 'all' })} className="text-sm font-semibold text-emerald-700 hover:underline">
              {t('vnStocks.searchAll')}
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">{t('vnStocks.colSymbol')}</th>
                <th className="px-4 py-2 text-left">{t('vnStocks.colName')}</th>
                <th className="hidden px-4 py-2 text-left sm:table-cell">{t('vnStocks.colExchange')}</th>
                <th className="px-4 py-2 text-right">{t('vnStocks.colClose')}</th>
                <th className="px-4 py-2 text-right">{t('vnStocks.colChange')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((s) => (
                <tr key={s.symbol} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-semibold">
                    <Link href={`/vn-stocks/${s.symbol}`} className="text-emerald-700 hover:underline">
                      {s.symbol}
                    </Link>
                  </td>
                  <td className="max-w-[16rem] truncate px-4 py-2 text-slate-700" title={s.name}>
                    {s.name}
                  </td>
                  <td className="hidden px-4 py-2 text-slate-500 sm:table-cell">{s.exchange}</td>
                  <td className="px-4 py-2 text-right tabular-nums" title={s.date ?? undefined}>
                    {formatNumber(s.close, locale, 0)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right tabular-nums ${s.change_pct === null ? '' : s.change_pct > 0 ? 'text-emerald-600' : s.change_pct < 0 ? 'text-rose-600' : 'text-amber-600'}`}
                  >
                    {s.change_pct === null ? DASH : `${s.change_pct > 0 ? '+' : ''}${formatNumber(s.change_pct, locale, 2)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > data.page_size && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => go({ page: page - 1 })} className="rounded-lg px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40">
            {t('common.prev')}
          </button>
          <span className="text-slate-500">{t('vnStocks.pageOf', { page, pages, total: data.total })}</span>
          <button disabled={page >= pages} onClick={() => go({ page: page + 1 })} className="rounded-lg px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40">
            {t('common.next')}
          </button>
        </div>
      )}

      <p className="text-xs text-slate-500">{t('vnStocks.disclaimer')}</p>
    </div>
  )
}
