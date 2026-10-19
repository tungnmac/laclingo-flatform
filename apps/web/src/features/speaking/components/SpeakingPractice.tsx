'use client'

import { useState } from 'react'
import { AudioButton } from '@/components/audio/AudioButton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { inputClass } from '@/features/auth/components/AuthForm'
import { speechLang } from '@/features/course/components/LanguageCard'
import { LevelBadge } from '@/features/grammar/components/LevelBadge'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import type { SpeakingAttemptResult, SpeakingItem } from '@/types/api'
import { speakingService } from '../speaking.service'
import { useSpeechRecognition } from '../useSpeechRecognition'
import { scoreTone } from './ScoreBadge'

const keywordLabel = (k: string) => k.split('|').join(' / ')

/**
 * Luyện 1 câu: nghe mẫu → nói (Web Speech API, hoặc gõ khi trình duyệt không
 * hỗ trợ) → backend chấm theo quy tắc → hiện điểm, từ sai / ý chính còn thiếu, gợi ý.
 */
export function SpeakingPractice({
  item,
  languageId,
  position,
  onScored,
  onNext,
}: {
  item: SpeakingItem
  languageId: string
  position: string
  onScored: (bestScore: number) => void
  onNext?: () => void
}) {
  const t = useTranslation()
  const rec = useSpeechRecognition(speechLang(languageId))
  const [typing, setTyping] = useState(false)
  const [typed, setTyped] = useState('')
  const [showMeaning, setShowMeaning] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [showSample, setShowSample] = useState(false)
  const [result, setResult] = useState<SpeakingAttemptResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isAnswer = item.kind === 'answer'
  const manual = typing || !rec.supported
  const text = (manual ? typed : rec.transcript).trim()

  const submit = async () => {
    if (!text) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await speakingService.submitAttempt(item.id, text, manual ? 0 : rec.durationMs)
      setResult(res)
      onScored(res.best_score)
    } catch (err) {
      setSubmitError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const retry = () => {
    setResult(null)
    setTyped('')
    setShowSample(false)
    rec.reset()
  }

  const toggleTyping = () => {
    if (!typing) setTyped(rec.transcript) // chuyển sang gõ: giữ lại phần đã nói để sửa tiếp
    setTyping((v) => !v)
  }

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2 text-sm text-slate-500">
        <span>{position}</span>
        <LevelBadge level={item.level} />
      </div>

      <div className="space-y-3 text-center">
        <p className="text-sm font-medium text-slate-500">{isAnswer ? t.speaking.answerInstruction : t.speaking.repeatInstruction}</p>
        <p className="text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">{item.prompt}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <AudioButton text={item.prompt} languageId={languageId} />
          {item.prompt_meaning && (
            <Button variant="ghost" size="sm" onClick={() => setShowMeaning((v) => !v)}>
              {showMeaning ? t.speaking.hideMeaning : t.speaking.showMeaning}
            </Button>
          )}
          {isAnswer && item.keywords.length > 0 && !result && (
            <Button variant="ghost" size="sm" onClick={() => setShowHints((v) => !v)}>
              💡 {t.speaking.keywordsHint}
            </Button>
          )}
        </div>
        {showMeaning && <p className="text-slate-600">{item.prompt_meaning}</p>}
        {showHints && !result && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {item.keywords.map((k) => (
              <span key={k} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                {keywordLabel(k)}
              </span>
            ))}
          </div>
        )}
      </div>

      {!result && (
        <div className="flex flex-col gap-3">
          {!rec.supported && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t.speaking.notSupported}</p>}
          {rec.error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{t.speaking.micError(rec.error)}</p>}

          {rec.supported && !typing && (
            <>
              <div className="flex justify-center">
                {rec.listening ? (
                  <Button variant="danger" onClick={rec.stop}>
                    {t.speaking.stopRecording}
                  </Button>
                ) : (
                  <Button onClick={() => rec.start(isAnswer)}>{t.speaking.startRecording}</Button>
                )}
              </div>
              {rec.listening && <p className="animate-pulse text-center text-xs font-medium text-indigo-600">{t.speaking.recordingHint}</p>}
              <div className="min-h-20 rounded-xl border-2 border-dashed border-slate-200 p-3">
                <p className="mb-1 text-xs font-medium text-slate-400">{t.speaking.yourAnswer}</p>
                <p className={cn('text-slate-800', !rec.transcript && 'text-sm text-slate-400')}>
                  {rec.transcript || t.speaking.transcriptPlaceholder}
                </p>
              </div>
            </>
          )}

          {manual && (
            <textarea
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              rows={isAnswer ? 5 : 2}
              placeholder={t.speaking.typePlaceholder}
              aria-label={t.speaking.typePlaceholder}
              className={cn(inputClass, 'mt-0')}
            />
          )}

          {submitError && <p className="text-sm text-rose-600">{submitError}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {rec.supported ? (
              <Button variant="ghost" size="sm" onClick={toggleTyping} disabled={rec.listening}>
                {typing ? `🎤 ${t.speaking.startRecording.replace(/^🎤\s*/, '')}` : `⌨️ ${t.speaking.typeInstead}`}
              </Button>
            ) : (
              <span />
            )}
            <Button onClick={submit} disabled={!text || rec.listening || submitting}>
              {submitting ? t.speaking.submitting : t.speaking.submit}
            </Button>
          </div>
        </div>
      )}

      {result && <SpeakingResult item={item} languageId={languageId} result={result} showSample={showSample} onToggleSample={() => setShowSample((v) => !v)} />}

      {result && (
        <div className="flex flex-wrap justify-between gap-2">
          <Button variant="secondary" onClick={retry}>
            {t.speaking.tryAgain}
          </Button>
          {onNext && <Button onClick={onNext}>{t.speaking.next}</Button>}
        </div>
      )}
    </Card>
  )
}

