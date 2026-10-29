'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { appVersionFromUserAgent, updateNeed } from '@/lib/app-version'
import type { MobileAppSettings } from '@/server/admin/app-settings'

const DISMISS_KEY = 'tradelab_update_dismissed'

/**
 * Chỉ trong app mobile (User-Agent có TradeLabApp/x.y.z): cũ hơn bản tối thiểu → màn hình chặn bắt buộc cập nhật;
 * cũ hơn bản mới nhất → banner bỏ qua được (nhớ theo phiên bản). Trình duyệt thường không gọi API này.
 */
export function AppUpdateNotice() {
  const { t } = useT()
  const [state, setState] = useState<{ need: 'optional' | 'required'; settings: MobileAppSettings } | null>(null)

  useEffect(() => {
    const current = appVersionFromUserAgent(navigator.userAgent)
    if (!current) return
    api<MobileAppSettings>('/api/app-version').then((settings) => {
      const need = updateNeed(current, settings)
      if (need === 'none') return
      let dismissed: string | null = null
      try {
        dismissed = localStorage.getItem(DISMISS_KEY)
      } catch {
        // chặn bộ nhớ trình duyệt → luôn hiện banner
      }
      if (need === 'optional' && dismissed === settings.latest_version) return
      setState({ need, settings })
    }, () => undefined)
  }, [])

  if (!state) return null
  const link = state.settings.update_url && (
    <a href={state.settings.update_url} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
      {t('appUpdate.update')}
    </a>
  )

  if (state.need === 'required') {
    return (
      <div role="alertdialog" aria-modal="true" aria-labelledby="app-update-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-sm space-y-4">
          <p className="text-4xl" aria-hidden="true">📲</p>
          <h1 id="app-update-title" className="text-xl font-bold">
            {t('appUpdate.requiredTitle')}
          </h1>
          <p className="text-sm text-slate-600">{t('appUpdate.requiredBody', { version: state.settings.min_version ?? '' })}</p>
          {link}
        </div>
      </div>
    )
  }

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, state.settings.latest_version ?? '')
    } catch {
      // không lưu được → lần mở sau hiện lại
    }
    setState(null)
  }
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
      <span className="flex-1">{t('appUpdate.optional', { version: state.settings.latest_version ?? '' })}</span>
      {link}
      <button onClick={dismiss} className="rounded-lg px-2 py-1 text-emerald-800 hover:bg-emerald-100">
        {t('appUpdate.later')}
      </button>
    </div>
  )
}
