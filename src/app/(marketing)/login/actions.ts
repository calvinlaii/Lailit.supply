'use server'

import { createClient } from '@/lib/supabase/server'

export type LoginActionState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export async function signInWithMagicLink(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = formData.get('email') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: process.env.NEXT_PUBLIC_SITE_URL + '/auth/confirm',
    },
  })

  // Per AUTH-01 decision: unknown email is silently swallowed by Supabase
  // (shouldCreateUser: false returns 400 for unknown emails — we treat it as success)
  // Only surface errors for non-400 failures (network errors, Supabase service errors)
  if (error && error.status !== 400) {
    return { status: 'error', message: 'Ups, ada masalah teknis. Coba lagi.' }
  }

  return { status: 'success' }
}
