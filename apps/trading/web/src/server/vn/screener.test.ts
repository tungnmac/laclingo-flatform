import { describe, expect, it } from 'vitest'
import { nz, revenueOf, screen, toCsv, type ScreenRow } from './screener'

const row = (symbol: string, o: Partial<ScreenRow> = {}): ScreenRow => ({
  symbol,
  name: symbol,
  exchange: 'HOSE',
  sector: 'Ngân hàng',
  sector_key: 'Ngân hàng',
  in_vn30: true,
  period: 'Q2026-2',
  market_cap: 100e12,
  pe: 10,
  pb: 2,
  roe: 0.2,
  net_margin: 0.15,
  de: 1,
  ...o,
})

describe('vn screener', () => {
  const rows = [
    row('AAA', { pe: 8, roe: 0.25, market_cap: 50e12 }),
    row('BBB', { pe: -5, roe: 0.3 }), // lỗ: P/E âm
    row('CCC', { pe: null, roe: null, exchange: 'HNX', in_vn30: false }),
    row('DDD', { pe: 15, roe: 0.12, sector: 'Technology', sector_key: 'Công nghệ', market_cap: 5e12, pb: 0.8, net_margin: 0.05, de: 0 }),
  ]
  it('filters by thresholds and drops missing values', () => {
    expect(screen(rows, { pe_max: 12, sort: 'symbol', dir: 'asc' }).map((r) => r.symbol)).toEqual(['AAA'])
    expect(screen(rows, { roe_min: 20, sort: 'roe', dir: 'desc' }).map((r) => r.symbol)).toEqual(['BBB', 'AAA'])
    expect(screen(rows, { exchange: 'HNX', sort: 'symbol', dir: 'asc' }).map((r) => r.symbol)).toEqual(['CCC'])
    expect(screen(rows, { vn30: true, sector: 'Công nghệ', mcap_min: 1000, sort: 'symbol', dir: 'asc' }).map((r) => r.symbol)).toEqual(['DDD'])
    expect(screen(rows, { mcap_min: 10_000, sort: 'symbol', dir: 'asc' }).map((r) => r.symbol)).toEqual(['AAA', 'BBB', 'CCC'])
    expect(screen(rows, { pb_max: 1, sort: 'symbol', dir: 'asc' }).map((r) => r.symbol)).toEqual(['DDD'])
    expect(screen(rows, { net_margin_min: 10, sort: 'symbol', dir: 'asc' }).map((r) => r.symbol)).toEqual(['AAA', 'BBB', 'CCC'])
    expect(screen(rows, { de_max: 0.5, sort: 'symbol', dir: 'asc' }).map((r) => r.symbol)).toEqual(['DDD']) // D/E = 0 (không nợ) vẫn qua
  })
  it('sorts with missing values last in both directions', () => {
    // P/E âm (đang lỗ) xếp cuối như thiếu dữ liệu, ở cả hai chiều
    expect(screen(rows, { sort: 'pe', dir: 'asc' }).map((r) => r.symbol)).toEqual(['AAA', 'DDD', 'BBB', 'CCC'])
    expect(screen(rows, { sort: 'pe', dir: 'desc' }).map((r) => r.symbol)).toEqual(['DDD', 'AAA', 'BBB', 'CCC'])
  })
  it('treats zero as missing and picks the revenue line by business type', () => {
    expect(nz(0)).toBeNull()
    expect(nz(1.5)).toBe(1.5)
    expect(revenueOf({ isa3: 0, isb38: 72_455, isa20: 35_198 })).toBe(72_455)
    expect(revenueOf({ isa3: 70_113 })).toBe(70_113)
    expect(revenueOf({})).toBeNull()
  })
  it('writes Excel-safe CSV', () => {
    expect(toCsv([['\tcmd', '-2', '@x']])).toBe("\uFEFF'\tcmd,'-2,'@x\r\n") // chuỗi bắt đầu bằng ký tự công thức luôn bị chặn
    expect(toCsv([['Mã', 'Tên'], ['FPT', 'CTCP "FPT", HN'], ['X', '=1+1'], ['N', 12.5], ['Z', null]])).toBe(
      '﻿Mã,Tên\r\nFPT,"CTCP ""FPT"", HN"\r\nX,\'=1+1\r\nN,12.5\r\nZ,\r\n',
    )
  })
})
