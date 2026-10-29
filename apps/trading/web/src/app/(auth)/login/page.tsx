import { AuthForm } from '@/components/AuthForm'
import { SavedAccounts } from '@/components/SavedAccounts'

/** ?add=1: đang đăng nhập và muốn thêm tài khoản khác (giữ tài khoản hiện tại để chuyển qua lại) */
export default async function LoginPage(props: { searchParams: Promise<{ next?: string; add?: string }> }) {
  const searchParams = await props.searchParams
  return (
    <>
      {searchParams.add !== '1' && <SavedAccounts next={searchParams.next} />}
      <AuthForm mode="login" next={searchParams.next} adding={searchParams.add === '1'} />
    </>
  )
}
