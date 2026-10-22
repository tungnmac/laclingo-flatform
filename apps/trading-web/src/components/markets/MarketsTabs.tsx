'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { CryptoMarket } from '@/components/markets/CryptoMarket'
import { VnIndexStrip } from '@/components/vn/VnIndexStrip'
import { VnStockList } from '@/components/vn/VnStockList'
import { useT } from '@/i18n/I18nProvider'
import { MARKET_TABS, type MarketTab } from './market-tabs'


/** Tab thị trường giống Nhật ký: Crypto (mặc định) · CK Việt Nam · CK Mỹ · Forex/Khác — ?tab=vn|us|other */
export function MarketsTabs({ tab }: { tab: MarketTab }) {
  const { t } = useT()
  const router = useRouter()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('markets.title')}</h1>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 border-b border-slate-200" role="tablist">
          {MARKET_TABS.map((x) => (
            <button
              key={x}
              role="tab"
              aria-selected={x === tab}
              // bấm lại tab đang mở: giữ nguyên bộ lọc
              onClick={() => x !== tab && router.replace(x === 'crypto' ? '/markets' : `/markets?tab=${x}`, { scroll: false })}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold ${x === tab ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              {t(`marketTabs.${x}`)}
            </button>
          ))}
        </div>
      </div>
      {tab === 'crypto' && <CryptoMarket />}
      {tab === 'vn' && (
        // VnStockList đọc useSearchParams → cần Suspense
        <>
          <VnIndexStrip />
          <Suspense fallback={<p className="py-10 text-center text-slate-400">{t('common.loading')}</p>}>
            <VnStockList />
          </Suspense>
        </>
      )}
      {(tab === 'us' || tab === 'other') && (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
          <p className="font-semibold text-slate-700">{t('markets.comingSoon')}</p>
          <p className="mt-1 text-sm text-slate-500">{t(tab === 'us' ? 'markets.comingSoonUs' : 'markets.comingSoonOther')}</p>
          {tab === 'us' && (
            <Link href="/companies?market=us" className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline">
              {t('markets.usCompaniesLink')}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
