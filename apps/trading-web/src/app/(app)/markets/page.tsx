import { MARKET_TABS, type MarketTab } from '@/components/markets/market-tabs'
import { MarketsTabs } from '@/components/markets/MarketsTabs'

/** Tab đọc ở server (render sẵn khung trang ngay lần tải đầu); phần còn lại ở client */
export default async function MarketsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = (await searchParams).tab
  const tab: MarketTab = MARKET_TABS.find((x) => x === raw) ?? 'crypto'
  return <MarketsTabs tab={tab} />
}
