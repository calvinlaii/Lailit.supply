'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  signInWithMagicLink,
  type LoginActionState,
} from '@/app/(marketing)/login/actions'
import { LoginErrorAlert } from './login-error-alert'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

const initialState: LoginActionState = { status: 'idle' }

export function LoginForm({ errorParam }: { errorParam?: string }) {
  const [email, setEmail] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [state, action, isPending] = useActionState(
    signInWithMagicLink,
    initialState
  )
  const successHeadingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (state.status === 'success') {
      successHeadingRef.current?.focus()
    }
  }, [state.status])

  // Success state — replace form with confirmation message
  if (state.status === 'success') {
    return (
      <div className="w-full max-w-[420px] bg-neutral-50 border border-neutral-200 rounded-[12px] p-8 shadow-[0_1px_2px_rgba(10,10,10,0.04),0_4px_12px_rgba(10,10,10,0.04)] text-center">
        <h2
          ref={successHeadingRef}
          tabIndex={-1}
          className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950 focus:outline-none"
        >
          Cek email kamu
        </h2>
        <p className="mt-3 text-base font-normal leading-[1.5] text-neutral-500 max-w-[320px] mx-auto">
          Kami sudah kirim link masuk ke email kamu. Cek folder spam juga ya.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[420px] bg-neutral-50 border border-neutral-200 rounded-[12px] p-8 shadow-[0_1px_2px_rgba(10,10,10,0.04),0_4px_12px_rgba(10,10,10,0.04)]">
      <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950 text-center">
        Masuk ke lailit.supply
      </h1>
      <p className="mt-2 text-base font-normal leading-[1.5] text-neutral-500 text-center">
        Kami akan kirim link masuk ke emailmu.
      </p>

      {errorParam === 'link-expired' && <LoginErrorAlert />}

      <form
        action={(formData) => {
          if (!email.trim()) {
            setValidationError('Masukkan email kamu dulu.')
            return
          }
          if (!isValidEmail(email)) {
            setValidationError('Format email belum benar. Coba cek lagi.')
            return
          }
          setValidationError(null)
          action(formData)
        }}
        noValidate
        className="mt-8"
      >
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="email"
            className="text-sm font-normal leading-[1.45] text-neutral-950"
          >
            Email
          </Label>
          <Input
            id="email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (validationError) setValidationError(null)
            }}
            placeholder="kamu@email.com"
            autoComplete="email"
            disabled={isPending}
            aria-describedby={validationError ? 'email-error' : undefined}
            aria-invalid={!!validationError}
            className={`h-11 text-base ${
              validationError
                ? 'border-red-600 focus-visible:ring-red-600/15'
                : 'border-neutral-200 hover:border-neutral-300 focus-visible:border-neutral-950'
            }`}
          />
          {validationError && (
            <p
              id="email-error"
              role="alert"
              className="text-sm font-normal leading-[1.45] text-red-600"
            >
              {validationError}
            </p>
          )}
        </div>

        {state.status === 'error' && (
          <p className="mt-3 text-sm font-normal leading-[1.45] text-red-600">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          aria-disabled={isPending}
          className={`mt-4 w-full inline-flex items-center justify-center px-6 py-3 rounded-lg text-base font-semibold transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 ${
            isPending
              ? 'bg-neutral-800 text-white cursor-not-allowed'
              : 'bg-neutral-950 text-white hover:bg-neutral-800 active:bg-neutral-900'
          }`}
        >
          {isPending ? (
            <>
              <Loader2
                size={16}
                className="animate-spin mr-2"
                aria-label="Memuat"
                role="status"
              />
              Mengirim...
            </>
          ) : (
            'Kirim Magic Link'
          )}
        </button>

        <p className="mt-3 text-sm font-normal leading-[1.45] text-neutral-500 text-center">
          Belum punya akun? Magic link akan otomatis bikin akun baru.
        </p>
      </form>
    </div>
  )
}
