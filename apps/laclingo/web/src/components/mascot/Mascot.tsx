import { cn } from '@/lib/utils'

export type MascotMood = 'idle' | 'happy' | 'sad' | 'cheer'

const faces: Record<MascotMood, { emoji: string; label: string }> = {
  idle: { emoji: '🦩', label: 'Chim Lạc' },
  happy: { emoji: '🦩✨', label: 'Chim Lạc vui vẻ' },
  sad: { emoji: '🦩💧', label: 'Chim Lạc buồn' },
  cheer: { emoji: '🦩🎉', label: 'Chim Lạc ăn mừng' },
}

/** Linh vật Chim Lạc — đổi biểu cảm theo kết quả trả lời */
export function Mascot({ mood = 'idle', message, className }: { mood?: MascotMood; message?: string; className?: string }) {
  const face = faces[mood]
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span role="img" aria-label={face.label} className="text-4xl sm:text-5xl">
        {face.emoji}
      </span>
      {message && (
        <p className="animate-pop-in rounded-2xl rounded-bl-none bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
          {message}
        </p>
      )}
    </div>
  )
}
