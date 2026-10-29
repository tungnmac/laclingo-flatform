'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { courseService } from '@/features/course/course.service'
import { languageFlag } from '@/features/course/components/LanguageCard'
import { useLanguageName } from '@/hooks/useLanguageName'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import type { LanguageSyncJob } from '@/types/api'
import { onboardingService } from '../onboarding.service'

const POLL_MS = 5_000
const READY_FOR_MS = 10 * 60_000 // ngôn ngữ dựng xong trong chừng này thì hiện "đã sẵn sàng"
const AUTO_CLOSE_MS = 30_000 // banner "đã sẵn sàng" tự đóng sau chừng này (đếm ngược)
// localStorage: banner "đã sẵn sàng" đã đóng — tab khác / mở lại app không hiện lại (giữ 20 mục gần nhất)
const CLOSED_KEY = 'laclingo-sync-ready-closed'
const MAX_CLOSED = 20

// Mỗi lần dựng xong 1 đợt có khoá riêng (ngôn ngữ + lúc xong): đợt dựng sau của cùng ngôn ngữ vẫn hiện lại
const readyKey = (p: Progress) => `${p.languageId}:${p.lastUpdate}`

function loadClosed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CLOSED_KEY) ?? '[]')
  } catch {
    return []
  }
}

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
  const languageName = useLanguageName()
  const pathname = usePathname()
  const [jobs, setJobs] = useState<LanguageSyncJob[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [dismissed, setDismissed] = useState<string[]>([])
  const [closedReady, setClosedReady] = useState<string[]>(loadClosed)
  const [readySince, setReadySince] = useState<Record<string, number>>({}) // readyKey → lúc bắt đầu đếm ngược
  const [now, setNow] = useState(() => Date.now())

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

  const nameOf = (id: string) => languageName(id, names[id])
  const retry = (id: string) => {
    setDismissed((d) => d.filter((x) => x !== id))
    // API trả job của riêng ngôn ngữ này → tải lại toàn bộ để không mất tiến độ các ngôn ngữ khác
    onboardingService
      .retrySync(id)
      .then(load)
      .catch(() => {})
  }

  // "Đã sẵn sàng": dựng xong hết, không chủ đề lỗi, có chủ đề dựng được — hiện kèm đếm ngược rồi tự đóng
  const isReady = (p: Progress) => p.open === 0 && p.failed === 0 && p.built > 0 && now - p.lastUpdate < READY_FOR_MS
  const readyKeys = progress
    .filter((p) => isReady(p) && !dismissed.includes(p.languageId) && !closedReady.includes(readyKey(p)))
    .map(readyKey)
  const readyKeysId = readyKeys.join('|')

  const closeReady = useCallback((key: string) => {
    setClosedReady((c) => {
      const next = [...new Set([...c, key])].slice(-MAX_CLOSED)
      try {
        localStorage.setItem(CLOSED_KEY, JSON.stringify(next))
      } catch {
        // không lưu được (chế độ riêng tư...) → chỉ đóng trong phiên này
      }
      return next
    })
  }, [])

  // Bắt đầu đếm ngược cho banner vừa chuyển sang "đã sẵn sàng"; đồng hồ 1 giây chỉ chạy khi còn banner đang đếm
  useEffect(() => {
    if (!readyKeysId) return
    const started = Date.now()
    setReadySince((r) => {
      const next = { ...r }
      for (const key of readyKeysId.split('|')) next[key] ??= started
      return next
    })
    setNow(started)
    const timer = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(timer)
  }, [readyKeysId])

  const secondsLeft = (p: Progress) => Math.ceil(((readySince[readyKey(p)] ?? now) + AUTO_CLOSE_MS - now) / 1000)
  useEffect(() => {
    for (const p of progress) if (readyKeys.includes(readyKey(p)) && secondsLeft(p) <= 0) closeReady(readyKey(p))
  })

  const rows = progress.filter(
    (p) => !dismissed.includes(p.languageId) && (p.open > 0 || p.failed > 0 || readyKeys.includes(readyKey(p))),
  )
  if (rows.length === 0) return null
  return (
    <div className="mb-4 space-y-2">
      {rows.map((p) => {
        const ready = readyKeys.includes(readyKey(p))
        return (
        <div
          key={p.languageId}
          className={cn(
            'rounded-xl px-4 py-3 text-sm ring-1',
            ready ? 'bg-emerald-50 text-emerald-900 ring-emerald-200' : 'bg-indigo-50 text-indigo-900 ring-indigo-100',
          )}
          role="status"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span aria-hidden>{ready ? '✅' : languageFlag(p.languageId)}</span>
            <span className="min-w-0 flex-1">
              {p.open > 0
                ? t.languageSync.building(nameOf(p.languageId), p.finished, p.total)
                : p.failed > 0
                  ? t.languageSync.failed(nameOf(p.languageId), p.failed)
                  : t.languageSync.ready(nameOf(p.languageId))}
              {ready && <span className="ml-1 text-xs text-emerald-700/80">{t.languageSync.autoClose(Math.max(0, secondsLeft(p)))}</span>}
            </span>
            {p.open === 0 && p.failed > 0 && (
              <button type="button" onClick={() => retry(p.languageId)} className="font-semibold text-indigo-700 hover:underline">
                {t.languageSync.retry}
              </button>
            )}
            {p.open === 0 && p.built > 0 && (
              <Link
                href={`/learn/${p.languageId}`}
                onClick={() => ready && closeReady(readyKey(p))}
                className={cn('font-semibold hover:underline', ready ? 'text-emerald-700' : 'text-indigo-700')}
              >
                {t.languageSync.open}
              </Link>
            )}
            {p.open === 0 && (
              <button
                type="button"
                onClick={() => (ready ? closeReady(readyKey(p)) : setDismissed((d) => [...d, p.languageId]))}
                className={ready ? 'text-emerald-400 hover:text-emerald-700' : 'text-indigo-400 hover:text-indigo-700'}
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
        )
      })}
    </div>
  )
}
