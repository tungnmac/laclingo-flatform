'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { Spinner } from '@/components/ui/States'
import { useToast } from '@/components/ui/ToastProvider'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import { useLocale } from '@/store/locale'
import type { AppNotification } from '@/types/api'
import { notificationService } from '../notification.service'
import { useNotificationStore } from '../notificationStore'
import { formatRelativeTime } from '../relativeTime'

/**
 * Chuông thông báo: badge số chưa đọc (làm mới định kỳ ở useUnreadPolling),
 * bấm mở bảng danh sách. variant "sidebar" = nút ngang ở góc dưới sidebar,
 * bảng mở lên trên; "header" = nút icon trên header mobile, bảng thả xuống.
 */
export function NotificationBell({ variant }: { variant: 'sidebar' | 'header' }) {
  const t = useTranslation()
  const unread = useNotificationStore((s) => s.unread)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Đóng khi bấm ra ngoài hoặc nhấn Escape
  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const badge = unread > 0 && (
    <span
      className={cn(
        'flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold leading-none text-white',
        variant === 'header' && 'absolute -right-1 -top-1',
      )}
    >
      {unread > 99 ? '99+' : unread}
    </span>
  )
  const label = unread > 0 ? t.notifications.bellLabelUnread(unread) : t.notifications.bellLabel

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          'transition',
          variant === 'sidebar'
            ? cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium', open ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100')
            : 'relative flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-slate-100',
        )}
      >
        <span className={variant === 'sidebar' ? 'text-lg' : undefined} aria-hidden>
          🔔
        </span>
        {variant === 'sidebar' && <span className="flex-1 text-left">{t.notifications.bellLabel}</span>}
        {badge}
      </button>
      {open && <NotificationPanel variant={variant} onClose={() => setOpen(false)} />}
    </div>
  )
}

function NotificationPanel({ variant, onClose }: { variant: 'sidebar' | 'header'; onClose: () => void }) {
  const t = useTranslation()
  const locale = useLocale((s) => s.locale)
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()
  const setUnread = useNotificationStore((s) => s.setUnread)
  const decrementUnread = useNotificationStore((s) => s.decrementUnread)
  const unread = useNotificationStore((s) => s.unread)
  const [items, setItems] = useState<AppNotification[]>([])
  const [cursor, setCursor] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const fail = useCallback((err: unknown) => toast((err as Error).message, 'error'), [toast])

  useEffect(() => {
    notificationService
      .list()
      .then((page) => {
        setItems(page.items)
        setCursor(page.next_cursor)
        setUnread(page.unread_count)
      })
      .catch(fail)
      .finally(() => setLoading(false))
  }, [fail, setUnread])

  const loadMore = async () => {
    if (!cursor) return
    setLoadingMore(true)
    try {
      const page = await notificationService.list(cursor)
      setItems((prev) => [...prev, ...page.items])
      setCursor(page.next_cursor)
      setUnread(page.unread_count)
    } catch (err) {
      fail(err)
    } finally {
      setLoadingMore(false)
    }
  }

  const markReadLocal = (id: string) => {
    const now = new Date().toISOString()
    setItems((prev) => prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: now } : n)))
  }

  const open = async (n: AppNotification) => {
    if (!n.read_at) {
      markReadLocal(n.id)
      decrementUnread()
      notificationService.markRead(n.id).catch(fail)
    }
    if (n.url) {
      onClose()
      router.push(n.url)
    }
  }

  const remove = async (n: AppNotification) => {
    try {
      await notificationService.remove(n.id)
      setItems((prev) => prev.filter((x) => x.id !== n.id))
      if (!n.read_at) decrementUnread()
    } catch (err) {
      fail(err)
    }
  }

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead()
      const now = new Date().toISOString()
      setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })))
      setUnread(0)
    } catch (err) {
      fail(err)
    }
  }

  const clearAll = async () => {
    if (!(await confirm({ description: t.notifications.clearConfirm, danger: true }))) return
    try {
      await notificationService.clear()
      setItems([])
      setCursor(undefined)
      setUnread(0)
    } catch (err) {
      fail(err)
    }
  }

  return (
    <div
      role="dialog"
      aria-label={t.notifications.title}
      className={cn(
        'z-40 flex max-h-[min(32rem,75vh)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl',
        variant === 'sidebar' ? 'absolute bottom-full left-0 mb-2 w-80' : 'fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80',
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{t.notifications.title}</h2>
        {items.length > 0 && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={markAllRead}
              disabled={unread === 0}
              className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              {t.notifications.markAllRead}
            </button>
            <button type="button" onClick={clearAll} className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100">
              {t.notifications.clearAll}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="py-8">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-400">
            <span className="mb-2 block text-3xl">🔕</span>
            {t.notifications.empty}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((n) => (
              <li key={n.id} className={cn('group relative flex gap-3 px-4 py-3', !n.read_at && 'bg-indigo-50/60')}>
                <button type="button" onClick={() => open(n)} className="flex min-w-0 flex-1 gap-3 text-left">
                  <span className="text-xl leading-6" aria-hidden>
                    {n.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-sm text-slate-900', !n.read_at && 'font-semibold')}>{n.title}</span>
                    {n.body && <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{n.body}</span>}
                    <span className="mt-1 block text-[11px] text-slate-400">
                      {formatRelativeTime(n.created_at, locale) ?? t.notifications.justNow}
                    </span>
                  </span>
                  {!n.read_at && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500" aria-label={t.notifications.unreadDot} />}
                </button>
                <button
                  type="button"
                  onClick={() => remove(n)}
                  aria-label={t.notifications.deleteOne}
                  className="h-6 w-6 shrink-0 rounded-md text-slate-300 hover:bg-slate-100 hover:text-slate-600 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        {cursor && !loading && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full border-t border-slate-100 py-2.5 text-xs font-medium text-indigo-600 hover:bg-slate-50 disabled:text-slate-400"
          >
            {loadingMore ? '…' : t.notifications.loadMore}
          </button>
        )}
      </div>
    </div>
  )
}
