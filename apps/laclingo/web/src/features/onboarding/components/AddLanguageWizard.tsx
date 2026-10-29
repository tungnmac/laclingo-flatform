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
import type { CefrLevel, Language, TargetLanguage, VocabularyTopic } from '@/types/api'
import { onboardingService } from '../onboarding.service'
import { LevelPicker } from './OnboardingWizard'

const STEPS = ['language', 'level', 'topics'] as const
type Step = (typeof STEPS)[number]

const MAX_TOPICS = 20 // = maxTopicsPerLanguage ở backend (chủ đề có sẵn + chủ đề dựng)

// Nguồn chủ đề: from = ngôn ngữ đồng bộ ('' = mặc định); buildFrom = ngôn ngữ nguồn của các chủ đề sẽ DỰNG cho ngôn ngữ mới
// (candidates — chủ đề ngôn ngữ mới chưa có); synced = số chủ đề có sẵn đã chọn theo đồng bộ. Giữ ở Wizard để quay lại
// bước chủ đề vẫn khớp với lựa chọn.
type Candidate = { name: string; icon?: string }
type TopicSource = { from: string; buildFrom: string; candidates: Candidate[]; synced: number | null }
const DEFAULT_SOURCE: TopicSource = { from: '', buildFrom: '', candidates: [], synced: null }

/** Học ngôn ngữ mới: chọn ngôn ngữ (đã có trong kho hoặc danh mục ngôn ngữ phổ biến, trừ ngôn ngữ đang học) → trình độ →
 * chủ đề. Chủ đề ngôn ngữ mới đã có thì chọn luôn; chưa có thì dựng từ chủ đề nguồn (ngôn ngữ đang học hoặc danh sách
 * mặc định) — nội dung dựng 1 lần, dùng chung cho mọi user (backend LanguageContentService). */
