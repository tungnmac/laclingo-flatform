'use client'

import { useEffect, useRef } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { useTranslation } from '@/hooks/useTranslation'
import { SPEECH_ERROR_EVENT } from '@/lib/speech'

const TOAST_COOLDOWN_MS = 8000 // đọc tự động lỗi liên tục thì không hiện thông báo dồn dập

/** Hiện thông báo khi trình duyệt không phát được giọng đọc (xem speakText) — kèm mã lỗi để báo lại cho đội phát triển */
export function SpeechErrorToaster() {
  const toast = useToast()
  const t = useTranslation()
  const lastShown = useRef(0)

  useEffect(() => {
    const onError = (e: Event) => {
      const now = Date.now()
      if (now - lastShown.current < TOAST_COOLDOWN_MS) return
      lastShown.current = now
      toast(t.common.speechError((e as CustomEvent<string>).detail), 'error')
    }
    window.addEventListener(SPEECH_ERROR_EVENT, onError)
    return () => window.removeEventListener(SPEECH_ERROR_EVENT, onError)
  }, [toast, t])

  return null
}
