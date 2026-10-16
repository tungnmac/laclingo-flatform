'use client'

import { useMemo, useState } from 'react'
import { AudioButton } from '@/components/audio/AudioButton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PartOfSpeechBadge } from '@/features/vocabulary/components/PartOfSpeechBadge'
import { useTranslation } from '@/hooks/useTranslation'
import { resolveMediaUrl } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { DueVocabulary } from '@/types/api'
import { tokenize } from '../../practice'
import { ChoiceExercise } from './ChoiceExercise'
import { DictationExercise } from './DictationExercise'
import { WordOrderExercise } from './WordOrderExercise'

type Step = 'choice' | 'sentence' | 'meaning' | 'dictation'

/**
 * Bộ bài luyện tập cho 1 từ đang ôn: chọn nghĩa → ghép câu ví dụ → ghép nghĩa
 * câu → nghe-viết. Từ chưa có câu ví dụ / nghĩa câu thì bỏ bài tương ứng.
 * Xong hết thì báo tổng số lần sai lên cha (cha gọi API +1 lần luyện tập).
 * Được quay lại bài đã qua để làm lại (không tính lỗi — lỗi chỉ tính ở lần đầu
 * làm bài), rồi tiến tới tối đa bài xa nhất đã mở, không nhảy cóc bài chưa làm.
 */
export function PracticeSession({
  vocab,
  submitting,
  onComplete,
}: {
  vocab: DueVocabulary
  submitting: boolean
  onComplete: (mistakes: number) => void
}) {
  const t = useTranslation()
  const steps = useMemo<Step[]>(() => {
    const list: Step[] = []
    if (vocab.choices.length > 1) list.push('choice')
    // Câu tách ra dưới 2 mảnh thì không có gì để ghép — bỏ bài đó
    const sentenceOk = tokenize(vocab.example, vocab.language_id).length >= 2
    if (sentenceOk) list.push('sentence')
    if (sentenceOk && tokenize(vocab.example_meaning, 'vi').length >= 2) list.push('meaning')
    list.push('dictation')
    return list
  }, [vocab])
  const [stepIndex, setStepIndex] = useState(0)
  // Bài xa nhất đã mở (chưa qua) — các bài có index nhỏ hơn đều đã qua
  const [maxStep, setMaxStep] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const step = steps[stepIndex]
  const revisiting = stepIndex < maxStep

  const addMistake = () => {
    if (!revisiting) setMistakes((m) => m + 1)
  }
  const goTo = (i: number) => {
    if (i >= 0 && i <= maxStep) setStepIndex(i)
  }
  const next = () => {
    if (stepIndex + 1 < steps.length) {
      setStepIndex(stepIndex + 1)
      setMaxStep((m) => Math.max(m, stepIndex + 1))
    } else onComplete(mistakes)
  }

  const titles: Record<Step, string> = {
    choice: t.practice.chooseMeaningTitle,
    sentence: t.practice.buildSentenceTitle,
    meaning: t.practice.buildMeaningTitle,
    dictation: t.practice.dictationTitle,
  }
  const exerciseProps = { onMistake: addMistake, onDone: next }

  return (
    <Card className="flex w-full flex-col gap-5">
      <div className="flex items-center justify-between gap-2 text-xs font-semibold">
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700 ring-1 ring-inset ring-indigo-200">
          {t.practice.stepOf(stepIndex + 1, steps.length)}
        </span>
        <span className="text-slate-500">
          {t.practice.practiceCount(vocab.practice_count)} · {t.practice.mistakesLabel(mistakes)}
        </span>
      </div>
      <div className="flex gap-1.5">
        {steps.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => goTo(i)}
            disabled={i > maxStep || i === stepIndex}
            aria-label={titles[s]}
            aria-current={i === stepIndex ? 'step' : undefined}
            className={cn(
              'h-2 flex-1 rounded-full transition disabled:cursor-default',
              i === stepIndex ? 'bg-indigo-600' : i < maxStep ? 'bg-emerald-400 hover:bg-emerald-500' : i === maxStep ? 'bg-indigo-300 hover:bg-indigo-400' : 'bg-slate-200',
            )}
          />
        ))}
      </div>
      {(stepIndex > 0 || revisiting) && (
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => goTo(stepIndex - 1)} disabled={stepIndex === 0}>
            {t.practice.prevStepBtn}
          </Button>
          {revisiting && (
            <>
              <span className="text-center text-xs text-amber-600">{t.practice.revisitHint}</span>
              <Button variant="ghost" size="sm" onClick={() => goTo(stepIndex + 1)}>
                {t.practice.nextStepBtn}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Bài nghe-viết KHÔNG hiện từ — phải nghe để viết */}
      {step !== 'dictation' && (
        <div className="flex flex-col items-center gap-1 text-center">
          {vocab.image_url ? (
            <img src={resolveMediaUrl(vocab.image_url)} alt={vocab.term} className="h-28 w-28 rounded-2xl object-cover" />
          ) : (
            vocab.image_emoji && <span className="text-6xl leading-none">{vocab.image_emoji}</span>
          )}
          <h2 className="break-words text-3xl font-bold text-slate-900 sm:text-4xl">{vocab.term}</h2>
          {(vocab.phonetic || vocab.part_of_speech) && (
            <p className="flex items-center gap-2 text-slate-500">
              {vocab.phonetic && <span>/{vocab.phonetic}/</span>}
              <PartOfSpeechBadge value={vocab.part_of_speech} />
            </p>
          )}
          <AudioButton src={vocab.audio_url || undefined} text={vocab.term} languageId={vocab.language_id} />
        </div>
      )}

      <h3 className="text-center text-lg font-semibold text-slate-800">{titles[step]}</h3>

      {/* Gợi ý câu đối ứng: ghép câu → hiện nghĩa tiếng Việt; ghép nghĩa → hiện câu gốc */}
      {step === 'sentence' && vocab.example_meaning && (
        <p className="text-center text-slate-600">
          {t.practice.buildSentenceHint} <span className="font-semibold text-slate-900">{vocab.example_meaning}</span>
        </p>
      )}
      {step === 'meaning' && (
        <p className="text-center text-slate-600">
          {t.practice.buildMeaningHint} <span className="font-semibold text-slate-900">{vocab.example}</span>
        </p>
      )}

      {/* key theo bài + từ để state (mảnh đã chọn, đáp án sai...) reset khi chuyển bài */}
      <div key={`${vocab.vocabulary_id}-${step}`}>
        {step === 'choice' && <ChoiceExercise choices={vocab.choices} answer={vocab.meaning} {...exerciseProps} />}
        {step === 'sentence' && <WordOrderExercise target={vocab.example} tokenLanguage={vocab.language_id} {...exerciseProps} />}
        {step === 'meaning' && <WordOrderExercise target={vocab.example_meaning} tokenLanguage="vi" {...exerciseProps} />}
        {step === 'dictation' && (
          <DictationExercise term={vocab.term} phonetic={vocab.phonetic} languageId={vocab.language_id} {...exerciseProps} />
        )}
      </div>

      {submitting && <p className="text-center text-sm text-slate-500">{t.practice.saving}</p>}
    </Card>
  )
}
