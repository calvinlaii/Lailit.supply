import type { Metadata } from 'next'
import { LoginForm } from '@/components/marketing/login-form'

export const metadata: Metadata = {
  title: 'Masuk — lailit.supply',
  description: 'Masuk ke akun lailit.supply kamu dengan magic link.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-20">
      <LoginForm errorParam={error} />
    </div>
  )
}
