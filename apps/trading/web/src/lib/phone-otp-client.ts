'use client'

import type { Auth, ConfirmationResult, RecaptchaVerifier } from 'firebase/auth'
import { useCallback, useEffect, useRef } from 'react'
import { MOCK_OTP_CODE, type PhoneOtpConfig } from '@/server/auth/types'
import { ApiError } from './api'

type FirebaseAuthModule = typeof import('firebase/auth')

/** Tải Firebase lúc cần (không làm nặng bundle các trang khác) — 1 app cho cả trang */
async function loadFirebase(config: Extract<PhoneOtpConfig, { provider: 'firebase' }>): Promise<{ auth: Auth; mod: FirebaseAuthModule }> {
  const [{ getApps, initializeApp }, mod] = await Promise.all([import('firebase/app'), import('firebase/auth')])
  const app = getApps()[0] ?? initializeApp({ apiKey: config.apiKey, authDomain: config.authDomain, projectId: config.projectId })
  const auth = mod.getAuth(app)
  auth.useDeviceLanguage() // SMS + reCAPTCHA theo ngôn ngữ trình duyệt
  return { auth, mod }
}

/** Lỗi Firebase → mã lỗi trong từ điển (errors.*) để hiển thị theo ngôn ngữ đang chọn */
function otpError(err: unknown): ApiError {
  const code = (err as { code?: string } | null)?.code ?? ''
  const mapped =
    code === 'auth/invalid-verification-code'
      ? 'OTP_INVALID'
      : code === 'auth/code-expired'
        ? 'OTP_EXPIRED'
        : code === 'auth/invalid-phone-number'
          ? 'INVALID_PHONE'
          : code === 'auth/too-many-requests' || code === 'auth/quota-exceeded'
            ? 'OTP_TOO_MANY'
            : 'OTP_SEND_FAILED'
  return new ApiError(code || 'otp error', 0, mapped)
}

/**
 * Gửi OTP về số điện thoại (E.164) rồi đổi mã người dùng nhập lấy token để server xác thực.
 * `recaptcha` gắn vào 1 thẻ div trống trong form (Firebase dùng reCAPTCHA ẩn chống spam SMS).
 */
export function usePhoneOtp(config: PhoneOtpConfig) {
  const recaptcha = useRef<HTMLDivElement>(null)
  const verifier = useRef<RecaptchaVerifier | null>(null)
  const pending = useRef<{ phone: string; confirmation: ConfirmationResult; auth: Auth; mod: FirebaseAuthModule } | { phone: string; confirmation: null } | null>(null)

  useEffect(() => () => verifier.current?.clear(), []) // rời trang → gỡ widget reCAPTCHA

  const send = useCallback(
    async (phone: string) => {
      if (!config) throw new ApiError('otp disabled', 503, 'OTP_NOT_CONFIGURED')
      if (config.provider === 'mock') {
        pending.current = { phone, confirmation: null }
        return
      }
      const { auth, mod } = await loadFirebase(config)
      verifier.current?.clear() // gửi lại mã → reCAPTCHA mới
      verifier.current = new mod.RecaptchaVerifier(auth, recaptcha.current!, { size: 'invisible' })
      try {
        pending.current = { phone, confirmation: await mod.signInWithPhoneNumber(auth, phone, verifier.current), auth, mod }
      } catch (err) {
        verifier.current.clear()
        verifier.current = null
        throw otpError(err)
      }
    },
    [config],
  )

  const confirm = useCallback(
    async (code: string): Promise<string> => {
      const p = pending.current
      if (!p) throw new ApiError('otp not sent', 0, 'OTP_EXPIRED')
      if (!p.confirmation) {
        if (code !== MOCK_OTP_CODE) throw new ApiError('otp invalid', 0, 'OTP_INVALID')
        return `mock:${p.phone}`
      }
      try {
        const cred = await p.confirmation.confirm(code)
        const token = await cred.user.getIdToken()
        // không giữ phiên Firebase trên trình duyệt — token chỉ dùng 1 lần để server xác thực số điện thoại
        await p.mod.signOut(p.auth).catch(() => undefined)
        return token
      } catch (err) {
        throw otpError(err)
      }
    },
    [],
  )

  return { recaptcha, send, confirm }
}
