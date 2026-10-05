'use client'

import type { ExerciseType } from '@/api/exerciseApi'

interface Props {
  type: ExerciseType
  onClick: () => void
}

export function ExerciseTypeCard({ type, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
    >
      <div className="text-4xl mb-2">{type.icon}</div>
      <h3 className="font-semibold">{type.name}</h3>
      <p className="text-gray-600 text-sm">{type.description}</p>
    </div>
  )
}
