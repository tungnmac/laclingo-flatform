'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { inputClass } from '@/features/auth/components/AuthForm'
import { AnalysisResult } from '@/features/sentence-analysis/components/AnalysisResult'
import { sentenceService } from '@/features/sentence-analysis/sentence.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { ApiError, inlineError } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { SentenceAnalysis } from '@/types/api'

const MAX_LEN = 300
type Lang = 'en' | 'zh'

/**
 * Phân tích câu bằng AI. ?text=…&language=en|zh (từ nút 🔍 ở câu ví dụ) → điền sẵn và tự phân tích.
 * Mỗi học viên giới hạn lượt/ngày; câu đã có người phân tích lấy từ cache, không tính lượt.
 */
export default function AnalyzePage({ searchParams }: { searchParams: { text?: string; language?: string } }) {
  const t = useTranslation()
  const a = t.analyze
  const [lang, setLang] = useState<Lang>(searchParams.language === 'zh' ? 'zh' : 'en')
  const [text, setText] = useState(searchParams.text?.slice(0, MAX_LEN) ?? '')
  const [result, setResult] = useState<SentenceAnalysis | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: initialQuota } = useApi(() => sentenceService.quota(), [])
  const [quota, setQuota] = useState<{ remaining: number; limit: number; ai: boolean; pro: boolean } | null>(null)
  useEffect(() => {
    if (initialQuota) setQuota((q) => q ?? { remaining: initialQuota.remaining, limit: initialQuota.limit, ai: initialQuota.ai_available, pro: initialQuota.pro })
  }, [initialQuota])

  // Mỗi lần phân tích có số thứ tự — kết quả về muộn của lần cũ (đổi câu trên URL giữa chừng) bị bỏ qua
  const reqSeq = useRef(0)
  const analyze = async (l: Lang = lang, s: string = text) => {
    const sentence = s.trim()
    if (!sentence) return
    const id = ++reqSeq.current
    setBusy(true)
    setError(null)
    try {
      const res = await sentenceService.analyze(l, sentence)
      if (id !== reqSeq.current) return
      setResult(res)
      setQuota({ remaining: res.remaining, limit: res.limit, ai: res.ai_available, pro: res.pro })
    } catch (err) {
      if (id !== reqSeq.current) return
      setError(inlineError(err))
      if (err instanceof ApiError && err.status === 429) setQuota((q) => (q ? { ...q, remaining: 0 } : q))
    } finally {
      if (id === reqSeq.current) setBusy(false)
    }
  }

  // Mở từ nút 🔍 ở câu ví dụ (?text=…) → điền và phân tích luôn. Theo dõi cả lúc URL đổi mà trang vẫn giữ nguyên
  // (Next giữ component khi chỉ đổi query: Quay lại/Tiến tới, bấm 🔍 ở câu khác); mỗi câu trên URL chạy 1 lần.
  const lastAuto = useRef<string | null>(null)
  useEffect(() => {
    const urlText = searchParams.text?.slice(0, MAX_LEN) ?? ''
    const urlLang: Lang = searchParams.language === 'zh' ? 'zh' : 'en'
    const key = urlLang + '\x00' + urlText
    if (lastAuto.current === key) return
    lastAuto.current = key
    setLang(urlLang)
    setText(urlText)
    if (urlText.trim()) void analyze(urlLang, urlText)
    else {
      reqSeq.current++ // bỏ kết quả của câu đang phân tích dở
      setBusy(false)
      setResult(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.text, searchParams.language])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void analyze()
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <PageHeader title={a.pageTitle} description={a.pageSubtitle} />

      <Card>
        <form onSubmit={submit} className="space-y-3">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={a.languageLabel}>
            {(['en', 'zh'] as const).map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={lang === l}
                onClick={() => setLang(l)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset transition',
                  lang === l ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50',
                )}
              >
                {a.languages[l]}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                void analyze()
              }
            }}
            maxLength={MAX_LEN}
            rows={3}
            placeholder={a.placeholder[lang]}
            aria-label={a.pageTitle}
            className={cn(inputClass, 'text-lg')}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-500">
              {a.charCount(text.length, MAX_LEN)}
              {quota && quota.ai && <span className="ml-3 font-medium text-indigo-600">{a.quota(quota.remaining, quota.limit)}</span>}
              {quota && quota.ai && !quota.pro && (
                <Link href="/pricing" className="ml-2 font-semibold text-amber-600 hover:underline">
                  ⭐ {t.billing.analyzeUpgradeHint}
                </Link>
              )}
            </span>
            <Button type="submit" disabled={busy || !text.trim() || quota?.ai === false}>
              {busy ? a.analyzing : a.analyzeBtn}
            </Button>
          </div>
          {quota?.ai === false && <p className="text-sm text-amber-700">{a.noAI}</p>}
          {quota?.ai && quota.remaining === 0 && !error && <p className="text-sm text-amber-700">{a.quotaOut}</p>}
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </form>
      </Card>

      {busy && !result && <p className="text-center text-sm text-slate-500">{a.analyzing}</p>}
      {result && <AnalysisResult key={result.language_id + result.sentence} result={result} />}
    </div>
  )
}
