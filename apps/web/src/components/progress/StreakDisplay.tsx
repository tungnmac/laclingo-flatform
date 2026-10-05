export function StreakDisplay({ streak }: { streak: number }) {
  return (
    <div className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-full">
      <span className="text-2xl">🔥</span>
      <span className="font-bold text-orange-600">{streak} ngày</span>
    </div>
  )
}
