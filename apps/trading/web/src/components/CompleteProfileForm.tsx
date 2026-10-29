'use client'

import { useState, type FormEvent } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api, ApiError } from '@/lib/api'
import { normalizePhone } from '@/lib/phone'
import { usePhoneOtp } from '@/lib/phone-otp-client'
import type { PhoneOtpConfig } from '@/server/auth/types'
import { FormError, inputClass, SubmitButton } from './AuthForm'
import { PhoneOtpStep } from './PhoneOtpStep'

const labelClass = 'block text-sm font-medium text-slate-700'

/** Tài khoản cũ: bổ sung tên đăng nhập và/hoặc số điện thoại (xác thực OTP) trước khi dùng tiếp */
export function CompleteProfileForm({
  needUsername,
  needPhone,
  otp,
}: {
  needUsername: boolean
  needPhone: boolean
  otp: PhoneOtpConfig
}) {
  const { t } = useT()
  const { recaptcha, send, confirm } = usePhoneOtp(otp)
  const [draft, setDraft] = useState<{ username?: string; phone?: string } | null>(null)
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

  const save = async (body: { username?: string; phone?: string; phone_token?: string }) => {
    await api('/api/auth/profile', { method: 'POST', body: JSON.stringify(body) })
    window.location.assign('/')
  }

  const submitInfo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const username = needUsername ? String(form.get('username') ?? '').trim().toLowerCase() : undefined
    const phone = needPhone ? normalizePhone(String(form.get('phone') ?? '')) : undefined
    if (phone === null) return setError(new ApiError('invalid phone', 0, 'INVALID_PHONE'))
    void run(async () => {
      await api('/api/auth/availability', { method: 'POST', body: JSON.stringify({ username, phone }) })
      if (!phone) return save({ username })
      await send(phone)
      setDraft({ username, phone })
      setStep('otp')
    })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('auth.completeTitle')}</h1>
      <p className="text-sm text-slate-500">{t('auth.completeHint')}</p>
      <form onSubmit={submitInfo} className={step === 'info' ? 'space-y-4' : 'hidden'}>
        {needUsername && (
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
        )}
        {needPhone && (
          <label className={labelClass}>
            {t('auth.phone')}
            <input name="phone" type="tel" required autoComplete="tel" placeholder="0912 345 678" className={inputClass} />
            <span className="mt-1 block text-xs font-normal text-slate-500">{t('auth.phoneHint')}</span>
          </label>
        )}
        {step === 'info' && <FormError error={error} />}
        <SubmitButton loading={loading}>{t(needPhone ? 'auth.sendOtp' : 'common.save')}</SubmitButton>
      </form>
      {step === 'otp' && draft?.phone && (
        <PhoneOtpStep
          phone={draft.phone}
          mock={otp?.provider === 'mock'}
          error={error}
          loading={loading}
          submitLabel={t('auth.completeSubmit')}
          onSubmit={(code) => void run(async () => save({ ...draft, phone_token: await confirm(code) }))}
          onResend={() => run(() => send(draft.phone!))}
          onBack={() => {
            setError(null)
            setStep('info')
          }}
        />
      )}
      <div ref={recaptcha} />
      <button
        type="button"
        disabled={loading}
        onClick={() => void run(async () => (await api('/api/auth/logout', { method: 'POST' }), window.location.assign('/login')))}
        className="w-full text-center text-sm text-slate-500 hover:underline"
      >
        {t('nav.logout')}
      </button>
    </div>
  )
}
