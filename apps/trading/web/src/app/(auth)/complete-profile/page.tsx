import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { CompleteProfileForm } from '@/components/CompleteProfileForm'
import { getCurrentUser, needsVerification } from '@/server/auth/require-user'
import { verifyConfig } from '@/server/auth/verification'
import { db } from '@/server/db/client'
import { users } from '@/server/db/schema'

export const dynamic = 'force-dynamic'

/** Layout (app) chuyển tài khoản cũ (thiếu tên đăng nhập / số điện thoại / chưa xác thực) về đây */
export default async function CompleteProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.needs_profile) redirect('/')
  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1)
  if (!row) redirect('/login')
  return (
    <CompleteProfileForm
      email={row.email}
      phone={row.phone}
      needUsername={!row.username}
      needVerify={needsVerification(row)}
      verify={verifyConfig()}
    />
  )
}
