'use client'

import { useState, type ReactNode } from 'react'
import { AudioButton } from '@/components/audio/AudioButton'
import { Card } from '@/components/ui/Card'
import { AddToDeckDialog } from '@/features/deck/components/AddToDeckDialog'
import { LevelBadge } from '@/features/grammar/components/LevelBadge'
import { PartOfSpeechBadge } from '@/features/vocabulary/components/PartOfSpeechBadge'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import type { SentenceAnalysis } from '@/types/api'

const WORD_CHAR = /[\p{L}\p{N}]/u

/**
 * Vị trí của đoạn trong câu: ưu tiên chỗ đứng riêng thành từ ("a" không khớp vào giữa "am", "in" không khớp vào
 * "interested"), bỏ qua chỗ đã tô; không có thì lấy chỗ khớp đầu tiên (tiếng Trung không có khoảng trắng giữa từ)
 */
function findFragment(text: string, f: string, taken: { start: number; end: number }[]): number {
  const free = (i: number) => !taken.some((m) => i < m.end && i + f.length > m.start)
  let fallback = -1
  for (let i = text.indexOf(f); i >= 0; i = text.indexOf(f, i + 1)) {
    if (!free(i)) continue
    const before = text[i - 1] ?? ' '
    const after = text[i + f.length] ?? ' '
    const edgeOK = (c: string, edge: string) => !WORD_CHAR.test(c) || !WORD_CHAR.test(edge)
    if (edgeOK(before, f[0]) && edgeOK(after, f[f.length - 1])) return i
    if (fallback < 0) fallback = i
  }
  return /[\p{Script=Han}]/u.test(f) ? fallback : -1
}

/** Tô màu từng đoạn trong câu (đoạn lỗi ở câu gốc / đoạn đã sửa ở câu đúng) */
function highlight(text: string, fragments: string[], className: string): ReactNode {
  const marks: { start: number; end: number }[] = []
  for (const f of fragments) {
    if (!f) continue
    const start = findFragment(text, f, marks)
    if (start < 0) continue
    marks.push({ start, end: start + f.length })
  }
  marks.sort((a, b) => a.start - b.start)
  const out: ReactNode[] = []
  let pos = 0
  marks.forEach((m, i) => {
    out.push(text.slice(pos, m.start), <mark key={i} className={className}>{text.slice(m.start, m.end)}</mark>)
    pos = m.end
  })
  out.push(text.slice(pos))
  return out
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="space-y-3">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </Card>
  )
}

/** Kết quả phân tích 1 câu: đúng/sai, câu đã sửa + nghĩa, lỗi, cấu trúc, ngữ pháp, từ vựng */
export function AnalysisResult({ result }: { result: SentenceAnalysis }) {
  const t = useTranslation()
  const a = t.analyze
  const lang = result.language_id
  const [deckWord, setDeckWord] = useState<{ id: string; term: string } | null>(null)
  const hasErrors = result.errors.length > 0
  // AI có thể báo "chưa tự nhiên" mà không liệt kê lỗi cụ thể — vẫn không được hiện là câu đúng
  const needsFix = hasErrors || !result.is_correct

  return (
    <div className="flex flex-col gap-4">
      <Card className={cn('space-y-3 ring-1', needsFix ? 'ring-orange-200' : 'ring-emerald-200')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={cn('text-lg font-bold', needsFix ? 'text-orange-700' : 'text-emerald-700')}>
            {hasErrors ? a.incorrectTitle(result.errors.length) : needsFix ? a.notNaturalTitle : a.correctTitle}
          </p>
          {result.cached && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">{a.cached}</span>}
        </div>
        {needsFix && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{a.yourSentence}</p>
            <p className="mt-0.5 text-lg text-slate-700">
              {highlight(result.sentence, result.errors.map((e) => e.original), 'rounded bg-rose-100 px-0.5 text-rose-700 line-through decoration-rose-400')}
            </p>
          </div>
        )}
        {result.corrected && (
          <div>
            {needsFix && <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{a.corrected}</p>}
            <div className="mt-0.5 flex items-start gap-2">
              <p className="text-xl font-semibold text-slate-900">
                {highlight(result.corrected, result.errors.map((e) => e.correction), 'rounded bg-emerald-100 px-0.5 text-emerald-800')}
              </p>
              <AudioButton text={result.corrected} languageId={lang} className="shrink-0" />
            </div>
          </div>
        )}
        {result.translation && (
          <p className="text-slate-600">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{a.translation}: </span>
            {result.translation}
          </p>
        )}
      </Card>

      {hasErrors && (
        <Section title={a.errorsTitle}>
          <ul className="space-y-3">
            {result.errors.map((e, i) => (
              <li key={i} className="rounded-xl bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">{a.errorTypes[e.type] ?? e.type}</span>
                  <span className="text-sm">
                    <span className="text-rose-600 line-through">{e.original || a.missing}</span>
                    <span className="mx-1.5 text-slate-400">→</span>
                    <span className="font-semibold text-emerald-700">{e.correction || a.remove}</span>
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-slate-700">{e.explanation}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {result.structure.length > 0 && (
        <Section title={a.structureTitle}>
          <div className="flex flex-wrap gap-2">
            {result.structure.map((p, i) => (
              <div key={i} title={p.note || undefined} className="rounded-xl bg-indigo-50 px-3 py-2 text-center ring-1 ring-inset ring-indigo-100">
                <p className="font-semibold text-slate-900">{p.text}</p>
                <p className="text-xs text-indigo-700">{p.role}</p>
                {p.note && <p className="mt-0.5 max-w-[14rem] text-xs text-slate-500">{p.note}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {result.grammar_points.length > 0 && (
        <Section title={a.grammarTitle}>
          <ul className="space-y-2">
            {result.grammar_points.map((g, i) => (
              <li key={i}>
                <p className="font-semibold text-slate-900">📐 {g.name}</p>
                <p className="text-sm text-slate-600">{g.explanation}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {result.vocabulary.length > 0 && (
        <Section title={a.vocabTitle}>
          <ul className="divide-y divide-slate-100">
            {result.vocabulary.map((w, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <span className="font-semibold text-slate-900">{w.term}</span>
                <AudioButton text={w.term} languageId={lang} className="h-8 w-8 shrink-0" />
                {w.phonetic && <span className="text-sm text-slate-500">/{w.phonetic}/</span>}
                <PartOfSpeechBadge value={w.part_of_speech} />
                {w.level && <LevelBadge level={w.level} />}
                {/* mobile: nút ôn tập cuối dòng trên, nghĩa xuống dòng riêng; sm+: nghĩa ở giữa, nút cuối dòng */}
                {w.vocabulary_id && (
                  <button
                    type="button"
                    onClick={() => setDeckWord({ id: w.vocabulary_id!, term: w.term })}
                    title={a.inAppHint}
                    className="ml-auto shrink-0 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 sm:order-last"
                  >
                    {a.addToReview}
                  </button>
                )}
                <span className="w-full text-sm text-slate-700 sm:w-auto sm:min-w-0 sm:flex-1">{w.meaning}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {deckWord && <AddToDeckDialog vocabularyId={deckWord.id} term={deckWord.term} onClose={() => setDeckWord(null)} onAdded={() => {}} />}
    </div>
  )
}
