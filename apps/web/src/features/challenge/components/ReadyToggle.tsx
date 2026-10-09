'use client'

import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'

export function ReadyToggle({ ready, onToggle }: { ready: boolean; onToggle: (ready: boolean) => void }) {
  const t = useTranslation()
  return (
    <Button variant={ready ? 'secondary' : 'primary'} size="lg" className="w-full" onClick={() => onToggle(!ready)}>
      {ready ? t.challenges.readyToggleOn : t.challenges.readyToggleOff}
    </Button>
  )
}
