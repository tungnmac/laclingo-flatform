'use client'

import { Button } from '@/components/ui/Button'

export function ReadyToggle({ ready, onToggle }: { ready: boolean; onToggle: (ready: boolean) => void }) {
  return (
    <Button variant={ready ? 'secondary' : 'primary'} size="lg" className="w-full" onClick={() => onToggle(!ready)}>
      {ready ? '✅ Đã sẵn sàng — bấm để hủy' : 'Sẵn sàng'}
    </Button>
  )
}
