'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState, Spinner } from '@/components/ui/States'
import { inputClass } from '@/features/auth/components/AuthForm'
import { courseService } from '@/features/course/course.service'
import { languageFlag } from '@/features/course/components/LanguageCard'
import { userService } from '@/features/user/user.service'
import { vocabularyService } from '@/features/vocabulary/vocabulary.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import { cn, displayName } from '@/lib/utils'
import { LOCALES, useLocale, type Locale } from '@/store/locale'
import { useSession } from '@/store/session'
import type { CefrLevel, OnboardingData, PreferredTopic, SaveOnboardingRequest, TargetLanguage } from '@/types/api'
import { onboardingService } from '../onboarding.service'

const STEPS = ['basic', 'avatar', 'languages', 'topics', 'done'] as const
type Step = (typeof STEPS)[number]

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const PRESET_AVATARS = ['lac', 'owl', 'fox', 'panda', 'cat', 'dog', 'tiger', 'bear', 'rabbit', 'penguin', 'koala', 'dragon']

// ISO 3166-1 alpha-2 — tên hiển thị lấy từ Intl.DisplayNames theo ngôn ngữ giao diện
const COUNTRY_CODES =
  'AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW'.split(
    ' ',
  )

// Ngôn ngữ mẹ đẻ phổ biến (mã ISO 639-1) — tên hiển thị qua Intl.DisplayNames
const NATIVE_LANGUAGE_CODES =
  'vi en zh ja ko fr de es pt it ru th id ms tl km lo my hi bn ar fa tr nl pl uk sv no da fi cs hu ro el he'.split(' ')

function displayNames(locale: Locale, type: 'region' | 'language', codes: string[]) {
  let names: Intl.DisplayNames | null = null
  try {
    names = new Intl.DisplayNames([locale], { type })
  } catch {
    // trình duyệt cũ không có Intl.DisplayNames → hiện mã
  }
  return codes
    .map((code) => ({ code, name: names?.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name, locale))
}

function toForm(data: OnboardingData): SaveOnboardingRequest {
  const u = data.user
  return {
    full_name: u.full_name ?? '',
    avatar_url: u.avatar_url ?? '',
    country: u.country ?? '',
    native_language: u.native_language ?? '',
    birth_year: u.birth_year ?? null,
    bio: u.bio ?? '',
    target_languages: data.target_languages,
    preferred_topics: data.preferred_topics,
    complete: false,
  }
}

/** Các bước thiết lập lần đầu đăng nhập — mở lại được từ Hồ sơ (điền sẵn dữ liệu đã lưu) */
export function OnboardingWizard() {
  const t = useTranslation()
  const router = useRouter()
  const { data, error, loading, reload } = useApi(() => onboardingService.get(), [])
  if (loading) return <Spinner />
  // Không tải được (mất mạng / lỗi server): vẫn cho thoát vào app — trang này toàn màn hình, không có menu
  if (!data)
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <ErrorState error={error ?? new Error()} onRetry={reload} />
        <Button variant="ghost" onClick={() => router.replace('/learn')}>
          {t.onboarding.skip}
        </Button>
      </div>
    )
  return <Wizard initial={data} key={data.user.id} title={t.onboarding.title} />
}

function Wizard({ initial, title }: { initial: OnboardingData; title: string }) {
  const t = useTranslation()
  const router = useRouter()
  const locale = useLocale((s) => s.locale)
  const setLocale = useLocale((s) => s.setLocale)
  const setUser = useSession((s) => s.setUser)
  const [form, setForm] = useState<SaveOnboardingRequest>(() => toForm(initial))
  const [step, setStep] = useState<Step>('basic')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const index = STEPS.indexOf(step)

  const update = (patch: Partial<SaveOnboardingRequest>) => setForm((f) => ({ ...f, ...patch }))

  // Xong / để sau: cập nhật user trong phiên (onboarded_at) để dashboard không mở lại onboarding
  const leave = async (action: () => Promise<unknown>) => {
    setBusy(true)
    setErr(null)
    try {
      await action()
      setUser(await userService.me())
      router.replace('/learn')
    } catch (e) {
      setErr(inlineError(e))
      setBusy(false)
    }
  }

  const finish = () =>
    leave(async () => {
      await onboardingService.save({ ...form, complete: true })
      // Lần đầu hoàn tất: ngôn ngữ mẹ đẻ có bản dịch giao diện → đổi giao diện sang ngôn ngữ đó (mở lại từ Hồ sơ thì giữ
      // ngôn ngữ giao diện người dùng đang chọn)
      const native = LOCALES.find((l) => l.value === form.native_language)
      if (!initial.user.onboarded_at && native && native.value !== locale) setLocale(native.value)
    })

  const canNext = step !== 'languages' || form.target_languages.length > 0
  const next = () => {
    if (!canNext) return setErr(t.onboarding.needLanguage)
    setErr(null)
    setStep(STEPS[index + 1])
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{t.onboarding.stepOf(index + 1, STEPS.length)}</p>
          <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">{step === 'basic' ? title : t.onboarding.steps[step]}</h1>
        </div>
        {step !== 'done' && (
          <button
            type="button"
            onClick={() => leave(onboardingService.skip)}
            disabled={busy}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            {t.onboarding.skip}
          </button>
        )}
      </div>
      <div className="mb-6 flex gap-1.5" aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s} className={cn('h-1.5 flex-1 rounded-full', i <= index ? 'bg-indigo-600' : 'bg-slate-200')} />
        ))}
      </div>

      <Card className="p-5 sm:p-6">
        {step === 'basic' && <BasicStep form={form} update={update} />}
        {step === 'avatar' && <AvatarStep form={form} update={update} onError={setErr} />}
        {step === 'languages' && <LanguagesStep form={form} update={update} />}
        {step === 'topics' && <TopicsStep form={form} update={update} />}
        {step === 'done' && (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 w-fit">
              <Avatar name={displayName({ full_name: form.full_name, email: initial.user.email })} src={form.avatar_url || undefined} className="h-20 w-20 text-2xl" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{t.onboarding.doneTitle}</h2>
            <p className="mt-2 text-sm text-slate-500">{t.onboarding.doneSubtitle}</p>
            <p className="mt-4 text-2xl">{form.target_languages.map((l) => languageFlag(l.language_id)).join(' ')}</p>
          </div>
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
            <span />
          )}
          {step === 'done' ? (
            <Button onClick={finish} disabled={busy}>
              {busy ? t.onboarding.saving : t.onboarding.finish}
            </Button>
          ) : (
            <Button onClick={next} disabled={busy}>
              {t.onboarding.next}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

type StepProps = { form: SaveOnboardingRequest; update: (patch: Partial<SaveOnboardingRequest>) => void }

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  const t = useTranslation()
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label} {optional && <span className="font-normal text-slate-400">{t.onboarding.optional}</span>}
      {children}
    </label>
  )
}

