'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api, ApiError } from '@/lib/api'
import { normalizePhone } from '@/lib/phone'
import { usePhoneOtp } from '@/lib/phone-otp-client'
import { safeNextPath } from '@/lib/safe-next'
import type { PhoneOtpConfig } from '@/server/auth/types'
import { FormError, inputClass, PasswordField, SubmitButton } from './AuthForm'
import { PhoneOtpStep } from './PhoneOtpStep'

const labelClass = 'block text-sm font-medium text-slate-700'

interface Draft {
  email: string
  username: string
  display_name: string
  password: string
  phone: string // E.164
}

/**
 * Đăng ký 2 bước: (1) điền thông tin → kiểm trùng → gửi OTP về số điện thoại; (2) nhập OTP → tạo tài khoản.
 * Tài khoản chỉ được tạo khi số điện thoại đã xác thực (mỗi số 1 tài khoản).
 */
export function RegisterForm({ next, otp }: { next?: string; otp: PhoneOtpConfig }) {
  const { t } = useT()
  const { recaptcha, send, confirm } = usePhoneOtp(otp)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [step, setStep] = useState<'info' | 'otp'>('info')
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  const run = async (fn: () => Promise<unknown>): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await fn()
      return true
    } catch (err) {
      setError(err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const submitInfo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const phone = normalizePhone(String(form.get('phone') ?? ''))
    if (!phone) return setError(new ApiError('invalid phone', 0, 'INVALID_PHONE'))
    const d: Draft = {
      email: String(form.get('email') ?? '').trim(),
      username: String(form.get('username') ?? '').trim().toLowerCase(),
      display_name: String(form.get('display_name') ?? ''),
      password: String(form.get('password') ?? ''),
      phone,
    }
    void run(async () => {
      // kiểm trùng trước — mỗi SMS đều tốn phí
      await api('/api/auth/availability', { method: 'POST', body: JSON.stringify({ email: d.email, username: d.username, phone: d.phone }) })
      await send(d.phone)
      setDraft(d)
      setStep('otp')
    })
  }

  const submitCode = (code: string) =>
    void run(async () => {
      if (!draft) return
      const phone_token = await confirm(code)
      await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ ...draft, phone_token }) })
      window.location.assign(safeNextPath(next))
    })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('auth.registerTitle')}</h1>
      {/* giữ form bước 1 trong DOM (ẩn) để "Quay lại" không mất dữ liệu đã nhập */}
      <form onSubmit={submitInfo} className={step === 'info' ? 'space-y-4' : 'hidden'}>
        <label className={labelClass}>
          {t('auth.displayName')}
          <input name="display_name" required maxLength={100} className={inputClass} />
        </label>
        <label className={labelClass}>
          {t('auth.username')}
          <input
            name="username"
            required
            minLength={3}
            maxLength={30}
            pattern="[A-Za-z0-9._]{3,30}"
            title={t('auth.usernameHint')}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className={inputClass}
          />
          <span className="mt-1 block text-xs font-normal text-slate-500">{t('auth.usernameHint')}</span>
        </label>
        <label className={labelClass}>
          {t('auth.email')}
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        <label className={labelClass}>
          {t('auth.phone')}
          <input name="phone" type="tel" required autoComplete="tel" placeholder="0912 345 678" className={inputClass} />
          <span className="mt-1 block text-xs font-normal text-slate-500">{t('auth.phoneHint')}</span>
        </label>
        <PasswordField autoComplete="new-password" />
        {step === 'info' && <FormError error={error} />}
        <SubmitButton loading={loading}>{t('auth.sendOtp')}</SubmitButton>
      </form>
      {step === 'otp' && draft && (
        <PhoneOtpStep
          phone={draft.phone}
          mock={otp?.provider === 'mock'}
          error={error}
          loading={loading}
          submitLabel={t('auth.submitRegister')}
          onSubmit={submitCode}
          onResend={() => run(() => send(draft.phone))}
          onBack={() => {
            setError(null)
            setStep('info')
          }}
        />
      )}
      <div ref={recaptcha} />
      <p className="text-center text-sm text-slate-500">
        {t('auth.haveAccount')}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-emerald-700 hover:underline">
          {t('auth.goLogin')}
        </Link>
      </p>
    </div>
  )
}
