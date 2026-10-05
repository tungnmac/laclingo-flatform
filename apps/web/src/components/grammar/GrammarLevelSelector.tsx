'use client'

import { useState } from 'react'

interface Level {
  level: number
  name: string
  xp: number
  color: string
}

interface Props {
  selectedLevel?: number
  onSelect: (level: number) => void
  disabledLevels?: number[]
  completedLevels?: number[]
}

const LEVELS: Level[] = [
  { level: 1, name: 'Nhận diện', xp: 5, color: 'bg-green-100' },
  { level: 2, name: 'Cơ bản', xp: 10, color: 'bg-blue-100' },
  { level: 3, name: 'Nâng cao', xp: 15, color: 'bg-yellow-100' },
  { level: 4, name: 'Áp dụng', xp: 25, color: 'bg-purple-100' },
]

export function GrammarLevelSelector({
  selectedLevel,
  onSelect,
  disabledLevels = [],
  completedLevels = [],
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {LEVELS.map((level) => {
        const isSelected = selectedLevel === level.level
        const isDisabled = disabledLevels.includes(level.level)
        const isCompleted = completedLevels.includes(level.level)

        return (
          <button
            key={level.level}
            onClick={() => !isDisabled && onSelect(level.level)}
            disabled={isDisabled}
            className={`
              ${level.color} rounded-xl p-4 text-left transition-all
              ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
            `}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xl font-bold">{level.level}</span>
              {isCompleted && <span className="text-green-600">✓</span>}
            </div>
            <div className="font-semibold text-gray-800">{level.name}</div>
            <div className="text-sm text-gray-600">{level.xp} XP</div>
          </button>
        )
      })}
    </div>
  )
}
