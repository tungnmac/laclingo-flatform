import { RegisterForm } from '@/components/RegisterForm'
import { phoneOtpConfig } from '@/server/auth/phone-otp'

export const dynamic = 'force-dynamic' // cấu hình OTP đọc từ env lúc chạy, không phải lúc build

export default async function RegisterPage(props: { searchParams: Promise<{ next?: string }> }) {
  const searchParams = await props.searchParams
  return <RegisterForm next={searchParams.next} otp={phoneOtpConfig()} />
}
