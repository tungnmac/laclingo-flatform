'use client'

import { useCallback, useRef } from 'react'
import type { VerifyMethod } from '@/components/OtpCodeStep'
import type { Verification, VerifyConfig } from '@/server/auth/types'
import { api } from './api'
import { usePhoneOtp } from './phone-otp-client'

/** Gửi + xác nhận OTP qua email (server gửi mã) hoặc SĐT (Firebase) → bằng chứng `Verification` gửi kèm đăng ký / bổ sung hồ sơ */
export function useOtp(config: VerifyConfig) {
  const { recaptcha, send: sendSms, confirm: confirmSms } = usePhoneOtp(config.phone)
  const pending = useRef<{ method: 'email'; challenge: string } | { method: 'phone' } | null>(null)

  const send = useCallback(
    async (method: VerifyMethod, target: string) => {
      if (method === 'email') {
        const { challenge } = await api<{ challenge: string }>('/api/auth/email-otp', { method: 'POST', body: JSON.stringify({ email: target }) })
        pending.current = { method, challenge }
      } else {
        await sendSms(target)
        pending.current = { method }
      }
    },
    [sendSms],
  )

  const confirm = useCallback(
    async (code: string): Promise<Verification> => {
      const p = pending.current
      if (p?.method === 'email') return { method: 'email', challenge: p.challenge, code }
      return { method: 'phone', phone_token: await confirmSms(code) }
    },
    [confirmSms],
  )

  return { recaptcha, send, confirm }
}