function BasicStep({ form, update }: StepProps) {
  const t = useTranslation()
  const locale = useLocale((s) => s.locale)
  const countries = useMemo(() => displayNames(locale, 'region', COUNTRY_CODES), [locale])
  const languages = useMemo(() => displayNames(locale, 'language', NATIVE_LANGUAGE_CODES), [locale])
  const thisYear = new Date().getFullYear()
  const years = Array.from({ length: thisYear - 3 - 1920 + 1 }, (_, i) => thisYear - 3 - i)

  return (
    <div className="space-y-4">
      <Field label={t.onboarding.fullName}>
        <input value={form.full_name} onChange={(e) => update({ full_name: e.target.value })} maxLength={100} autoComplete="name" className={inputClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.onboarding.country}>
          <select value={form.country} onChange={(e) => update({ country: e.target.value })} className={inputClass}>
            <option value="">{t.onboarding.selectPlaceholder}</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.onboarding.nativeLanguage}>
          <select value={form.native_language} onChange={(e) => update({ native_language: e.target.value })} className={inputClass}>
            <option value="">{t.onboarding.selectPlaceholder}</option>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label={t.onboarding.birthYear} optional>
        <select
          value={form.birth_year ?? ''}
          onChange={(e) => update({ birth_year: e.target.value ? Number(e.target.value) : null })}
          className={inputClass}
        >
          <option value="">{t.onboarding.selectPlaceholder}</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t.onboarding.bio} optional>
        <textarea
          value={form.bio}
          onChange={(e) => update({ bio: e.target.value })}
          maxLength={300}
          rows={3}
          placeholder={t.onboarding.bioPlaceholder}
          className={inputClass}
        />
        <span className="mt-1 block text-right text-xs font-normal text-slate-400">{form.bio.length}/300</span>
      </Field>
    </div>
  )
}

