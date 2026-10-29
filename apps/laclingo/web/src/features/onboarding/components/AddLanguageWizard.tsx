'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState, Spinner } from '@/components/ui/States'
import { courseService } from '@/features/course/course.service'
import { languageFlag } from '@/features/course/components/LanguageCard'
import { vocabularyService } from '@/features/vocabulary/vocabulary.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { CefrLevel, Language, TargetLanguage } from '@/types/api'
import { onboardingService } from '../onboarding.service'
import { LevelPicker } from './OnboardingWizard'

const STEPS = ['language', 'level', 'topics'] as const
type Step = (typeof STEPS)[number]

// Nguồn chủ đề đang chọn ('' = danh sách mặc định) + kết quả đồng bộ — giữ ở Wizard để quay lại bước chủ đề vẫn khớp
// với các chủ đề đang chọn
type TopicSource = { from: string; synced: { count: number; skipped: string[] } | null }
const DEFAULT_SOURCE: TopicSource = { from: '', synced: null }

/** Học ngôn ngữ mới: chọn ngôn ngữ → trình độ → chủ đề (danh sách mặc định của ngôn ngữ đó, hoặc đồng bộ từ ngôn ngữ đang
 * học). Chỉ lưu lựa chọn của user — nội dung học vẫn là kho chung của ngôn ngữ, không sao chép dữ liệu. */
export function AddLanguageWizard() {
  const languages = useApi(() => courseService.list(), [])
  const onboarding = useApi(() => onboardingService.get(), [])
  if (languages.loading || onboarding.loading) return <Spinner />
  if (!languages.data || !onboarding.data) {
    const retry = () => {
      languages.reload()
      onboarding.reload()
    }
    return <ErrorState error={languages.error ?? onboarding.error ?? new Error()} onRetry={retry} />
  }
  return <Wizard languages={languages.data} learning={onboarding.data.target_languages} />
}

function Wizard({ languages, learning }: { languages: Language[]; learning: TargetLanguage[] }) {
  const t = useTranslation()
  const router = useRouter()
  const [step, setStep] = useState<Step>('language')
  const [languageId, setLanguageId] = useState('')
  const [level, setLevel] = useState<CefrLevel>('A1')
  const [topics, setTopics] = useState<string[]>([])
  const [source, setSource] = useState<TopicSource>(DEFAULT_SOURCE)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const index = STEPS.indexOf(step)

  const learningIds = new Set(learning.map((l) => l.language_id))
  const nameOf = (id: string) => languages.find((l) => l.id === id)?.name ?? id.toUpperCase()

  const next = () => {
    if (step === 'language' && !languageId) return setErr(t.addLanguage.needLanguage)
    setErr(null)
    setStep(STEPS[index + 1])
  }

  const finish = async () => {
    setBusy(true)
    setErr(null)
    try {
      await onboardingService.addLanguage(languageId, { level, topics })
      router.push(`/learn/${languageId}`)
    } catch (e) {
      setErr(inlineError(e))
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{t.onboarding.stepOf(index + 1, STEPS.length)}</p>
        <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">{step === 'language' ? t.addLanguage.title : t.addLanguage.steps[step]}</h1>
      </div>
      <div className="mb-6 flex gap-1.5" aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s} className={cn('h-1.5 flex-1 rounded-full', i <= index ? 'bg-indigo-600' : 'bg-slate-200')} />
        ))}
      </div>

      <Card className="p-5 sm:p-6">
        {step === 'language' && (
          <LanguageStep
            languages={languages}
            learningIds={learningIds}
            value={languageId}
            onChange={(id) => {
              // Đổi ngôn ngữ thì bỏ chủ đề + nguồn đồng bộ của ngôn ngữ trước
              if (id !== languageId) {
                setTopics([])
                setSource(DEFAULT_SOURCE)
              }
              setLanguageId(id)
            }}
          />
        )}
        {step === 'level' && (
          <div>
            <p className="mb-3 text-sm text-slate-500">
              <span aria-hidden>{languageFlag(languageId)}</span> {nameOf(languageId)}
            </p>
            <LevelPicker value={level} onChange={setLevel} />
          </div>
        )}
        {step === 'topics' && (
          <TopicsStep
            languageId={languageId}
            sources={learning.map((l) => l.language_id).filter((id) => id !== languageId)}
            nameOf={nameOf}
            topics={topics}
            onChange={setTopics}
            source={source}
            onSourceChange={setSource}
            onError={setErr}
          />
        )}

        {err && (
          <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {err}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          {index > 0 ? (
            <Button variant="ghost" onClick={() => (setErr(null), setStep(STEPS[index - 1]))} disabled={busy}>
              {t.onboarding.back}
            </Button>
          ) : (
            <Link href="/learn" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100">
              {t.onboarding.back}
            </Link>
          )}
          {step === 'topics' ? (
            <Button onClick={finish} disabled={busy}>
              {busy ? t.onboarding.saving : t.addLanguage.start}
            </Button>
          ) : (
            <Button onClick={next}>{t.onboarding.next}</Button>
          )}
        </div>
      </Card>
    </div>
  )
}

