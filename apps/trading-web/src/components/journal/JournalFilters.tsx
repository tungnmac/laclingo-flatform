'use client'

import { useT } from '@/i18n/I18nProvider'
import type { AccountSummaryDto } from '@/server/journal/journal-service'

export interface Filters {
  account: string
  symbol: string
  range: '7d' | '30d' | '90d' | 'all'
}

const RANGES: { value: Filters['range']; key: string }[] = [
  { value: '7d', key: 'journal.range7d' },
  { value: '30d', key: 'journal.range30d' },
  { value: '90d', key: 'journal.range90d' },
  { value: 'all', key: 'journal.rangeAll' },
]
const selectClass = 'rounded-lg border-0 py-1.5 pl-3 pr-8 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-emerald-600'

export function JournalFilters({
  value,
  onChange,
  accounts,
  symbols,
}: {
  value: Filters
  onChange: (next: Partial<Filters>) => void
  accounts: AccountSummaryDto[]
  symbols: string[]
}) {
  const { t, locale } = useT()
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'short' })
  const oldWallets = accounts.filter((a) => !a.is_active)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-slate-600">
        {t('journal.account')}
        <select value={value.account} onChange={(e) => onChange({ account: e.target.value })} className={selectClass}>
          <option value="current">{t('journal.currentWallet')}</option>
          <option value="all">{t('journal.allWallets')}</option>
          {oldWallets.map((a) => (
            <option key={a.id} value={a.id}>
              {t('journal.oldWallet', {
                from: date.format(new Date(a.created_at)),
                to: a.closed_at ? date.format(new Date(a.closed_at)) : '…',
              })}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        {t('journal.symbol')}
        <select value={value.symbol} onChange={(e) => onChange({ symbol: e.target.value })} className={selectClass}>
          <option value="">{t('journal.allSymbols')}</option>
          {symbols.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {RANGES.map((r) => (
          <button
            key={r.value}
            type="button"
            aria-pressed={value.range === r.value}
            onClick={() => onChange({ range: r.value })}
            className={`rounded-md px-3 py-1 text-sm font-semibold ${value.range === r.value ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {t(r.key)}
          </button>
        ))}
      </div>
    </div>
  )
}
