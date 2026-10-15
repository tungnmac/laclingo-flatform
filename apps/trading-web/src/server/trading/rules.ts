import { HttpError } from '../http'
import { D, Decimal } from './decimal'
import type { Pos } from './engine'

// Quy tắc giao dịch dùng chung — paper trading (phần 3) và phiên thực hành replay (phần 6).

export const MIN_NOTIONAL = D(1)
export const usd = (d: Decimal) => d.toFixed(2)

export function validateProtection(pos: Pos, mark: Decimal, stopLoss: Decimal | null, takeProfit: Decimal | null) {
  const isLong = pos.qty.gt(0)
  const price = usd(mark)
  if (stopLoss && (isLong ? stopLoss.gte(mark) : stopLoss.lte(mark))) throw new HttpError(400, 'SL_WRONG_SIDE', { price })
  if (takeProfit && (isLong ? takeProfit.lte(mark) : takeProfit.gte(mark))) throw new HttpError(400, 'TP_WRONG_SIDE', { price })
}
