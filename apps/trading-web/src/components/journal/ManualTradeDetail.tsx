'use client'

import type { ReactNode } from 'react'
import { pnlColor } from '@/components/trading/labels'
import { useT } from '@/i18n/I18nProvider'
import type { moneyFormat } from '@/lib/money-format'
import { isExecuted } from '@/server/journal/manual-markets'
import type { ManualTradeDto } from '@/server/journal/manual-service'

type Money = ReturnType<typeof moneyFormat>

function Item({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase text-slate-400" title={hint}>
        {label}
        {hint && <span className="ml-1 cursor-help normal-case">ⓘ</span>}
      </dt>
      <dd className="mt-0.5 tabular-nums text-slate-800">{children}</dd>
    </div>
  )
}

/** Thông tin chi tiết 1 lệnh — dùng cho dòng mở rộng trong lịch sử và trang chi tiết */
export function ManualTradeDetail({ trade: tr, money, actions }: { trade: ManualTradeDto; money: Money; actions?: ReactNode }) {
  const { t, locale } = useT()
  const fmtTime = (iso: string) => new Date(iso).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })
  const executed = isExecuted(tr.status)
  const executedValue = Number(tr.executed_qty) * Number(tr.price)
  const fees = Number(tr.fee) + Number(tr.tax)
  const closed = Number(tr.closed_qty) > 0
  const signed = (q: string | null) => {
    if (q === null) return '—'
    const n = Number(q)
    return n === 0 ? '0' : `${money.plain(Math.abs(n))} ${n > 0 ? t('manual.long') : t('manual.short')}`
  }
  const note = tr.note

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
        <Item label={t('manual.orderValue')}>{money.amount(Number(tr.qty) * Number(tr.price))}</Item>
        {tr.status === 'partial' && <Item label={t('manual.executedValue')}>{money.amount(executedValue)}</Item>}
        <Item label={t('manual.feesTotal')}>
          {money.amount(fees)}
          <span className="block text-xs text-slate-400">
            {t('manual.fee')} {money.amount(tr.fee)} · {t('manual.tax')} {money.amount(tr.tax)}
          </span>
        </Item>
        {executed && (
          <Item label={tr.side === 'buy' ? t('manual.totalCost') : t('manual.netProceeds')}>
            {money.amount(tr.side === 'buy' ? executedValue + fees : executedValue - fees)}
          </Item>
        )}
        {executed && (
          <Item label={t('manual.position')}>
            {signed(tr.position_before)} → <b>{signed(tr.position_after)}</b>
          </Item>
        )}
        {executed && tr.avg_price_after !== null && Number(tr.position_after) !== 0 && (
          <Item label={t('manual.avgAfter')}>{money.plain(tr.avg_price_after)}</Item>
        )}
        {closed && (
          <>
            <Item label={t('manual.realizedGross')}>
              <span className={pnlColor(tr.realized_pnl)}>{money.pnl(tr.realized_pnl)}</span>
            </Item>
            <Item label={t('manual.realizedNet')} hint={t('manual.realizedNetHint')}>
              <span className={pnlColor(String(Number(tr.realized_pnl) - fees))}>{money.pnl(Number(tr.realized_pnl) - fees)}</span>
            </Item>
          </>
        )}
      </dl>
      {!executed && <p className="text-xs text-slate-500">{t('manual.notCounted')}</p>}

      <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
        {note ? (
          <div className="space-y-1.5">
            {note.reason && (
              <p>
                <span className="font-semibold text-slate-600">{t('manual.reason')}:</span> {note.reason}
              </p>
            )}
            {note.lesson && (
              <p>
                <span className="font-semibold text-slate-600">{t('manual.lesson')}:</span> {note.lesson}
              </p>
            )}
            <p className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              {note.emotion && <span>{t(`journal.emotions.${note.emotion}`)}</span>}
              {note.rating && <span aria-label={`${note.rating}/5`}>{'★'.repeat(note.rating)}{'☆'.repeat(5 - note.rating)}</span>}
              {note.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white px-2 py-0.5 ring-1 ring-slate-200">
                  #{tag}
                </span>
              ))}
            </p>
          </div>
        ) : (
          <p className="text-slate-400">{t('manual.noNote')}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>
          {t('manual.recordedAt', { time: fmtTime(tr.created_at) })}
          {tr.amended_at && ` · ${t('manual.amendedAt', { time: fmtTime(tr.amended_at) })}`}
        </span>
        {actions}
      </div>
    </div>
  )
}
