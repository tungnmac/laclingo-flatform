'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api, ApiError } from '@/lib/api'
import { useOtp } from '@/lib/otp-client'
import { normalizePhone } from '@/lib/phone'
import { safeNextPath } from '@/lib/safe-next'
import type { VerifyConfig } from '@/server/auth/types'
import { FormError, inputClass, PasswordField, SubmitButton } from './AuthForm'
import { enabledMethods, OtpCodeStep, VerifyMethodPicker, type VerifyMethod } from './OtpCodeStep'

const labelClass = 'block text-sm font-medium text-slate-700'

interface Draft {
  email: string
  username: string
  display_name: string
  password: string
  phone: string // E.164
}

/**
 * Đăng ký 2 bước: (1) điền thông tin + chọn xác thực qua email hoặc SĐT → kiểm trùng → gửi OTP; (2) nhập OTP → tạo tài khoản.
 * Email / tên đăng nhập / số điện thoại đều không được trùng tài khoản khác.
 */
export function RegisterForm({ next, verify }: { next?: string; verify: VerifyConfig }) {
  const { t } = useT()
  const { recaptcha, send, confirm } = useOtp(verify)
  const methods = enabledMethods(verify)
  const [method, setMethod] = useState<VerifyMethod>(methods[0] ?? 'email')
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

  const target = (d: Draft) => (method === 'email' ? d.email : d.phone)

  const submitInfo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (methods.length === 0) return setError(new ApiError('otp disabled', 503, 'OTP_NOT_CONFIGURED'))
    const form = new FormData(e.currentTarget)
    const phone = normalizePhone(String(form.get('phone') ?? ''))
    if (!phone) return setError(new ApiError('invalid phone', 0, 'INVALID_PHONE'))
    const d: Draft = {
      email: String(form.get('email') ?? '').trim().toLowerCase(),
      username: String(form.get('username') ?? '').trim().toLowerCase(),
      display_name: String(form.get('display_name') ?? ''),
      password: String(form.get('password') ?? ''),
      phone,
    }
    void run(async () => {
      // kiểm trùng trước khi gửi mã
      await api('/api/auth/availability', { method: 'POST', body: JSON.stringify({ email: d.email, username: d.username, phone: d.phone }) })
      await send(method, target(d))
      setDraft(d)
      setStep('otp')
    })
  }

  const submitCode = (code: string) =>
    void run(async () => {
      if (!draft) return
      const verification = await confirm(code)
      await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ ...draft, verification }) })
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
        <VerifyMethodPicker methods={methods} value={method} onChange={setMethod} />
        {step === 'info' && <FormError error={error} />}
        <SubmitButton loading={loading}>{t('auth.sendOtp')}</SubmitButton>
      </form>
      {step === 'otp' && draft && (
        <OtpCodeStep
          target={target(draft)}
          mock={method === 'email' ? !!verify.email?.mock : verify.phone?.provider === 'mock'}
          error={error}
          loading={loading}
          resendSeconds={verify.resendSeconds}
          submitLabel={t('auth.submitRegister')}
          onSubmit={submitCode}
          onResend={() => run(() => send(method, target(draft)))}
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