function LanguageStep({
  languages,
  learningIds,
  value,
  onChange,
}: {
  languages: Language[]
  learningIds: Set<string>
  value: string
  onChange: (id: string) => void
}) {
  const t = useTranslation()
  if (languages.every((l) => learningIds.has(l.id))) return <p className="text-sm text-slate-500">{t.addLanguage.allLearning}</p>
  return (
    <div>
      <p className="text-sm text-slate-500">{t.addLanguage.languageHint}</p>
      <div className="mt-4 space-y-3">
        {languages.map((lang) => {
          const learning = learningIds.has(lang.id)
          const selected = value === lang.id
          return (
            <button
              key={lang.id}
              type="button"
              onClick={() => onChange(lang.id)}
              disabled={learning}
              aria-pressed={selected}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ring-1 transition disabled:cursor-not-allowed disabled:opacity-60',
                selected ? 'bg-indigo-50/60 ring-2 ring-indigo-600' : 'ring-slate-200 hover:ring-slate-300',
              )}
            >
              <span className="text-2xl" aria-hidden>
                {languageFlag(lang.id)}
              </span>
              <span className="flex-1 font-semibold text-slate-800">{lang.name}</span>
              {learning && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{t.addLanguage.learning}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TopicsStep({
  languageId,
  sources,
  nameOf,
  topics,
  onChange,
  source,
  onSourceChange,
  onError,
}: {
  languageId: string
  sources: string[]
  nameOf: (id: string) => string
  topics: string[]
  onChange: (topics: string[]) => void
  source: TopicSource
  onSourceChange: (source: TopicSource) => void
  onError: (msg: string | null) => void
}) {
  const t = useTranslation()
  const { data: available, error, loading, reload } = useApi(() => vocabularyService.listTopics(languageId), [languageId])
  const [syncing, setSyncing] = useState(false)
  // Mỗi lần bấm nguồn tăng 1; rời bước (unmount) cũng tăng → kết quả đồng bộ về trễ không ghi đè lựa chọn mới
  const latest = useRef(0)
  useEffect(() => () => void latest.current++, [])

  const pickSource = async (from: string) => {
    const run = ++latest.current
    onSourceChange({ from, synced: null })
    onError(null)
    if (!from) return setSyncing(false)
    setSyncing(true)
    try {
      const res = await onboardingService.topicSync(languageId, from)
      if (latest.current !== run) return
      // Chỉ chọn sẵn chủ đề đang hiện trong danh sách (chủ đề cấp cao nhất) để user thấy và bỏ chọn được; khớp vào chủ
      // đề con thì báo là chưa đồng bộ được cùng các chủ đề ngôn ngữ này chưa có
      const shown = new Set(available?.map((x) => x.name))
      const matched = [...new Set(res.matched.map((m) => m.to))]
      const synced = matched.filter((name) => shown.has(name))
      onSourceChange({ from, synced: { count: synced.length, skipped: [...res.missing, ...matched.filter((name) => !shown.has(name))] } })
      onChange(synced)
    } catch (e) {
      if (latest.current === run) onError(inlineError(e))
    } finally {
      if (latest.current === run) setSyncing(false)
    }
  }

  const toggle = (name: string) => onChange(topics.includes(name) ? topics.filter((x) => x !== name) : [...topics, name])

  if (loading) return <Spinner />
  if (!available) return <ErrorState error={error ?? new Error()} onRetry={reload} />
  if (available.length === 0) return <p className="text-sm text-slate-400">{t.onboarding.noTopics}</p>

  return (
    <div>
      <p className="text-sm text-slate-500">{t.onboarding.topicsHint}</p>
      {sources.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-slate-500">{t.addLanguage.topicSource}</p>
          <div className="flex flex-wrap gap-2">
            {['', ...sources].map((from) => (
              <button
                key={from || 'default'}
                type="button"
                onClick={() => pickSource(from)}
                aria-pressed={source.from === from}
                disabled={syncing}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium ring-1 transition disabled:opacity-60',
                  source.from === from ? 'bg-indigo-50 text-indigo-700 ring-indigo-300' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300',
                )}
              >
                {from ? (
                  <>
                    <span aria-hidden>{languageFlag(from)} </span>
                    {t.addLanguage.sourceSync(nameOf(from))}
                  </>
                ) : (
                  t.addLanguage.sourceDefault
                )}
              </button>
            ))}
          </div>
          {syncing && <Spinner />}
          {source.synced && (
            <div className="mt-3 space-y-1 text-xs text-slate-500">
              <p>
                {source.synced.count > 0
                  ? t.addLanguage.syncedCount(source.synced.count, nameOf(source.from))
                  : t.addLanguage.syncNone(nameOf(source.from))}
              </p>
              {source.synced.skipped.length > 0 && <p>{t.addLanguage.syncMissing(source.synced.skipped.join(', '))}</p>}
            </div>
          )}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {available.map((topic) => {
          const selected = topics.includes(topic.name)
          return (
            <button
              key={topic.name}
              type="button"
              onClick={() => toggle(topic.name)}
              aria-pressed={selected}
              disabled={syncing}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition disabled:opacity-60',
                selected ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300',
              )}
            >
              {topic.icon && <span aria-hidden>{topic.icon} </span>}
              {topic.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
