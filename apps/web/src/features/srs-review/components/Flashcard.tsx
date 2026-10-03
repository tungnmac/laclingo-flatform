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
      className="w-full cursor-pointer select-none [perspective:1200px] focus:outline-none"
    >
      <div
        className={cn(
          'relative h-64 w-full transition-transform duration-500 [transform-style:preserve-3d] sm:h-80',
          flipped && '[transform:rotateY(180deg)]',
        )}
      >
        {/* Mặt trước */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-200 [backface-visibility:hidden]">
          <span className="text-xs font-medium uppercase tracking-widest text-slate-400">Từ vựng</span>
          <h2 className="break-words text-center text-4xl font-bold text-slate-900 sm:text-5xl">{vocab.term}</h2>
          {vocab.phonetic && <p className="text-lg text-slate-500">/{vocab.phonetic}/</p>}
          <AudioButton src={vocab.audio_url || undefined} text={vocab.term} languageId={vocab.language_id} />
          <p className="absolute bottom-4 text-xs text-slate-400">Chạm thẻ hoặc nhấn Space để lật</p>
        </div>

        {/* Mặt sau */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-indigo-600 p-6 text-white shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="text-xs font-medium uppercase tracking-widest text-indigo-200">Nghĩa</span>
          <p className="break-words text-center text-2xl font-semibold sm:text-3xl">{vocab.meaning}</p>
          <p className="text-sm text-indigo-200">{vocab.term}</p>
        </div>
      </div>
    </div>
  )
}