function AvatarStep({ form, update, onError }: StepProps & { onError: (msg: string | null) => void }) {
  const t = useTranslation()
  const user = useSession((s) => s.user)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  // Avatar mẫu nằm ở web (public/avatars) — lưu URL tuyệt đối để hiện đúng ở mọi nơi (kể cả app native nạp web này)
  const presetUrl = (slug: string) => `${window.location.origin}/avatars/${slug}.svg`

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    onError(null)
    try {
      const res = await onboardingService.uploadAvatar(file)
      update({ avatar_url: res.url })
    } catch (err) {
      onError(inlineError(err))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <p className="text-sm text-slate-500">{t.onboarding.avatarHint}</p>
      <div className="mt-4 flex flex-col items-center gap-3">
        <Avatar name={displayName({ full_name: form.full_name, email: user?.email ?? '' })} src={form.avatar_url || undefined} className="h-24 w-24 text-3xl" />
        <div className="flex flex-wrap justify-center gap-2">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onFile} className="hidden" />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? t.onboarding.uploading : t.onboarding.upload}
          </Button>
          {form.avatar_url && (
            <Button size="sm" variant="ghost" onClick={() => update({ avatar_url: '' })} disabled={uploading}>
              {t.onboarding.removeAvatar}
            </Button>
          )}
        </div>
      </div>
      <p className="mt-6 text-sm font-medium text-slate-700">{t.onboarding.presets}</p>
      <div className="mt-2 grid grid-cols-4 gap-3 sm:grid-cols-6">
        {PRESET_AVATARS.map((slug) => {
          const url = presetUrl(slug)
          const selected = form.avatar_url === url
          return (
            <button
              key={slug}
              type="button"
              onClick={() => update({ avatar_url: url })}
              aria-pressed={selected}
              aria-label={slug}
              className={cn('rounded-full p-1 transition', selected ? 'ring-2 ring-indigo-600' : 'hover:ring-2 hover:ring-slate-200')}
            >
              <img src={`/avatars/${slug}.svg`} alt="" className="aspect-square w-full rounded-full" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function LanguagesStep({ form, update }: StepProps) {
  const t = useTranslation()
  const { data: languages, error, loading, reload } = useApi(() => courseService.list(), [])
  if (loading) return <Spinner />
  if (!languages) return <ErrorState error={error ?? new Error()} onRetry={reload} />

  const selected = new Map(form.target_languages.map((l) => [l.language_id, l]))
  const toggle = (id: string) => {
    if (selected.has(id)) {
      update({
        target_languages: form.target_languages.filter((l) => l.language_id !== id),
        // Bỏ ngôn ngữ thì bỏ luôn chủ đề đã chọn của ngôn ngữ đó (backend từ chối chủ đề của ngôn ngữ không học)
        preferred_topics: form.preferred_topics.filter((p) => p.language_id !== id),
      })
    } else {
      update({ target_languages: [...form.target_languages, { language_id: id, level: 'A1' }] })
    }
  }
  const setLevel = (id: string, level: CefrLevel) =>
    update({ target_languages: form.target_languages.map((l): TargetLanguage => (l.language_id === id ? { ...l, level } : l)) })

  return (
    <div>
      <p className="text-sm text-slate-500">{t.onboarding.languagesHint}</p>
      <div className="mt-4 space-y-3">
        {languages.map((lang) => {
          const target = selected.get(lang.id)
          return (
            <div key={lang.id} className={cn('rounded-xl ring-1 transition', target ? 'bg-indigo-50/60 ring-indigo-300' : 'ring-slate-200')}>
              <button type="button" onClick={() => toggle(lang.id)} aria-pressed={!!target} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                <span className="text-2xl" aria-hidden>
                  {languageFlag(lang.id)}
                </span>
                <span className="flex-1 font-semibold text-slate-800">{lang.name}</span>
                <span
                  aria-hidden
                  className={cn('flex h-5 w-5 items-center justify-center rounded-full text-xs text-white', target ? 'bg-indigo-600' : 'ring-1 ring-slate-300')}
                >
                  {target && '✓'}
                </span>
              </button>
              {target && (
                <div className="border-t border-indigo-100 px-4 pb-4 pt-3">
                  <p className="mb-2 text-xs font-medium text-slate-500">{t.onboarding.levelLabel}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {LEVELS.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setLevel(lang.id, level)}
                        aria-pressed={target.level === level}
                        className={cn(
                          'rounded-lg px-3 py-2 text-left ring-1 transition',
                          target.level === level ? 'bg-white ring-2 ring-indigo-600' : 'bg-white/70 ring-slate-200 hover:ring-slate-300',
                        )}
                      >
                        <span className="block text-sm font-semibold text-slate-800">{t.onboarding.levels[level].name}</span>
                        <span className="block text-xs text-slate-500">{t.onboarding.levels[level].desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TopicsStep({ form, update }: StepProps) {
  const t = useTranslation()
  return (
    <div>
      <p className="text-sm text-slate-500">{t.onboarding.topicsHint}</p>
      <div className="mt-4 space-y-6">
        {form.target_languages.map((l) => (
          <LanguageTopics key={l.language_id} languageId={l.language_id} form={form} update={update} />
        ))}
      </div>
    </div>
  )
}

function LanguageTopics({ languageId, form, update }: StepProps & { languageId: string }) {
  const t = useTranslation()
  const { data: topics, error, loading, reload } = useApi(() => vocabularyService.listTopics(languageId), [languageId])
  const isSelected = (topic: string) => form.preferred_topics.some((p) => p.language_id === languageId && p.topic === topic)
  const toggle = (topic: string) =>
    update({
      preferred_topics: isSelected(topic)
        ? form.preferred_topics.filter((p) => !(p.language_id === languageId && p.topic === topic))
        : [...form.preferred_topics, { language_id: languageId, topic } satisfies PreferredTopic],
    })

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-700">
        <span aria-hidden>{languageFlag(languageId)}</span> {languageId.toUpperCase()}
      </h3>
      {loading ? (
        <Spinner />
      ) : !topics ? (
        <ErrorState error={error ?? new Error()} onRetry={reload} />
      ) : topics.length === 0 ? (
        <p className="text-sm text-slate-400">{t.onboarding.noTopics}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <button
              key={topic.name}
              type="button"
              onClick={() => toggle(topic.name)}
              aria-pressed={isSelected(topic.name)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition',
                isSelected(topic.name) ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300',
              )}
            >
              {topic.icon && <span aria-hidden>{topic.icon} </span>}
              {topic.name}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
