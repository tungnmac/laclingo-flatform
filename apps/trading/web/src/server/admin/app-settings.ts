import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { compareVersions } from '../../lib/app-version'
import { db } from '../db/client'
import { appSettings } from '../db/schema'

const VERSION = /^\d{1,4}\.\d{1,4}\.\d{1,4}$/

const version = z.string().trim().regex(VERSION, 'INVALID_VERSION').nullable()

export const mobileAppSchema = z
  .object({
    latest_version: version, // cũ hơn → banner "Có bản mới" (bỏ qua được)
    min_version: version, // cũ hơn → chặn, bắt buộc cập nhật
    update_url: z.string().trim().max(500).refine((s) => /^https:\/\/[^\s]+$/i.test(s), 'INVALID_HTTPS_URL').nullable(), // trang Play / link tải APK
  })
  .refine((v) => !v.latest_version || !v.min_version || compareVersions(v.min_version, v.latest_version) <= 0, { message: 'MIN_ABOVE_LATEST' })
  // màn hình bắt buộc cập nhật phải có nút dẫn tới bản mới
  .refine((v) => !v.min_version || v.update_url, { message: 'UPDATE_URL_REQUIRED' })

export type MobileAppSettings = z.infer<typeof mobileAppSchema>

const KEY = 'mobile_app'
const EMPTY: MobileAppSettings = { latest_version: null, min_version: null, update_url: null }

export async function getMobileAppSettings(): Promise<MobileAppSettings> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, KEY))
  return row ? { ...EMPTY, ...(row.value as Partial<MobileAppSettings>) } : EMPTY
}

export async function setMobileAppSettings(value: MobileAppSettings): Promise<MobileAppSettings> {
  await db
    .insert(appSettings)
    .values({ key: KEY, value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: sql`now()` } })
  return value
}
