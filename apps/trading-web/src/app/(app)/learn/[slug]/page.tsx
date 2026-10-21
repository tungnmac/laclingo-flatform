'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Markdown } from '@/components/learn/Markdown'
import { Quiz } from '@/components/learn/Quiz'
import { useT } from '@/i18n/I18nProvider'
import type { Locale } from '@/i18n/locales'
import { api, ApiError } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { LessonDetailDto } from '@/server/learn/learn-service'

export default function LessonPage() {
  const params = useParams<{ slug: string }>()
  const { t, locale } = useT()
  const router = useRouter()
  const openedIn = useRef(locale) // ngôn ngữ lúc mở trang — khác đi nghĩa là người học vừa đổi ngôn ngữ
  const shownIn = useRef<Locale | null>(null) // ngôn ngữ của bài đang hiển thị = ngôn ngữ của params.slug
  const [lesson, setLesson] = useState<LessonDetailDto | null>(null)
  const [error, setError] = useState<unknown>(null)

  const load = useCallback(() => {
    let alive = true // đổi ngôn ngữ khi request trước chưa về → bỏ kết quả cũ
    setError(null)
    setLesson(null)
    const from = shownIn.current && shownIn.current !== locale ? `?from=${shownIn.current}` : ''
    api<LessonDetailDto>(`/api/learn/lessons/${encodeURIComponent(params.slug)}${from}`).then(
      (l) => {
        if (!alive) return
        shownIn.current = locale
        setLesson(l)
      },
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [params.slug, locale])

  useEffect(load, [load])

  // Đổi ngôn ngữ: API trả bản dịch (slug khác) → đổi URL theo; bài chưa có bản dịch → về danh sách kèm thông báo
  useEffect(() => {
    if (lesson && lesson.slug !== params.slug) router.replace(`/learn/${lesson.slug}`)
  }, [lesson, params.slug, router])
  useEffect(() => {
    if (error instanceof ApiError && error.status === 404 && locale !== openedIn.current) router.replace('/learn?untranslated=1')
  }, [error, locale, router])

  const backLink = (
    <Link href="/learn" className="text-sm font-semibold text-emerald-700 hover:underline">
      {t('learn.back')}
    </Link>
  )

  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="space-y-3 py-10 text-center">
        <p className="text-slate-500">{t('learn.notFound')}</p>
        {backLink}
      </div>
    )
  }
  if (error !== null) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
        <span>{errorMessage(error, t)}</span>
        <button onClick={() => load()} className="font-semibold underline">
          {t('common.retry')}
        </button>
      </div>
    )
  }
  if (!lesson) return <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>

  const p = lesson.progress
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm text-slate-500">
          {backLink} · {lesson.chapter.title}
        </p>
        <h1 className="mt-2 text-3xl font-bold">{lesson.title}</h1>
        {p && (
          <p className={`mt-1 text-sm ${p.completed ? 'font-semibold text-emerald-700' : 'text-amber-700'}`}>
            {p.completed ? t('learn.statusDone', { score: p.best_score }) : t('learn.statusInProgress', { score: p.best_score })}
          </p>
        )}
      </div>
      <Markdown source={lesson.content_md} />
      <Quiz
        key={lesson.id}
        slug={lesson.slug}
        questions={lesson.questions}
        onGraded={(progress) => setLesson((l) => (l ? { ...l, progress } : l))}
      />
      <nav className="flex justify-between border-t border-slate-200 pt-4 text-sm font-semibold">
        {lesson.prev_slug ? (
          <Link href={`/learn/${lesson.prev_slug}`} className="text-emerald-700 hover:underline">
            {t('learn.prev')}
          </Link>
        ) : (
          <span />
        )}
        {lesson.next_slug && (
          <Link href={`/learn/${lesson.next_slug}`} className="text-emerald-700 hover:underline">
            {t('learn.next')}
          </Link>
        )}
      </nav>
    </article>
  )
}
