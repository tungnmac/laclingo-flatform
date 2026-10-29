import { AuthForm } from '@/components/AuthForm'

export default async function RegisterPage(props: { searchParams: Promise<{ next?: string }> }) {
  const searchParams = await props.searchParams
  return <AuthForm mode="register" next={searchParams.next} />
}
