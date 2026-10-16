'use client'

import { useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { formatMoney } from '@/lib/company-format'
import type { FinancialYear } from '@/server/companies/types'

type Line = keyof Omit<FinancialYear, 'year' | 'date'>

const TABS: { key: string; label: string; lines: [Line, string][] }[] = [
  {
    key: 'income',
    label: 'companies.tabIncome',
    lines: [
      ['revenue', 'companies.revenue'],
      ['gross_profit', 'companies.grossProfit'],
      ['operating_income', 'companies.operatingIncome'],
      ['net_income', 'companies.netIncome'],
    ],
  },
  {
    key: 'balance',
    label: 'companies.tabBalance',
    lines: [
      ['total_assets', 'companies.totalAssets'],
      ['current_assets', 'companies.currentAssets'],
      ['cash', 'companies.cash'],
      ['total_liabilities', 'companies.totalLiabilities'],
      ['current_liabilities', 'companies.currentLiabilities'],
      ['total_debt', 'companies.totalDebt'],
      ['equity', 'companies.equity'],
    ],
  },
  {
    key: 'cash',
    label: 'companies.tabCash',
    lines: [
      ['cfo', 'companies.cfo'],
      ['capex', 'companies.capex'],
      ['fcf', 'companies.fcf'],
      ['dividends_paid', 'companies.dividendsPaid'],
    ],
  },
]

/** BCTC 5 năm: 3 tab, năm theo cột (cũ → mới, đọc trái sang phải như báo cáo) */
export function FinancialsTable({ years, currency }: { years: FinancialYear[]; currency: string | null }) {
  const { t, locale } = useT()
  const [tab, setTab] = useState(TABS[0].key)
  const active = TABS.find((x) => x.key === tab)!
  const cols = [...years].reverse()

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap gap-1 border-b border-slate-100 p-2" role="tablist">
        {TABS.map((x) => (
          <button
            key={x.key}
            role="tab"
            aria-selected={x.key === tab}
            onClick={() => setTab(x.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${x.key === tab ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {t(x.label)}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left">{t('companies.item')}</th>
              {cols.map((y) => (
                <th key={y.date} className="px-4 py-2 text-right" title={y.date}>
                  {y.year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {active.lines.map(([line, label]) => (
              <tr key={line}>
                <td className="whitespace-nowrap px-4 py-2 text-slate-700">{t(label)}</td>
                {cols.map((y) => (
                  <td key={y.date} className="whitespace-nowrap px-4 py-2 text-right tabular-nums">
                    {formatMoney(y[line], currency, locale)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {currency && <p className="px-4 py-2 text-xs text-slate-400">{t('companies.unit', { currency })}</p>}
    </div>
  )
}
