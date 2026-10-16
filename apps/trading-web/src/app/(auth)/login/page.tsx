import { AuthForm } from '@/components/AuthForm'

export default async function LoginPage(props: { searchParams: Promise<{ next?: string }> }) {
  const searchParams = await props.searchParams
  return <AuthForm mode="login" next={searchParams.next} />
}
