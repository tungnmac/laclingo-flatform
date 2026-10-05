'use client'

import { useExerciseTypes } from '@/hooks/useExerciseTypes'
import { ExerciseTypeCard } from './ExerciseTypeCard'

interface ExerciseHubProps {
  onSelect?: (typeId: string) => void
}

export function ExerciseHub({ onSelect }: ExerciseHubProps) {
  const { data: types, loading } = useExerciseTypes()

  if (loading) return <div>Loading...</div>

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {types?.map(type => (
        <ExerciseTypeCard
          key={type.id}
          type={type}
          onClick={() => onSelect?.(type.id)}
        />
      ))}
    </div>
  )
}
