'use client'

import { useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { ProgressDto, PublicQuestion } from '@/server/learn/dto'
import type { QuizSubmitDto } from '@/server/learn/learn-service'

const PASS = 70

export function Quiz({
  slug,
  questions,
  onGraded,
}: {
  slug: string
  questions: PublicQuestion[]
  onGraded: (progress: ProgressDto) => void
}) {
  const { t } = useT()
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  const [result, setResult] = useState<QuizSubmitDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await api<QuizSubmitDto>(`/api/learn/lessons/${slug}/quiz`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      })
      setResult(res)
      onGraded(res.progress)
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  const retry = () => {
    setAnswers(questions.map(() => null))
    setResult(null)
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={submitting || result !== null}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {t('learn.markDone')}
        </button>
        {result && <span className="text-sm text-emerald-700">{t('learn.passed')}</span>}
        {error !== null && <span className="text-sm text-rose-600">{errorMessage(error, t)}</span>}
      </div>
    )
  }

  const unanswered = answers.filter((a) => a === null).length

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-lg font-bold">{t('learn.quizTitle')}</h2>
      {result && (
        <div className={`mt-3 rounded-lg px-3 py-2 text-sm ring-1 ${result.passed ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-amber-50 text-amber-800 ring-amber-200'}`}>
          <p className="font-semibold">{t('learn.result', { correct: result.correct, total: result.total, score: result.score })}</p>
          <p>{result.passed ? t('learn.passed') : t('learn.failed', { pass: PASS })}</p>
        </div>
      )}
      <ol className="mt-4 space-y-5">
        {questions.map((q, qi) => {
          const r = result?.results[qi]
          return (
            <li key={q.id}>
              <p className="font-medium text-slate-800">
                {qi + 1}. {q.prompt}
              </p>
              <div className="mt-2 grid gap-2">
                {q.options.map((opt, oi) => {
                  const chosen = answers[qi] === oi
                  let cls = chosen ? 'bg-emerald-50 ring-emerald-500' : 'bg-white ring-slate-200 hover:bg-slate-50'
                  if (r) {
                    if (oi === r.correct_index) cls = 'bg-emerald-50 ring-emerald-500 text-emerald-800'
                    else if (chosen) cls = 'bg-rose-50 ring-rose-400 text-rose-800'
                    else cls = 'bg-white ring-slate-200 opacity-70'
                  }
                  return (
                    <button
                      key={oi}
                      type="button"
                      role="radio"
                      aria-checked={chosen}
                      disabled={!!result}
                      onClick={() => setAnswers(answers.map((a, i) => (i === qi ? oi : a)))}
                      className={`rounded-lg px-3 py-2 text-left text-sm ring-1 ring-inset ${cls}`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
              {r?.explanation && <p className="mt-2 text-sm text-slate-600">💡 {r.explanation}</p>}
            </li>
          )
        })}
      </ol>
      {error !== null && <p className="mt-3 text-sm text-rose-600">{errorMessage(error, t)}</p>}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {result ? (
          <button onClick={retry} className="rounded-lg px-4 py-2 font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            {t('learn.retry')}
          </button>
        ) : (
          <>
            <button
              onClick={submit}
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {submitting ? t('learn.submitting') : t('learn.submit')}
            </button>
            {unanswered > 0 && <span className="text-sm text-slate-500">{t('learn.answerAll', { count: unanswered })}</span>}
          </>
        )}
      </div>
    </section>
  )
}
