import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import { isPartOfSpeech, PART_OF_SPEECH_ABBR } from '../partOfSpeech'

/** Nhãn từ loại viết tắt (n./v./adj./...) — rê chuột xem tên đầy đủ. Từ chưa phân loại thì không hiện gì. */
export function PartOfSpeechBadge({ value, className }: { value?: string; className?: string }) {
  const t = useTranslation()
  if (!isPartOfSpeech(value)) return null
  const name = t.vocabCard.partOfSpeechNames[value]
  return (
    <abbr
      title={name}
      className={cn('rounded-md bg-violet-50 px-1.5 py-0.5 text-xs font-semibold italic text-violet-700 no-underline ring-1 ring-inset ring-violet-200', className)}
    >
      {PART_OF_SPEECH_ABBR[value]}
    </abbr>
  )
}
