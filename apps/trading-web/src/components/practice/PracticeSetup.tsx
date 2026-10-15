'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { InstrumentDto } from '@/server/market/instruments'
import type { SessionDto } from '@/server/practice/dto'
import { PRACTICE_INTERVALS, PRACTICE_LENGTHS, type PracticeInterval } from '@/server/practice/time'

const chip = (active: boolean) =>
  `rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ${active ? 'bg-emerald-600 text-white ring-emerald-600' : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50'}`

export function PracticeSetup({ onStarted }: { onStarted: (s: SessionDto) => void }) {
  const { t } = useT()
  const [instruments, setInstruments] = useState<InstrumentDto[]>([])
  const [symbol, setSymbol] = useState('RANDOM')
  const [interval, setInterval] = useState<PracticeInterval>('1h')
  const [length, setLength] = useState<number>(100)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    api<InstrumentDto[]>('/api/market/instruments?market=crypto').then(setInstruments, () => {})
  }, [])

  const start = async () => {
    setStarting(true)
    setError(null)
    try {
      onStarted(await api<SessionDto>('/api/practice/sessions', { method: 'POST', body: JSON.stringify({ symbol, interval, length }) }))
    } catch (err) {
      setError(err)
    } finally {
      setStarting(false)
    }
  }

  return (
    <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-xs font-medium text-slate-600">
          {t('practice.symbol')}
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="mt-1 block w-full rounded-lg border-0 py-2 pl-3 pr-8 text-sm ring-1 ring-inset ring-slate-300"
          >
            <option value="RANDOM">{t('practice.random')}</option>
            {instruments.map((i) => (
              <option key={i.symbol} value={i.symbol}>
                {i.symbol}
              </option>
            ))}
          </select>
        </label>
        <div>
          <p className="text-xs font-medium text-slate-600">{t('practice.interval')}</p>
          <div className="mt-1 flex gap-1.5">
            {PRACTICE_INTERVALS.map((iv) => (
              <button key={iv} type="button" aria-pressed={interval === iv} onClick={() => setInterval(iv)} className={chip(interval === iv)}>
                {iv}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-600">{t('practice.length')}</p>
          <div className="mt-1 flex gap-1.5">
            {PRACTICE_LENGTHS.map((n) => (
              <button key={n} type="button" aria-pressed={length === n} onClick={() => setLength(n)} className={chip(length === n)}>
                {t('practice.lengthOption', { n })}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm text-slate-500">{t('practice.hint')}</p>
      {error !== null && <p className="text-sm text-rose-600">{errorMessage(error, t)}</p>}
      <button onClick={start} disabled={starting} className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
        {starting ? t('practice.starting') : t('practice.start')}
      </button>
    </section>
  )
}