function SpeakingResult({
  item,
  languageId,
  result,
  showSample,
  onToggleSample,
}: {
  item: SpeakingItem
  languageId: string
  result: SpeakingAttemptResult
  showSample: boolean
  onToggleSample: () => void
}) {
  const t = useTranslation()
  const tone = scoreTone(result.score)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-1">
        <div
          className={cn(
            'flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold ring-8',
            tone === 'emerald' && 'bg-emerald-50 text-emerald-700 ring-emerald-100',
            tone === 'amber' && 'bg-amber-50 text-amber-700 ring-amber-100',
            tone === 'rose' && 'bg-rose-50 text-rose-700 ring-rose-100',
          )}
          aria-label={`${t.speaking.scoreLabel} ${result.score}`}
        >
          {result.score}
        </div>
        {result.is_new_best ? (
          <span className="text-sm font-semibold text-emerald-600">{t.speaking.newBest}</span>
        ) : (
          <span className="text-sm text-slate-500">{t.speaking.bestSoFar(result.best_score)}</span>
        )}
        <p className="text-xs text-slate-400">{t.speaking.stats(result.word_count, result.filler_count, result.words_per_minute)}</p>
      </div>

      {result.words && (
        <div className="space-y-1 text-center">
          <p className="text-xl leading-relaxed">
            {result.words.map((w, i) => (
              <span key={i} className={cn('mx-0.5 font-semibold', w.matched ? 'text-emerald-600' : 'text-rose-600 underline decoration-wavy')}>
                {w.word}
              </span>
            ))}
          </p>
          <p className="text-xs text-slate-400">{t.speaking.wordsLegend}</p>
        </div>
      )}

      {item.kind === 'answer' && (result.keywords_hit?.length || result.keywords_missed?.length) ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-emerald-700">✓ {t.speaking.keywordsHit}</p>
            <div className="flex flex-wrap gap-1.5">
              {(result.keywords_hit ?? []).map((k) => (
                <span key={k} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {keywordLabel(k)}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-rose-700">✗ {t.speaking.keywordsMissed}</p>
            <div className="flex flex-wrap gap-1.5">
              {(result.keywords_missed ?? []).map((k) => (
                <span key={k} className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                  {keywordLabel(k)}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {result.tips.length > 0 && (
        <ul className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          {result.tips.map((tip) => (
            <li key={tip}>💡 {t.speaking.tips[tip]}</li>
          ))}
        </ul>
      )}

      {item.sample_answer && (
        <div className="space-y-2">
          <Button variant="ghost" size="sm" onClick={onToggleSample}>
            {showSample ? '▾' : '▸'} {t.speaking.showSample}
          </Button>
          {showSample && (
            <div className="flex items-start gap-3 rounded-xl bg-indigo-50/60 p-3">
              <AudioButton text={item.sample_answer} languageId={languageId} className="shrink-0" />
              <p className="text-sm leading-relaxed text-slate-700">{item.sample_answer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

