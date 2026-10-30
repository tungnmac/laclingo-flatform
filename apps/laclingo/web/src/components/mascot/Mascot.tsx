import { cn } from '@/lib/utils'

export type MascotMood = 'idle' | 'happy' | 'sad' | 'cheer'

// Chim Lạc lấy từ logo (public/lac-bird.svg), biểu cảm thể hiện bằng huy hiệu nhỏ cạnh chim
const faces: Record<MascotMood, { badge: string; label: string }> = {
  idle: { badge: '', label: 'Chim Lạc' },
  happy: { badge: '✨', label: 'Chim Lạc vui vẻ' },
  sad: { badge: '💧', label: 'Chim Lạc buồn' },
  cheer: { badge: '🎉', label: 'Chim Lạc ăn mừng' },
}

/** Linh vật Chim Lạc — đổi biểu cảm theo kết quả trả lời */
export function Mascot({ mood = 'idle', message, className }: { mood?: MascotMood; message?: string; className?: string }) {
  const face = faces[mood]
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span role="img" aria-label={face.label} className="relative shrink-0">
        <img src="/lac-bird.svg" alt="" width={130} height={46} className="block h-8 w-auto sm:h-10" />
        {face.badge && <span className="absolute -right-2 -top-3 text-lg sm:text-xl">{face.badge}</span>}
      </span>
      {message && (
        <p className="animate-pop-in rounded-2xl rounded-bl-none bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
          {message}
        </p>
      )}
    </div>
  )
}
