'use client'

import { cn } from '@/lib/utils'

type Format = 'framer' | 'webflow' | 'html' | 'jsx' | 'tsx'

const FORMAT_LABELS: Record<Format, string> = {
  framer: 'Framer',
  webflow: 'Webflow',
  html: 'HTML',
  jsx: 'JSX',
  tsx: 'TSX',
}

type FormatTabBarProps = {
  formats: Format[]
  activeFormat: Format
  onFormatChange: (format: Format) => void
  tabPanelId: string
}

export function FormatTabBar({
  formats,
  activeFormat,
  onFormatChange,
  tabPanelId,
}: FormatTabBarProps) {
  return (
    <div
      role="tablist"
      aria-label="Format kode"
      className="flex gap-1 border-b border-neutral-200"
    >
      {formats.map((fmt) => {
        const isActive = activeFormat === fmt
        const tabId = `tab-${fmt}`
        return (
          <button
            key={fmt}
            id={tabId}
            role="tab"
            aria-selected={isActive}
            aria-controls={tabPanelId}
            onClick={() => onFormatChange(fmt)}
            className={cn(
              'px-4 min-h-[44px] text-sm font-semibold transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950',
              isActive
                ? 'text-neutral-950 border-b-2 border-neutral-950 -mb-px'
                : 'text-neutral-500 hover:text-neutral-950'
            )}
          >
            {FORMAT_LABELS[fmt]}
          </button>
        )
      })}
    </div>
  )
}
