import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'email' | null

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) {
      // Successfully authenticated — redirect to dashboard
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Token missing, expired, or invalid — send back to login with error param
  return NextResponse.redirect(`${origin}/login?error=link-expired`)
}
