import { and, count, desc, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '../db/client'
import { notifications } from '../db/schema'
import type { Tx } from '../trading/account-service'

/** Số thập phân dạng chuỗi (như API trading) — client tự định dạng */
export type NotificationData =
  | { kind: 'order_filled'; symbol: string; side: 'buy' | 'sell'; type: string; qty: string; price: string; realized_pnl: string }
  | { kind: 'liquidation'; symbol: string; qty: string; price: string; realized_pnl: string }
  | { kind: 'contest_result'; slug: string; title_vi: string; title_en: string; rank: number | null; total: number }

export interface NotificationDto {
  id: string
  data: NotificationData
  read: boolean
  created_at: string
}

export interface NotificationsDto {
  items: NotificationDto[]
  unread: number
}

const LIST_SIZE = 30

/**
 * Ghi thông báo — gọi trong transaction của sự kiện để thông báo và kết quả cùng commit / cùng huỷ.
 * `createdAt` = lúc sự kiện xảy ra (vd lệnh khớp lúc offline, quyết toán sau) — mặc định là bây giờ.
 */
export async function notify(ex: Tx | typeof db, rows: { userId: string; data: NotificationData; createdAt?: Date }[]): Promise<void> {
  if (rows.length === 0) return
  await ex.insert(notifications).values(rows.map((r) => ({ userId: r.userId, kind: r.data.kind, data: r.data, createdAt: r.createdAt })))
}

export async function listNotifications(userId: string): Promise<NotificationsDto> {
  const rows = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(LIST_SIZE)
  const [{ n }] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
  return {
    items: rows.map((r) => ({ id: r.id, data: r.data as NotificationData, read: r.readAt !== null, created_at: r.createdAt.toISOString() })),
    unread: n,
  }
}

/** Chỉ đánh dấu các thông báo người dùng đã thấy trong danh sách — mục mới tới sau lần tải cuối vẫn là "chưa đọc" */
export async function markRead(userId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), inArray(notifications.id, ids), isNull(notifications.readAt)))
}
