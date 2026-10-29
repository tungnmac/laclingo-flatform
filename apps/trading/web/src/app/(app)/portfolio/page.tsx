'use client'

import { useState } from 'react'
import { EquityCard } from '@/components/trading/EquityCard'
import { OpenOrdersTable } from '@/components/trading/OpenOrdersTable'
import { PositionsTable } from '@/components/trading/PositionsTable'
import { TradeHistory } from '@/components/trading/TradeHistory'
import { useAccount } from '@/hooks/useAccount'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'

export default function PortfolioPage() {
  const { t } = useT()
  const account = useAccount()
  const [actionError, setActionError] = useState<unknown>(null)
  const [historyKey, setHistoryKey] = useState(0)
  const refresh = () => {
    void account.reload()
    setHistoryKey((k) => k + 1)
  }

  const reset = async () => {
    if (!window.confirm(t('portfolio.resetConfirm'))) return
    setActionError(null)
    try {
      await api('/api/trading/account/reset', { method: 'POST' })
      refresh()
    } catch (err) {
      setActionError(err)
    }
  }

  const section = (title: string, body: React.ReactNode) => (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">{title}</h2>
      {body}
    </section>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('portfolio.title')}</h1>
          <p className="text-sm text-slate-500">{t('portfolio.subtitle')}</p>
        </div>
        <button onClick={reset} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
          {t('portfolio.reset')}
        </button>
      </div>

      {actionError !== null && <p className="text-sm text-rose-600">{errorMessage(actionError, t)}</p>}
      {account.error !== null && !account.data && (
        <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          <span>{errorMessage(account.error, t)}</span>
          <button onClick={() => void account.reload()} className="font-semibold underline">
            {t('common.retry')}
          </button>
        </div>
      )}
      {!account.data && account.error === null && <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>}

      {account.data && (
        <>
          {account.data.settlement_delayed && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">{t('portfolio.settlementDelayed')}</p>
          )}
          <EquityCard snapshot={account.data} />
          {section(t('portfolio.positions'), <PositionsTable positions={account.data.positions} onChanged={refresh} />)}
          {section(t('trading.openOrders'), <OpenOrdersTable orders={account.data.open_orders} onChanged={refresh} />)}
        </>
      )}
      {section(t('portfolio.history'), <TradeHistory refreshKey={historyKey} />)}
    </div>
  )
}
