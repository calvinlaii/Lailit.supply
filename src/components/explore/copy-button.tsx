'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type CopyButtonProps = {
  text: string
  className?: string
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard not available (e.g., non-HTTPS dev)
    }
  }

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Tersalin' : 'Salin kode'}
      className={cn(
        'inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950',
        copied
          ? 'bg-neutral-800 text-white cursor-default'
          : 'bg-neutral-900 text-white hover:bg-neutral-700 active:bg-neutral-800',
        className
      )}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" aria-hidden="true" />
      ) : (
        <Copy className="w-4 h-4" aria-hidden="true" />
      )}
      <span className="sr-only">{copied ? 'Tersalin' : 'Salin'}</span>
    </button>
  )
}
