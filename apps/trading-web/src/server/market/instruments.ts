import { and, asc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { instruments } from '../db/schema'
import type { Market } from './types'

export interface InstrumentDto {
  market: Market
  symbol: string
  base: string
  quote: string
  name: string
}

export async function listActiveInstruments(market: Market): Promise<InstrumentDto[]> {
  const rows = await db
    .select()
    .from(instruments)
    .where(and(eq(instruments.market, market), eq(instruments.isActive, true)))
    .orderBy(asc(instruments.sortOrder), asc(instruments.symbol))
  return rows.map((r) => ({ market, symbol: r.symbol, base: r.base, quote: r.quote, name: r.name }))
}
