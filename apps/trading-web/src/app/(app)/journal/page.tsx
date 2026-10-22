'use client'

import dynamic from 'next/dynamic'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { JournalFilters, type Filters } from '@/components/journal/JournalFilters'
import { ManualJournal } from '@/components/journal/ManualJournal'
import { JournalTrades } from '@/components/journal/JournalTrades'
import { MetricCards } from '@/components/journal/MetricCards'
import { SymbolTable } from '@/components/journal/SymbolTable'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { normalizeAccountFilter } from '@/lib/journal-filter'
import { MANUAL_MARKETS } from '@/server/journal/manual-markets'
import type { AccountSummaryDto, JournalTradeDto, NoteDto } from '@/server/journal/journal-service'
import type { Stats } from '@/server/journal/stats'
import type { InstrumentDto } from '@/server/market/instruments'

const PnlCurve = dynamic(() => import('@/components/journal/PnlCurve').then((m) => m.PnlCurve), { ssr: false })
const PAGE_SIZE = 20
const RANGE_VALUES = ['7d', '30d', '90d', 'all'] as const

function readFilters(params: URLSearchParams): Filters {
  const range = params.get('range')
  return {
    account: params.get('account') || 'current',
    symbol: params.get('symbol') || '',
    range: (RANGE_VALUES as readonly string[]).includes(range ?? '') ? (range as Filters['range']) : 'all',
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">{title}</h2>
      {children}
    </section>
  )
}

function JournalView() {
  const { t } = useT()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const filters = readFilters(params)
  const query = new URLSearchParams({ account: filters.account, range: filters.range, ...(filters.symbol ? { symbol: filters.symbol } : {}) }).toString()

  const [accounts, setAccounts] = useState<AccountSummaryDto[] | null>(null)
  const [symbols, setSymbols] = useState<string[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [trades, setTrades] = useState<{ items: JournalTradeDto[]; total: number } | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<unknown>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    api<AccountSummaryDto[]>('/api/journal/accounts').then(setAccounts, () => {})
    api<InstrumentDto[]>('/api/market/instruments?market=crypto').then((list) => setSymbols(list.map((i) => i.symbol)), () => {})
  }, [])

  // account trên URL không khớp lựa chọn nào (link của người khác, id ví đang dùng…) → về Ví hiện tại
  useEffect(() => {
    if (accounts && normalizeAccountFilter(filters.account, accounts) !== filters.account) update({ account: 'current' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, filters.account])

  // Đổi bộ lọc → về trang 1
  useEffect(() => setPage(1), [query])

  useEffect(() => {
    let cancelled = false
    setError(null)
    setStats(null)
    api<Stats>(`/api/journal/stats?${query}`).then(
      (s) => !cancelled && setStats(s),
      (err) => !cancelled && setError(err),
    )
    return () => {
      cancelled = true
    }
  }, [query, reloadKey])

  useEffect(() => {
    let cancelled = false
    setTrades(null)
    api<{ items: JournalTradeDto[]; total: number }>(`/api/journal/trades?${query}&page=${page}&page_size=${PAGE_SIZE}`).then(
      (r) => !cancelled && setTrades(r),
      (err) => !cancelled && setError(err),
    )
    return () => {
      cancelled = true
    }
  }, [query, page, reloadKey])

  const update = (next: Partial<Filters>) => {
    const merged = { ...filters, ...next }
    const qs = new URLSearchParams()
    if (merged.account !== 'current') qs.set('account', merged.account)
    if (merged.symbol) qs.set('symbol', merged.symbol)
    if (merged.range !== 'all') qs.set('range', merged.range)
    const s = qs.toString()
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false })
  }

  const onNoteSaved = useCallback((tradeId: string, note: NoteDto) => {
    setTrades((prev) => prev && { ...prev, items: prev.items.map((tr) => (tr.id === tradeId ? { ...tr, note } : tr)) })
  }, [])

  // Mã đang lọc có thể không còn trong danh sách sàn → vẫn hiện trong select
  const symbolOptions = filters.symbol && !symbols.includes(filters.symbol) ? [filters.symbol, ...symbols] : symbols
  const pages = trades ? Math.max(1, Math.ceil(trades.total / PAGE_SIZE)) : 1

  return (
    <div className="space-y-4">
      <JournalFilters value={filters} onChange={update} accounts={accounts ?? []} symbols={symbolOptions} />

      {error !== null && (
        <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          <span>{errorMessage(error, t)}</span>
          <button onClick={() => setReloadKey((k) => k + 1)} className="font-semibold underline">
            {t('common.retry')}
          </button>
        </div>
      )}

      {stats === null && error === null && <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>}

      {stats && (
        <>
          <MetricCards metrics={stats.metrics} />
          <Section title={t('journal.curveTitle')}>
            {stats.curve.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-400">{t('journal.curveEmpty')}</p>
            ) : (
              <div className="p-2">
                <PnlCurve points={stats.curve} />
              </div>
            )}
          </Section>
          {stats.by_symbol.length > 0 && (
            <Section title={t('journal.bySymbol')}>
              <div className="overflow-x-auto">
                <SymbolTable rows={stats.by_symbol} />
              </div>
            </Section>
          )}
        </>
      )}

      <Section title={t('journal.tradesTitle')}>
        {trades === null ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">{t('common.loading')}</p>
        ) : (
          <JournalTrades items={trades.items} onNoteSaved={onNoteSaved} />
        )}
        {pages > 1 && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-2 text-sm">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded px-2 py-1 ring-1 ring-slate-200 disabled:opacity-40">
              ← {t('common.prev')}
            </button>
            <span className="tabular-nums text-slate-500">
              {page}/{pages}
            </span>
            <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded px-2 py-1 ring-1 ring-slate-200 disabled:opacity-40">
              {t('common.next')} →
            </button>
          </div>
        )}
      </Section>
    </div>
  )
}

const TABS = ['tradelab', ...MANUAL_MARKETS] as const
type Tab = (typeof TABS)[number]

/** Tab thị trường: TradeLab (ví ảo, mặc định) + các sổ giao dịch thật ghi tay — ?tab=vn|us|crypto|other */
function JournalShell() {
  const { t } = useT()
  const router = useRouter()
  const params = useSearchParams()
  const tab: Tab = TABS.find((x) => x === params.get('tab')) ?? 'tradelab'
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('journal.title')}</h1>
        <p className="text-sm text-slate-500">{t('journal.subtitle')}</p>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 border-b border-slate-200" role="tablist">
          {TABS.map((x) => (
            <button
              key={x}
              role="tab"
              aria-selected={x === tab}
              onClick={() => router.replace(x === 'tradelab' ? '/journal' : `/journal?tab=${x}`, { scroll: false })}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold ${x === tab ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              {t(`journalTabs.${x}`)}
            </button>
          ))}
        </div>
      </div>
      {tab === 'tradelab' ? <JournalView /> : <ManualJournal key={tab} market={tab} />}
    </div>
  )
}

export default function JournalPage() {
  return (
    <Suspense fallback={null}>
      <JournalShell />
    </Suspense>
  )
}
