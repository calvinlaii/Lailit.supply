import type { Metadata } from 'next'
import { SignUp } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Daftar — lailit.supply',
  description: 'Buat akun lailit.supply baru.',
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-20">
      <SignUp />
    </div>
  )
}
