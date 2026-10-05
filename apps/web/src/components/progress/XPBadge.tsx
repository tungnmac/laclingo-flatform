export function XPBadge({ xp, level }: { xp: number; level: number }) {
  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 px-4 py-2 rounded-full text-white font-bold">
      <span>⭐</span>
      <span>{xp.toLocaleString()} XP</span>
      <span className="opacity-75">Lv.{level}</span>
    </div>
  )
}
