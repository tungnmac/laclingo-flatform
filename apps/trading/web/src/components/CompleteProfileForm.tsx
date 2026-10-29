'use client'

import { useState, type FormEvent } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api, ApiError } from '@/lib/api'
import { useOtp } from '@/lib/otp-client'
import { normalizePhone } from '@/lib/phone'
import type { Verification, VerifyConfig } from '@/server/auth/types'
import { FormError, inputClass, SubmitButton } from './AuthForm'
import { enabledMethods, OtpCodeStep, VerifyMethodPicker, type VerifyMethod } from './OtpCodeStep'

const labelClass = 'block text-sm font-medium text-slate-700'

/** Tài khoản cũ: bổ sung tên đăng nhập / số điện thoại còn thiếu và xác thực qua email hoặc SĐT trước khi dùng tiếp */
export function CompleteProfileForm({
  email,
  phone: savedPhone,
  needUsername,
  needVerify,
  verify,
}: {
  email: string
  phone: string | null
  needUsername: boolean
  needVerify: boolean
  verify: VerifyConfig
}) {
  const { t } = useT()
  const { recaptcha, send, confirm } = useOtp(verify)
  const methods = enabledMethods(verify)
  const [method, setMethod] = useState<VerifyMethod>(methods[0] ?? 'email')
  const [draft, setDraft] = useState<{ username?: string; phone?: string } | null>(null)
  const [step, setStep] = useState<'info' | 'otp'>('info')
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const needPhone = !savedPhone

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

  const save = async (body: { username?: string; phone?: string; verification?: Verification }) => {
    await api('/api/auth/profile', { method: 'POST', body: JSON.stringify(body) })
    window.location.assign('/')
  }

  const target = (d: { phone?: string }) => (method === 'email' ? email : (d.phone ?? savedPhone ?? ''))

  const submitInfo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const username = needUsername ? String(form.get('username') ?? '').trim().toLowerCase() : undefined
    const phone = needPhone ? normalizePhone(String(form.get('phone') ?? '')) : undefined
    if (phone === null) return setError(new ApiError('invalid phone', 0, 'INVALID_PHONE'))
    const d = { username, phone }
    void run(async () => {
      if (username || phone) await api('/api/auth/availability', { method: 'POST', body: JSON.stringify(d) })
      if (!needVerify) return save(d)
      await send(method, target(d))
      setDraft(d)
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
        {needVerify && <VerifyMethodPicker methods={methods} value={method} onChange={setMethod} />}
        {step === 'info' && <FormError error={error} />}
        <SubmitButton loading={loading}>{t(needVerify ? 'auth.sendOtp' : 'common.save')}</SubmitButton>
      </form>
      {step === 'otp' && draft && (
        <OtpCodeStep
          target={target(draft)}
          mock={method === 'email' ? !!verify.email?.mock : verify.phone?.provider === 'mock'}
          error={error}
          loading={loading}
          resendSeconds={verify.resendSeconds}
          submitLabel={t('auth.completeSubmit')}
          onSubmit={(code) => void run(async () => save({ ...draft, verification: await confirm(code) }))}
          onResend={() => run(() => send(method, target(draft)))}
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
