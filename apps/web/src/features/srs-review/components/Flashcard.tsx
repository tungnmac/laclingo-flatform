'use client'

import { AudioButton } from '@/components/audio/AudioButton'
import { cn } from '@/lib/utils'
import type { DueVocabulary } from '@/types/api'

/** Thẻ từ vựng: mặt trước là từ, chạm để lật xem nghĩa */
export function Flashcard({ vocab, flipped, onFlip }: { vocab: DueVocabulary; flipped: boolean; onFlip: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onFlip}
      onKeyDown={(e) => e.key === 'Enter' && onFlip()}
      aria-label={flipped ? 'Mặt sau thẻ, chạm để lật lại' : 'Mặt trước thẻ, chạm để xem nghĩa'}
      className="w-full cursor-pointer select-none focus:outline-none"
    >
      {/* Container với perspective */}
      <div
        className={cn(
          'relative h-72 w-full sm:h-80 [perspective:1000px]',
        )}
      >
        {/* Inner card - xoay để lật */}
        <div
          className={cn(
            'relative h-full w-full [transform-style:preserve-3d] transition-transform duration-500',
            flipped && '[transform:rotateY(180deg)]',
          )}
        >
          {/* Mặt trước - Từ vựng */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl bg-white p-4 shadow-md ring-1 ring-slate-200 [backface-visibility:hidden]">
            {vocab.image_url ? (
              <img
                src={vocab.image_url}
                alt={vocab.term}
                className="h-24 w-full rounded-xl object-cover sm:h-28"
              />
            ) : (
              <div className="flex h-24 w-full items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 sm:h-28">
                <span className="text-4xl sm:text-5xl">📚</span>
              </div>
            )}
            <span className="text-xs font-medium uppercase tracking-widest text-slate-400">Từ vựng</span>
            <h2 className="break-words text-center text-3xl font-bold text-slate-900 sm:text-4xl">{vocab.term}</h2>
            {vocab.phonetic && <p className="text-sm text-slate-500 sm:text-base">/{vocab.phonetic}/</p>}
            <AudioButton src={vocab.audio_url || undefined} text={vocab.term} languageId={vocab.language_id} />
            <p className="mt-auto text-xs text-slate-400">Chạm để xem nghĩa</p>
          </div>

          {/* Mặt sau - Nghĩa */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl bg-indigo-600 p-4 text-white shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {vocab.image_url && (
              <img
                src={vocab.image_url}
                alt={vocab.term}
                className="h-24 w-full rounded-xl object-cover opacity-80 sm:h-28"
              />
            )}
            <span className="text-xs font-medium uppercase tracking-widest text-indigo-200">Nghĩa</span>
            <p className="break-words text-center text-2xl font-semibold sm:text-3xl">{vocab.meaning}</p>
            <p className="text-sm text-indigo-200">{vocab.term}</p>
            {vocab.example && (
              <p className="mt-1 text-center text-xs italic text-indigo-200 sm:text-sm">
                Ví dụ: {vocab.example}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
