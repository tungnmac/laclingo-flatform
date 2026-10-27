'use client'

import { filterGrid, FilterSelect } from '@/components/FilterSelect'
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className={`${filterGrid(2)} sm:min-w-0 sm:flex-1 lg:max-w-xl`}>
        <FilterSelect label={t('journal.account')} value={value.account} onChange={(v) => onChange({ account: v })}>
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
        </FilterSelect>
        <FilterSelect label={t('journal.symbol')} value={value.symbol} onChange={(v) => onChange({ symbol: v })}>
          <option value="">{t('journal.allSymbols')}</option>
          {symbols.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </FilterSelect>
      </div>
      <div className="flex gap-1 self-start rounded-lg bg-slate-100 p-1 sm:self-auto">
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
