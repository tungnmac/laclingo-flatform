'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { courseService } from '@/features/course/course.service'
import { languageFlag } from '@/features/course/components/LanguageCard'
import { useTranslation } from '@/hooks/useTranslation'
import type { LanguageSyncJob } from '@/types/api'
import { onboardingService } from '../onboarding.service'

const POLL_MS = 5_000
const READY_FOR_MS = 10 * 60_000 // ngôn ngữ dựng xong trong chừng này thì hiện "đã sẵn sàng"

type Progress = { languageId: string; total: number; finished: number; built: number; failed: number; open: number; waiting: boolean; lastUpdate: number }

function summarize(jobs: LanguageSyncJob[]): Progress[] {
  const byLanguage = new Map<string, Progress>()
  for (const j of jobs) {
    const p = byLanguage.get(j.language_id) ?? {
      languageId: j.language_id, total: 0, finished: 0, built: 0, failed: 0, open: 0, waiting: false, lastUpdate: 0,
    }
    p.total++
    if (j.status === 'done' || j.status === 'failed') p.finished++
    if (j.status === 'done' && j.result_topic) p.built++ // xong mà không dựng được từ nào thì không tính
    if (j.status === 'failed') p.failed++
    if (j.status === 'pending' || j.status === 'running') p.open++
    // Đang chờ thử lại sau lỗi (AI quá tải...) — báo để user biết không phải treo
    if (j.status === 'pending' && j.attempts > 0) p.waiting = true
    p.lastUpdate = Math.max(p.lastUpdate, Date.parse(j.updated_at))
    byLanguage.set(j.language_id, p)
  }
  return [...byLanguage.values()]
}

/** Tiến độ hàng đợi dựng nội dung cho ngôn ngữ mới — hiện ở đầu mọi trang trong app: đang dựng (tự cập nhật), vừa xong
 * (link vào học), hoặc có chủ đề lỗi (thử lại). Chỉ hỏi lại định kỳ khi còn chủ đề đang chờ / đang dựng. */
export function LanguageSyncBanner() {
  const t = useTranslation()
  const pathname = usePathname()
  const [jobs, setJobs] = useState<LanguageSyncJob[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [dismissed, setDismissed] = useState<string[]>([])

  const load = useCallback(() => {
    onboardingService
      .syncJobs()
      .then(setJobs)
      .catch(() => {})
  }, [])

  // Mỗi lần chuyển trang hỏi lại 1 lần (vừa thêm ngôn ngữ ở wizard thì hiện ngay)
  useEffect(load, [load, pathname])

  const progress = summarize(jobs)
  const anyOpen = progress.some((p) => p.open > 0)
  useEffect(() => {
    if (!anyOpen) return
    const timer = setInterval(load, POLL_MS)
    return () => clearInterval(timer)
  }, [anyOpen, load])

  // Tên ngôn ngữ từ danh mục (ngôn ngữ đang dựng chưa có từ nên chưa có trong danh sách khoá học)
  const hasJobs = jobs.length > 0
  useEffect(() => {
    if (!hasJobs) return
    courseService
      .catalog()
      .then((list) => setNames(Object.fromEntries(list.map((l) => [l.id, l.name]))))
      .catch(() => {})
  }, [hasJobs])

  const nameOf = (id: string) => names[id] ?? id.toUpperCase()
  const retry = (id: string) => {
    setDismissed((d) => d.filter((x) => x !== id))
    // API trả job của riêng ngôn ngữ này → tải lại toàn bộ để không mất tiến độ các ngôn ngữ khác
    onboardingService
      .retrySync(id)
      .then(load)
      .catch(() => {})
  }

  const rows = progress.filter(
    (p) => !dismissed.includes(p.languageId) && (p.open > 0 || p.failed > 0 || (p.built > 0 && Date.now() - p.lastUpdate < READY_FOR_MS)),
  )
  if (rows.length === 0) return null
  return (
    <div className="mb-4 space-y-2">
      {rows.map((p) => (
        <div key={p.languageId} className="rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-900 ring-1 ring-indigo-100" role="status">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span aria-hidden>{languageFlag(p.languageId)}</span>
            <span className="min-w-0 flex-1">
              {p.open > 0
                ? t.languageSync.building(nameOf(p.languageId), p.finished, p.total)
                : p.failed > 0
                  ? t.languageSync.failed(nameOf(p.languageId), p.failed)
                  : t.languageSync.ready(nameOf(p.languageId))}
            </span>
            {p.open === 0 && p.failed > 0 && (
              <button type="button" onClick={() => retry(p.languageId)} className="font-semibold text-indigo-700 hover:underline">
                {t.languageSync.retry}
              </button>
            )}
            {p.open === 0 && p.built > 0 && (
              <Link href={`/learn/${p.languageId}`} className="font-semibold text-indigo-700 hover:underline">
                {t.languageSync.open}
              </Link>
            )}
            {p.open === 0 && (
              <button
                type="button"
                onClick={() => setDismissed((d) => [...d, p.languageId])}
                className="text-indigo-400 hover:text-indigo-700"
                aria-label={t.languageSync.dismiss}
              >
                ✕
              </button>
            )}
          </div>
          {p.open > 0 && (
            <>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-indigo-100">
                <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${Math.max(5, (p.finished / p.total) * 100)}%` }} />
              </div>
              {p.waiting && <p className="mt-1 text-xs text-indigo-700/80">{t.languageSync.waiting}</p>}
            </>
          )}
        </div>
      ))}
    </div>
  )
}
