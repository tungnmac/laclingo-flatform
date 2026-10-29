import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { CompleteProfileForm } from '@/components/CompleteProfileForm'
import { phoneOtpConfig } from '@/server/auth/phone-otp'
import { getCurrentUser, needsPhone } from '@/server/auth/require-user'
import { db } from '@/server/db/client'
import { users } from '@/server/db/schema'

export const dynamic = 'force-dynamic'

/** Layout (app) chuyển tài khoản cũ (chưa có tên đăng nhập / số điện thoại đã xác thực) về đây */
export default async function CompleteProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.needs_profile) redirect('/')
  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1)
  if (!row) redirect('/login')
  return <CompleteProfileForm needUsername={!user.username} needPhone={needsPhone(row)} otp={phoneOtpConfig()} />
}
