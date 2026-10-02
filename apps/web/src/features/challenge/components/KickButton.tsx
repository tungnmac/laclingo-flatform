'use client'

export function KickButton({ onKick }: { onKick: () => void }) {
  return (
    <button
      type="button"
      onClick={onKick}
      aria-label="Mời ra khỏi phòng"
      title="Mời ra khỏi phòng"
      className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
    >
      ✕
    </button>
  )
}
