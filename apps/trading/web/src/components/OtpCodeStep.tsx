'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useT } from '@/i18n/I18nProvider'
import type { VerifyConfig } from '@/server/auth/types'
import { FormError, inputClass, SubmitButton } from './AuthForm'

export type VerifyMethod = 'email' | 'phone'

/** Các cách xác thực đang bật, email trước (miễn phí) */
export const enabledMethods = (v: VerifyConfig): VerifyMethod[] => [...(v.email ? ['email' as const] : []), ...(v.phone ? ['phone' as const] : [])]

/** Chọn xác thực qua email hay SĐT — chỉ hiện khi bật cả 2 */
export function VerifyMethodPicker({ methods, value, onChange }: { methods: VerifyMethod[]; value: VerifyMethod; onChange: (m: VerifyMethod) => void }) {
  const { t } = useT()
  if (methods.length < 2) return null
  return (
    <fieldset>
      <legend className="block text-sm font-medium text-slate-700">{t('auth.verifyBy')}</legend>
      <div className="mt-1 flex gap-4">
        {methods.map((m) => (
          <label key={m} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="verify_method"
              checked={value === m}
              onChange={() => onChange(m)}
              className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-600"
            />
            {t(m === 'email' ? 'auth.verifyEmail' : 'auth.verifyPhone')}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/** Bước 2: nhập mã OTP vừa gửi về `target` (email / SĐT) — gửi lại sau `resendSeconds` giây, hoặc quay lại sửa thông tin */
export function OtpCodeStep({
  target,
  mock,
  error,
  loading,
  submitLabel,
  resendSeconds,
  onSubmit,
  onResend,
  onBack,
}: {
  target: string
  mock: boolean
  error: unknown
  loading: boolean
  submitLabel: string
  resendSeconds: number
  onSubmit: (code: string) => void
  onResend: () => Promise<boolean> // true = đã gửi lại
  onBack: () => void
}) {
  const { t } = useT()
  const [wait, setWait] = useState(resendSeconds)
  useEffect(() => {
    if (wait <= 0) return
    const id = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(String(new FormData(e.currentTarget).get('code') ?? '').trim())
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-slate-600">{t('auth.otpSent', { target })}</p>
      {mock && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{t('auth.otpMockHint')}</p>}
      <label className="block text-sm font-medium text-slate-700">
        {t('auth.otpCode')}
        <input
          name="code"
          required
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          autoComplete="one-time-code"
          autoFocus
          className={`${inputClass} tracking-[0.5em]`}
        />
      </label>
      <FormError error={error} />
      <SubmitButton loading={loading}>{submitLabel}</SubmitButton>
      <div className="flex justify-between text-sm">
        <button type="button" onClick={onBack} disabled={loading} className="text-slate-500 hover:underline">
          {t('auth.otpBack')}
        </button>
        <button
          type="button"
          disabled={loading || wait > 0}
          onClick={() => onResend().then((sent) => sent && setWait(resendSeconds))}
          className="font-semibold text-emerald-700 hover:underline disabled:font-normal disabled:text-slate-400 disabled:no-underline"
        >
          {wait > 0 ? t('auth.otpResendIn', { seconds: wait }) : t('auth.otpResend')}
        </button>
      </div>
    </form>
  )
}
