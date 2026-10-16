'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, type FormEvent } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { formatMoney } from '@/lib/company-format'
import { errorMessage } from '@/lib/error-message'
import {
  allocationTotal,
  ASSET_CLASSES,
  profileFromAnswers,
  project,
  RISK_PROFILES,
  RISK_QUESTION_COUNT,
  SUGGESTED_ALLOCATION,
  suggestedReturnPct,
  type Allocation,
  type RiskProfile,
} from '@/lib/plan-projection'
import type { PlanDto } from '@/server/plans/plan-service'
import { CURRENCIES } from '@/server/plans/validation'
import { ProjectionChart } from './ProjectionChart'

interface Form {
  name: string
  currency: (typeof CURRENCIES)[number]
  risk_profile: RiskProfile
  allocation: Allocation
  initial_amount: string
  monthly_contribution: string
  years: string
  expected_return_pct: string
  goal_amount: string
  notes: string
}

const DEFAULT_FORM: Form = {
  name: '',
  currency: 'VND',
  risk_profile: 'balanced',
  allocation: SUGGESTED_ALLOCATION.balanced,
  initial_amount: '50000000',
  monthly_contribution: '5000000',
  years: '10',
  expected_return_pct: String(suggestedReturnPct(SUGGESTED_ALLOCATION.balanced)),
  goal_amount: '',
  notes: '',
}

const toForm = (p: PlanDto): Form => ({
  name: p.name,
  currency: p.currency as Form['currency'],
  risk_profile: p.risk_profile,
  allocation: p.allocation,
  initial_amount: String(p.initial_amount),
  monthly_contribution: String(p.monthly_contribution),
  years: String(p.years),
  expected_return_pct: String(p.expected_return_pct),
  goal_amount: p.goal_amount === null ? '' : String(p.goal_amount),
  notes: p.notes,
})

const num = (s: string) => (s.trim() === '' ? NaN : Number(s))
const inputClass = 'mt-1 block w-full rounded-lg border-0 px-3 py-2 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-emerald-600'

