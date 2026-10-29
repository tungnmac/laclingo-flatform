'use client'

import { useTranslation } from '@/hooks/useTranslation'

export function KickButton({ onKick }: { onKick: () => void }) {
  const t = useTranslation()
  return (
    <button
      type="button"
      onClick={onKick}
      aria-label={t.challenges.kickLabel}
      title={t.challenges.kickLabel}
      className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
    >
      ✕
    </button>
  )
}
