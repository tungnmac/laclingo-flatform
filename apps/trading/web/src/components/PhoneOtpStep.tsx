'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { FormError, inputClass, SubmitButton } from './AuthForm'

const RESEND_SECONDS = 60

/** Bước 2: nhập mã OTP vừa gửi về `phone` — gửi lại sau 60 giây, hoặc quay lại sửa thông tin */
export function PhoneOtpStep({
  phone,
  mock,
  error,
  loading,
  submitLabel,
  onSubmit,
  onResend,
  onBack,
}: {
  phone: string
  mock: boolean
  error: unknown
  loading: boolean
  submitLabel: string
  onSubmit: (code: string) => void
  onResend: () => Promise<boolean> // true = đã gửi lại
  onBack: () => void
}) {
  const { t } = useT()
  const [wait, setWait] = useState(RESEND_SECONDS)
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
      <p className="text-sm text-slate-600">{t('auth.otpSent', { phone })}</p>
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
          onClick={() => onResend().then((sent) => sent && setWait(RESEND_SECONDS))}
          className="font-semibold text-emerald-700 hover:underline disabled:font-normal disabled:text-slate-400 disabled:no-underline"
        >
          {wait > 0 ? t('auth.otpResendIn', { seconds: wait }) : t('auth.otpResend')}
        </button>
      </div>
    </form>
  )
}
