import type { Locale } from '@/i18n/locales'
import type { TranslateParams } from '@/i18n/translate'
import type { NotificationData } from '@/server/notifications/notification-service'
import { formatPnl, formatQty } from './trading-format'

type T = (key: string, params?: TranslateParams) => string

const ORDER_TYPE_KEY: Record<string, string> = {
  limit: 'trading.limit',
  market: 'trading.market',
  stop_loss: 'trading.stopLoss',
  take_profit: 'trading.takeProfit',
}

const baseOf = (symbol: string) => symbol.replace(/USDT$/, '')

/** Nội dung + đường dẫn của 1 thông báo theo ngôn ngữ đang chọn */
export function notificationText(d: NotificationData, t: T, locale: Locale): { text: string; href: string } {
  if (d.kind === 'order_filled') {
    const text = t('notifications.orderFilled', {
      type: t(ORDER_TYPE_KEY[d.type] ?? 'trading.limit'),
      side: t(d.side === 'buy' ? 'trading.buy' : 'trading.sell'),
      qty: formatQty(d.qty),
      base: baseOf(d.symbol),
      price: formatQty(d.price),
    })
    // lệnh mở vị thế không có lãi/lỗ → chỉ hiện khi lệnh đóng (một phần) vị thế
    const pnl = Number(d.realized_pnl) === 0 ? '' : t('notifications.pnl', { pnl: formatPnl(d.realized_pnl) })
    return { text: text + pnl, href: '/portfolio' }
  }
  if (d.kind === 'liquidation') {
    return {
      text: t('notifications.liquidation', { qty: formatQty(d.qty), base: baseOf(d.symbol), price: formatQty(d.price) }) + t('notifications.pnl', { pnl: formatPnl(d.realized_pnl) }),
      href: '/portfolio',
    }
  }
  const title = (locale === 'vi' ? d.title_vi : d.title_en) || d.title_vi
  return {
    text: d.rank === null ? t('notifications.contestUnranked', { title }) : t('notifications.contestRanked', { title, rank: d.rank, total: d.total }),
    href: `/contests/${d.slug}`,
  }
}