export function AddLanguageWizard() {
  const languages = useApi(() => courseService.catalog(), [])
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
  const [topics, setTopics] = useState<string[]>([]) // chủ đề có sẵn của ngôn ngữ mới
  const [build, setBuild] = useState<string[]>([]) // chủ đề nguồn sẽ dựng (tên ở source.buildFrom)
  const [source, setSource] = useState<TopicSource>(DEFAULT_SOURCE)
  const [busy, setBusy] = useState<{ done: number; total: number } | 'saving' | null>(null)
  const [sourceLoading, setSourceLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [hasTopics, setHasTopics] = useState<boolean | null>(null) // ngôn ngữ mới đã có chủ đề chưa (null = chưa tải)
  const index = STEPS.indexOf(step)

  const learningIds = new Set(learning.map((l) => l.language_id))
  const choices = languages.filter((l) => !learningIds.has(l.id))
  const nameOf = (id: string) => languages.find((l) => l.id === id)?.name ?? id.toUpperCase()

  const next = () => {
    if (step === 'language' && !languageId) return setErr(t.addLanguage.needLanguage)
    setErr(null)
    setStep(STEPS[index + 1])
  }

  const finish = async () => {
    if (!hasTopics && build.length === 0) return setErr(t.addLanguage.needTopic)
    setErr(null)
    try {
      // Dựng lần lượt từng chủ đề (mỗi request 1 lần gọi AI) — tránh request quá dài bị proxy cắt, hiện được tiến độ
      const names = [...topics]
      for (const [i, topic] of build.entries()) {
        setBusy({ done: i + 1, total: build.length })
        const res = await onboardingService.prepare(languageId, { from: source.buildFrom, topics: [topic] })
        names.push(...res.topics.filter((name) => !names.includes(name)))
      }
      if (names.length === 0 && !hasTopics) {
        setBusy(null)
        return setErr(t.addLanguage.buildFailed)
      }
      setBusy('saving')
      await onboardingService.addLanguage(languageId, { level, topics: names })
      router.push(`/learn/${languageId}`)
    } catch (e) {
      setErr(inlineError(e))
      setBusy(null)
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
            languages={choices}
            value={languageId}
            onChange={(id) => {
              // Đổi ngôn ngữ thì bỏ chủ đề + nguồn của ngôn ngữ trước
              if (id !== languageId) {
                setTopics([])
                setBuild([])
                setSource(DEFAULT_SOURCE)
                setHasTopics(null)
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
          <TopicsLoader
            onLoaded={setHasTopics}
            languageId={languageId}
            sources={learning.map((l) => l.language_id).filter((id) => id !== languageId)}
              nameOf={nameOf}
              topics={topics}
              onTopicsChange={setTopics}
              build={build}
              onBuildChange={setBuild}
            source={source}
            onSourceChange={setSource}
            loading={sourceLoading}
            onLoadingChange={setSourceLoading}
            onError={setErr}
          />
        )}

        {busy && busy !== 'saving' && <p className="mt-4 text-sm text-indigo-700">{t.addLanguage.preparing(busy.done, busy.total)}</p>}
        {err && (
          <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {err}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          {index > 0 ? (
            <Button variant="ghost" onClick={() => (setErr(null), setStep(STEPS[index - 1]))} disabled={!!busy}>
              {t.onboarding.back}
            </Button>
          ) : (
            <Link href="/learn" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100">
              {t.onboarding.back}
            </Link>
          )}
          {step === 'topics' ? (
            <Button onClick={finish} disabled={!!busy || hasTopics === null || sourceLoading}>
              {busy ? t.onboarding.saving : t.addLanguage.start}
            </Button>
          ) : (
            <Button onClick={next} disabled={step === 'language' && choices.length === 0}>
              {t.onboarding.next}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

function LanguageStep({ languages, value, onChange }: { languages: Language[]; value: string; onChange: (id: string) => void }) {
  const t = useTranslation()
  if (languages.length === 0) return <p className="text-sm text-slate-500">{t.addLanguage.allLearning}</p>
  return (
    <div>
      <p className="text-sm text-slate-500">{t.addLanguage.languageHint}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {languages.map((lang) => (
          <button
            key={lang.id}
            type="button"
            onClick={() => onChange(lang.id)}
            aria-pressed={value === lang.id}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ring-1 transition',
              value === lang.id ? 'bg-indigo-50/60 ring-2 ring-indigo-600' : 'ring-slate-200 hover:ring-slate-300',
            )}
          >
            <span className="text-2xl" aria-hidden>
              {languageFlag(lang.id)}
            </span>
            <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

type TopicsStepProps = {
  languageId: string
  available: VocabularyTopic[]
  sources: string[]
  nameOf: (id: string) => string
  topics: string[]
  onTopicsChange: (topics: string[]) => void
  build: string[]
  onBuildChange: (build: string[]) => void
  source: TopicSource
  onSourceChange: (source: TopicSource) => void
  loading: boolean
  onLoadingChange: (loading: boolean) => void
  onError: (msg: string | null) => void
}

/** Tải chủ đề của ngôn ngữ mới mỗi lần vào bước chủ đề (ngôn ngữ có thể vừa đổi) rồi mới hiện TopicsStep */
function TopicsLoader({ onLoaded, ...props }: Omit<TopicsStepProps, 'available'> & { onLoaded: (hasTopics: boolean) => void }) {
  const { data, error, loading, reload } = useApi(() => vocabularyService.listTopics(props.languageId), [props.languageId])
  useEffect(() => {
    if (data) onLoaded(data.length > 0)
  }, [data, onLoaded])
  if (loading) return <Spinner />
  if (!data) return <ErrorState error={error ?? new Error()} onRetry={reload} />
  return <TopicsStep {...props} available={data} />
}

function TopicsStep({
  languageId,
  available,
  sources,
  nameOf,
  topics,
  onTopicsChange,
  build,
  onBuildChange,
  source,
  onSourceChange,
  loading,
  onLoadingChange: setLoading,
  onError,
}: TopicsStepProps) {
  const t = useTranslation()
  // Mỗi lần bấm nguồn tăng 1; rời bước (unmount) cũng tăng → kết quả về trễ không ghi đè lựa chọn mới
  const latest = useRef(0)
  useEffect(
    () => () => {
      latest.current++
      setLoading(false)
    },
    [setLoading],
  )

  const pickSource = async (from: string) => {
    const run = ++latest.current
    // Đổi nguồn = chọn lại từ đầu theo nguồn mới
    onSourceChange({ ...DEFAULT_SOURCE, from })
    onTopicsChange([])
    onBuildChange([])
    onError(null)
    // Mặc định + ngôn ngữ mới đã có chủ đề: chọn trong danh sách có sẵn, không cần dựng
    if (!from && available.length > 0) return setLoading(false)
    setLoading(true)
    try {
      if (from) {
        // Đồng bộ: chủ đề khớp → chọn sẵn trong danh sách có sẵn; chủ đề ngôn ngữ mới chưa có → chọn sẵn để dựng
        const res = await onboardingService.topicSync(languageId, from)
        if (latest.current !== run) return
        const shown = new Set(available.map((x) => x.name))
        const synced = [...new Set(res.matched.map((m) => m.to))].filter((name) => shown.has(name))
        const picked = synced.slice(0, MAX_TOPICS)
        onSourceChange({ from, buildFrom: from, candidates: res.missing.map((name) => ({ name })), synced: picked.length })
        onTopicsChange(picked)
        onBuildChange(res.missing.slice(0, MAX_TOPICS - picked.length))
      } else {
        // Mặc định + ngôn ngữ mới chưa có nội dung: danh sách chủ đề mặc định (kho tiếng Anh) để dựng
        const reference = languageId === 'en' ? 'zh' : 'en'
        const list = await vocabularyService.listTopics(reference)
        if (latest.current !== run) return
        onSourceChange({ from: '', buildFrom: reference, candidates: list.map((x) => ({ name: x.name, icon: x.icon })), synced: null })
      }
    } catch (e) {
      if (latest.current === run) onError(inlineError(e))
    } finally {
      if (latest.current === run) setLoading(false)
    }
  }

  // Ngôn ngữ mới chưa có nội dung: nạp sẵn danh sách mặc định để dựng
  useEffect(() => {
    if (available.length === 0 && !source.from && !source.buildFrom) pickSource('')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy lần đầu vào bước chủ đề
  }, [])

  // Chủ đề có sẵn + chủ đề dựng tối đa MAX_TOPICS
  const toggle = (list: string[], name: string, set: (list: string[]) => void) => {
    if (list.includes(name)) return set(list.filter((x) => x !== name))
    if (topics.length + build.length >= MAX_TOPICS) return onError(t.addLanguage.maxTopics(MAX_TOPICS))
    onError(null)
    set([...list, name])
  }

  return (
    <div>
      <p className="text-sm text-slate-500">{available.length > 0 ? t.onboarding.topicsHint : t.addLanguage.noContentYet}</p>
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
                disabled={loading}
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
          {source.synced !== null && available.length > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              {source.synced > 0 ? t.addLanguage.syncedCount(source.synced, nameOf(source.from)) : t.addLanguage.syncNone(nameOf(source.from))}
            </p>
          )}
        </div>
      )}
      {loading && <Spinner />}

      {available.length > 0 && (
        <TopicChips
          title={t.addLanguage.existingTopics}
          items={available}
          selected={topics}
          disabled={loading}
          onToggle={(name) => toggle(topics, name, onTopicsChange)}
        />
      )}
      {source.candidates.length > 0 && (
        <>
          <TopicChips
            title={t.addLanguage.buildFrom(nameOf(source.buildFrom))}
            items={source.candidates}
            selected={build}
            disabled={loading}
            onToggle={(name) => toggle(build, name, onBuildChange)}
          />
          <p className="mt-2 text-xs text-slate-400">{t.addLanguage.buildHint}</p>
        </>
      )}
    </div>
  )
}

function TopicChips({
  title,
  items,
  selected,
  disabled,
  onToggle,
}: {
  title: string
  items: Candidate[]
  selected: string[]
  disabled: boolean
  onToggle: (name: string) => void
}) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 text-xs font-medium text-slate-500">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((topic) => {
          const isSelected = selected.includes(topic.name)
          return (
            <button
              key={topic.name}
              type="button"
              onClick={() => onToggle(topic.name)}
              aria-pressed={isSelected}
              disabled={disabled}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition disabled:opacity-60',
                isSelected ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300',
              )}
            >
              {topic.icon && <span aria-hidden>{topic.icon} </span>}
              {topic.name}
            </button>
          )
        })}
      </div>
    </section>
  )
}
