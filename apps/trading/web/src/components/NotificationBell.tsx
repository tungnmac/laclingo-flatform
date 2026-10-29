'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { notificationText } from '@/lib/notification-text'
import type { NotificationsDto } from '@/server/notifications/notification-service'

/** Tải lại định kỳ khi tab đang mở — lệnh chờ được quyết toán khi trang gọi API giao dịch nên thông báo có thể tới bất cứ lúc nào */
const POLL_MS = 60_000

/** Chuông thông báo trên header: số chưa đọc + danh sách mới nhất. Mở danh sách → đánh dấu đã đọc các mục đang hiện */
export function NotificationBell() {
  const { t, locale } = useT()
  const pathname = usePathname()
  const [data, setData] = useState<NotificationsDto | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  // Tăng mỗi lần mở chuông — bỏ kết quả GET gửi trước đó (về muộn sẽ khôi phục số "chưa đọc" cũ)
  const generation = useRef(0)

  const load = useCallback(() => {
    const gen = generation.current
    api<NotificationsDto>('/api/notifications').then((d) => gen === generation.current && setData(d), () => undefined)
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(() => document.visibilityState === 'visible' && load(), POLL_MS)
    window.addEventListener('focus', load)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', load)
    }
  }, [load, pathname])

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key !== 'Escape') return
        setOpen(false)
        trigger.current?.focus() // Esc → trả focus về nút mở
      } else if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const toggle = () => {
    const next = !open
    setOpen(next)
    // giữ nguyên trạng thái "chưa đọc" trong danh sách đang mở để người dùng còn thấy mục nào mới; chỉ trừ số đếm.
    // Chỉ đánh dấu các mục đang hiện — mục mới tới sau lần tải cuối vẫn "chưa đọc" ở lần tải sau
    const ids = next && data ? data.items.filter((n) => !n.read).map((n) => n.id) : []
    if (ids.length > 0) {
      generation.current++
      setData({ ...data!, unread: Math.max(0, data!.unread - ids.length) })
      api('/api/notifications/read', { method: 'POST', body: JSON.stringify({ ids }) }).catch(() => undefined)
    }
  }

  const unread = data?.unread ?? 0
  const fmtTime = (iso: string) => new Date(iso).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })

  return (
    <div ref={ref} className="relative">
      <button
        ref={trigger}
        onClick={toggle}
        aria-label={unread > 0 ? t('notifications.openUnread', { n: unread }) : t('notifications.open')}
        aria-expanded={open}
        aria-controls="notification-menu"
        className="relative rounded-lg px-2 py-1 text-lg hover:bg-slate-100"
      >
        <span aria-hidden="true">🔔</span>
        {unread > 0 && (
          <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 min-w-[1.1rem] rounded-full bg-rose-600 px-1 text-center text-[0.65rem] font-bold leading-[1.1rem] text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div id="notification-menu" className="absolute right-0 z-20 mt-1 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-white p-2 text-sm shadow-lg ring-1 ring-slate-200">
          <p className="px-2 pb-2 pt-1 font-semibold">{t('notifications.title')}</p>
          {data === null && <p className="px-2 py-1 text-xs text-slate-400">{t('common.loading')}</p>}
          {data?.items.length === 0 && <p className="px-2 py-3 text-xs text-slate-500">{t('notifications.empty')}</p>}
          <ul className="max-h-96 overflow-y-auto">
            {data?.items.map((n) => {
              const { text, href } = notificationText(n.data, t, locale)
              return (
                <li key={n.id}>
                  <Link href={href} onClick={() => setOpen(false)} className={`block rounded-lg px-2 py-2 hover:bg-slate-50 ${n.read ? '' : 'bg-emerald-50'}`}>
                    <span className="block">{text}</span>
                    <span className="block text-xs text-slate-400">{fmtTime(n.created_at)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
