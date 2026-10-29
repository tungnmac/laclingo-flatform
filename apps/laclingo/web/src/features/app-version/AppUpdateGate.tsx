'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'
import { checkAppVersion, type UpdateStatus } from './appVersion'

const SNOOZE_KEY = 'laclingo-update-snooze' // "<phiên bản mới nhất>:<hạn ms>" — "Để sau" nhắc lại sau 1 ngày
const SNOOZE_MS = 24 * 60 * 60 * 1000
const RECHECK_MS = 30 * 60 * 1000 // quay lại app: kiểm tra lại tối đa mỗi 30 phút

function snoozed(version: string): boolean {
  try {
    const [v, until] = (localStorage.getItem(SNOOZE_KEY) ?? '').split(':')
    return v === version && Number(until) > Date.now()
  } catch {
    return false
  }
}

function snooze(version: string) {
  try {
    localStorage.setItem(SNOOZE_KEY, `${version}:${Date.now() + SNOOZE_MS}`)
  } catch {
    // localStorage bị chặn — lần mở sau nhắc lại
  }
}

/**
 * App iOS/Android: dưới phiên bản tối thiểu → màn hình chặn, chỉ có nút cập nhật; dưới phiên bản mới nhất → hộp thoại
 * nhắc (bỏ qua 1 ngày). Kiểm tra lúc mở app và khi quay lại app. Trên web không làm gì. Gắn ở root layout.
 */
export function AppUpdateGate() {
  const t = useTranslation().appVersion
  const [status, setStatus] = useState<UpdateStatus>({ kind: 'ok' })
  const statusRef = useRef(status)
  statusRef.current = status
  const forceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let lastCheck = 0
    const run = () => {
      // Đang bị chặn: quay lại app (vd vừa cập nhật / admin vừa sửa cấu hình) là kiểm tra lại ngay
      if (statusRef.current.kind !== 'force' && Date.now() - lastCheck < RECHECK_MS) return
      lastCheck = Date.now()
      void checkAppVersion().then((s) => setStatus(s.kind === 'soft' && snoozed(s.info.latest_version) ? { kind: 'ok' } : s))
    }
    run()
    const onVisible = () => document.visibilityState === 'visible' && run()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  useEffect(() => {
    if (status.kind === 'force') forceRef.current?.focus()
    if (status.kind !== 'soft') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      snooze(status.info.latest_version)
      setStatus({ kind: 'ok' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [status])

  if (status.kind === 'ok') return null
  const { info } = status
  // Link store ngoài app → Capacitor mở bằng App Store / Google Play (không mở trong WebView)
  const openStore = () => info.store_url && window.location.assign(info.store_url)

  if (status.kind === 'force') {
    return (
      <div
        ref={forceRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="force-update-title"
        className="fixed inset-0 z-[60] flex items-center justify-center bg-indigo-600 px-6 text-center text-white outline-none"
      >
        <div className="max-w-sm">
          <img src="/logo.svg" alt="" className="mx-auto h-20 w-20 rounded-2xl shadow-lg ring-4 ring-white/40" />
          <h2 id="force-update-title" className="mt-6 text-2xl font-bold">
            {t.forceTitle}
          </h2>
          <p className="mt-3 text-indigo-100">{info.message || t.forceBody}</p>
          {info.store_url ? (
            <button
              type="button"
              autoFocus
              onClick={openStore}
              className="mt-8 w-full rounded-xl bg-white px-4 py-3 font-semibold text-indigo-700 shadow hover:bg-indigo-50"
            >
              {t.update}
            </button>
          ) : (
            <p className="mt-8 text-sm text-indigo-100">{t.noStoreLink}</p>
          )}
        </div>
      </div>
    )
  }

  const later = () => {
    snooze(info.latest_version)
    setStatus({ kind: 'ok' })
  }
  return (
    <div role="presentation" className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4" onClick={later}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="soft-update-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
      >
        <p className="text-4xl" aria-hidden>
          🚀
        </p>
        <h3 id="soft-update-title" className="mt-2 text-lg font-bold text-slate-900">
          {t.softTitle}
        </h3>
        <p className="mt-2 text-sm text-slate-600">{info.message || t.softBody(info.latest_version)}</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse sm:justify-center">
          {info.store_url && (
            <Button autoFocus onClick={openStore}>
              {t.update}
            </Button>
          )}
          <Button variant="secondary" onClick={later}>
            {t.later}
          </Button>
        </div>
      </div>
    </div>
  )
}
