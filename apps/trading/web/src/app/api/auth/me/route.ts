import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'

export const dynamic = 'force-dynamic'
// tài khoản chưa bổ sung hồ sơ vẫn đọc được — client cần needs_profile để chuyển sang /complete-profile
export const GET = handleRoute(async () => NextResponse.json(await requireUser({ allowIncompleteProfile: true })))
