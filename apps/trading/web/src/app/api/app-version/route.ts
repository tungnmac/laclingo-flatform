import { NextResponse } from 'next/server'
import { getMobileAppSettings } from '@/server/admin/app-settings'
import { handleRoute } from '@/server/http'

export const dynamic = 'force-dynamic'

/** Công khai (cả trang đăng nhập): app mobile so phiên bản của mình với mốc admin đặt → báo / bắt buộc cập nhật */
export const GET = handleRoute(async () => NextResponse.json(await getMobileAppSettings()))
