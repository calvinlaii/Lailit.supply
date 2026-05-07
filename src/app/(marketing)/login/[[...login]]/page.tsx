import type { Metadata } from 'next'
import { SignIn } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Masuk — lailit.supply',
  description: 'Masuk ke akun lailit.supply kamu.',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-20">
      <SignIn />
    </div>
  )
}
