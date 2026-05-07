'use client'

import { useState } from 'react'
import { FormatTabBar } from '@/components/explore/format-tab-bar'
import { CopyButton } from '@/components/explore/copy-button'

type Format = 'framer' | 'webflow' | 'html' | 'jsx' | 'tsx'

interface FormatContentWrapperProps {
  formats: Format[]
  compiledFormats: Record<Format, string>
}

export function FormatContentWrapper({ formats, compiledFormats }: FormatContentWrapperProps) {
  const [activeFormat, setActiveFormat] = useState<Format>(formats[0])

  const rawSource = compiledFormats[activeFormat]

  return (
    <div className="flex flex-col gap-4">
      <FormatTabBar
        formats={formats}
        activeFormat={activeFormat}
        onFormatChange={setActiveFormat}
        tabPanelId="code-panel"
      />

      <div
        id="code-panel"
        role="tabpanel"
        aria-label={`Kode ${activeFormat.toUpperCase()}`}
        className="relative"
      >
        {rawSource != null ? (
          <div className="relative rounded-xl border border-neutral-200 bg-neutral-950 overflow-x-auto text-sm font-mono leading-[1.6]">
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={rawSource} />
            </div>
            <pre className="p-6 pr-14 text-neutral-200 whitespace-pre-wrap break-words">
              <code>{rawSource}</code>
            </pre>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
            Format file not found.
          </div>
        )}
      </div>
    </div>
  )
}