/** Tạo (plan = null) hoặc sửa kế hoạch. Dự phóng tính ngay ở client bằng cùng hàm với server. */
export function PlanEditor({ plan }: { plan: PlanDto | null }) {
  const { t, locale } = useT()
  const router = useRouter()
  const [form, setForm] = useState<Form>(plan ? toForm(plan) : DEFAULT_FORM)
  const [quiz, setQuiz] = useState(!plan)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(RISK_QUESTION_COUNT).fill(null))
  const [quizError, setQuizError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const set = (patch: Partial<Form>) => {
    setForm((f) => ({ ...f, ...patch }))
    setSaved(false)
  }

  const total = allocationTotal(form.allocation)
  const suggested = suggestedReturnPct(form.allocation)
  const values = {
    initial: num(form.initial_amount),
    monthly: num(form.monthly_contribution),
    years: num(form.years),
    rate: num(form.expected_return_pct),
    goal: form.goal_amount.trim() === '' ? null : num(form.goal_amount),
  }
  const valid =
    form.name.trim() !== '' &&
    total === 100 &&
    values.initial >= 0 &&
    values.monthly >= 0 &&
    Number.isInteger(values.years) &&
    values.years >= 1 &&
    values.years <= 50 &&
    values.rate >= -20 &&
    values.rate <= 40 &&
    (values.goal === null || values.goal > 0)
  const projection = useMemo(
    () =>
      Number.isFinite(values.initial) && Number.isFinite(values.monthly) && Number.isInteger(values.years) && values.years >= 1 && values.years <= 50 && Number.isFinite(values.rate)
        ? project({ initial: values.initial, monthly: values.monthly, years: values.years, annualReturnPct: values.rate, goal: values.goal && values.goal > 0 ? values.goal : null })
        : null,
    [values.initial, values.monthly, values.years, values.rate, values.goal],
  )
  const money = (n: number) => formatMoney(n, form.currency, locale)

  const applyQuiz = () => {
    if (answers.some((a) => a === null)) return setQuizError(true)
    const profile = profileFromAnswers(answers as number[])
    const allocation = SUGGESTED_ALLOCATION[profile]
    set({ risk_profile: profile, allocation, expected_return_pct: String(suggestedReturnPct(allocation)) })
    setQuiz(false)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setSaving(true)
    setError(null)
    const body = {
      name: form.name,
      currency: form.currency,
      risk_profile: form.risk_profile,
      allocation: form.allocation,
      initial_amount: values.initial,
      monthly_contribution: values.monthly,
      years: values.years,
      expected_return_pct: values.rate,
      goal_amount: values.goal,
      notes: form.notes,
    }
    try {
      const res = plan
        ? await api<PlanDto>(`/api/plans/${plan.id}`, { method: 'PUT', body: JSON.stringify(body) })
        : await api<PlanDto>('/api/plans', { method: 'POST', body: JSON.stringify(body) })
      setSaved(true)
      if (!plan) return router.replace(`/learn/plans/${res.id}`) // giữ saving=true tới khi rời trang: bấm Lưu lần 2 không tạo trùng
      setSaving(false)
    } catch (err) {
      setError(err)
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!plan || !window.confirm(t('plans.deleteConfirm', { name: plan.name }))) return
    try {
      await api(`/api/plans/${plan.id}`, { method: 'DELETE' })
      router.replace('/learn/plans')
    } catch (err) {
      setError(err)
    }
  }

  return (
    <div className="space-y-5">
      <Link href="/learn/plans" className="text-sm font-semibold text-emerald-700 hover:underline">
        {t('plans.back')}
      </Link>

      {quiz && (
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-bold">{t('plans.quizTitle')}</h2>
          {Array.from({ length: RISK_QUESTION_COUNT }, (_, qi) => (
            <fieldset key={qi}>
              <legend className="text-sm font-semibold text-slate-800">
                {qi + 1}. {t(`plans.q${qi + 1}`)}
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {[1, 2, 3, 4].map((score) => (
                  <label key={score} className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm ring-1 ${answers[qi] === score ? 'bg-emerald-50 ring-emerald-400' : 'ring-slate-200 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name={`q${qi}`}
                      checked={answers[qi] === score}
                      onChange={() => {
                        setAnswers((a) => a.map((v, i) => (i === qi ? score : v)))
                        setQuizError(false)
                      }}
                      className="text-emerald-600"
                    />
                    {t(`plans.q${qi + 1}a${score}`)}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          {quizError && <p className="text-sm text-rose-600">{t('plans.quizAnswerAll')}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={applyQuiz} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
              {t('plans.quizApply')}
            </button>
            <button type="button" onClick={() => setQuiz(false)} className="text-sm font-semibold text-slate-600 hover:underline">
              {t('plans.quizSkip')}
            </button>
          </div>
        </section>
      )}

      {!quiz && (
        <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">{t('plans.formTitle')}</h2>
              {!plan && (
                <button type="button" onClick={() => setQuiz(true)} className="text-xs font-semibold text-emerald-700 hover:underline">
                  {t('plans.quizTitle')}
                </button>
              )}
            </div>
            <label className="block text-xs font-medium text-slate-600">
              {t('plans.name')}
              <input value={form.name} maxLength={100} placeholder={t('plans.namePlaceholder')} onChange={(e) => set({ name: e.target.value })} className={inputClass} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-slate-600">
                {t('plans.currency')}
                <select value={form.currency} onChange={(e) => set({ currency: e.target.value as Form['currency'] })} className={inputClass}>
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-600">
                {t('plans.riskProfile')}
                <select value={form.risk_profile} onChange={(e) => set({ risk_profile: e.target.value as RiskProfile })} className={inputClass}>
                  {RISK_PROFILES.map((p) => (
                    <option key={p} value={p}>
                      {t(`plans.profile_${p}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <fieldset>
              <legend className="flex w-full items-center justify-between text-xs font-medium text-slate-600">
                {t('plans.allocation')}
                <button type="button" onClick={() => set({ allocation: SUGGESTED_ALLOCATION[form.risk_profile] })} className="font-semibold text-emerald-700 hover:underline">
                  {t('plans.resetAllocation')}
                </button>
              </legend>
              {ASSET_CLASSES.map((k) => (
                <div key={k} className="mt-2 flex items-center gap-3">
                  <span className="w-20 shrink-0 text-sm text-slate-700">{t(`plans.asset_${k}`)}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={form.allocation[k]}
                    onChange={(e) => set({ allocation: { ...form.allocation, [k]: Number(e.target.value) } })}
                    className="min-w-0 flex-1 accent-emerald-600"
                    aria-label={t(`plans.asset_${k}`)}
                  />
                  <span className="w-10 text-right text-sm tabular-nums">{form.allocation[k]}%</span>
                </div>
              ))}
              <p className={`mt-2 text-xs font-semibold ${total === 100 ? 'text-slate-500' : 'text-rose-600'}`}>
                {t('plans.total', { total })}
                {total !== 100 && ` — ${t('plans.totalMustBe100')}`}
              </p>
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ['initial_amount', 'plans.initial'],
                  ['monthly_contribution', 'plans.monthly'],
                  ['years', 'plans.years'],
                  ['expected_return_pct', 'plans.expectedReturn'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-xs font-medium text-slate-600">
                  {t(label)}
                  <input type="number" inputMode="decimal" step="any" value={form[key]} onChange={(e) => set({ [key]: e.target.value })} className={inputClass} />
                </label>
              ))}
            </div>
            {String(suggested) !== form.expected_return_pct && (
              <button type="button" onClick={() => set({ expected_return_pct: String(suggested) })} className="text-xs font-semibold text-emerald-700 hover:underline">
                {t('plans.useSuggested', { pct: suggested })}
              </button>
            )}
            <label className="block text-xs font-medium text-slate-600">
              {t('plans.goal')}
              <input type="number" inputMode="decimal" step="any" value={form.goal_amount} onChange={(e) => set({ goal_amount: e.target.value })} className={inputClass} />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              {t('plans.notes')}
              <textarea rows={3} maxLength={2000} value={form.notes} onChange={(e) => set({ notes: e.target.value })} className={inputClass} />
            </label>
            <p className="text-xs text-slate-400">{t('plans.assumptions')}</p>
            {error !== null && <p className="text-sm text-rose-600">{errorMessage(error, t)}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={!valid || saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
                {t('plans.save')}
              </button>
              {saved && <span className="text-sm text-emerald-700">{t('plans.saved')}</span>}
              {plan && (
                <button type="button" onClick={remove} className="ml-auto text-sm font-semibold text-rose-600 hover:underline">
                  {t('plans.delete')}
                </button>
              )}
            </div>
          </section>

          <section className="min-w-0 space-y-4">
            <h2 className="text-lg font-bold">{t('plans.projection')}</h2>
            {projection && (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    [t('plans.finalValue', { years: values.years }), money(projection.final.value)],
                    [t('plans.contributed'), money(projection.final.contributed)],
                    [t('plans.gain'), money(projection.final.value - projection.final.contributed)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                      <p className="text-xs font-medium text-slate-500">{label}</p>
                      <p className="mt-1 break-words text-lg font-semibold tabular-nums">{value}</p>
                    </div>
                  ))}
                </div>
                {projection.goal && (
                  <p className={`rounded-lg px-3 py-2 text-sm ring-1 ${projection.goal.year_reached ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-amber-50 text-amber-800 ring-amber-200'}`}>
                    {projection.goal.year_reached
                      ? t('plans.goalReached', { year: projection.goal.year_reached })
                      : t('plans.goalMissed', { years: values.years, amount: money(projection.goal.monthly_needed ?? 0) })}
                  </p>
                )}
                <ProjectionChart rows={projection.rows} initial={values.initial} currency={form.currency} />
                <div className="max-h-80 overflow-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2 text-left">{t('plans.year')}</th>
                        <th className="px-3 py-2 text-right">{t('plans.contributed')}</th>
                        <th className="px-3 py-2 text-right">{t('plans.scenario_pessimistic')}</th>
                        <th className="px-3 py-2 text-right">{t('plans.scenario_expected')}</th>
                        <th className="px-3 py-2 text-right">{t('plans.scenario_optimistic')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projection.rows.map((r) => (
                        <tr key={r.year}>
                          <td className="px-3 py-1.5">{r.year}</td>
                          <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums text-slate-500">{money(r.contributed)}</td>
                          <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums">{money(r.pessimistic)}</td>
                          <td className="whitespace-nowrap px-3 py-1.5 text-right font-semibold tabular-nums">{money(r.value)}</td>
                          <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums">{money(r.optimistic)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200">{t('plans.disclaimer')}</p>
          </section>
        </form>
      )}
    </div>
  )
}
