import type { ComponentType } from 'react'

type CodeBlockProps = {
  Content: ComponentType
  className?: string
}

export function CodeBlock({ Content, className }: CodeBlockProps) {
  return (
    <div
      className={`relative rounded-xl border border-neutral-200 bg-neutral-950 overflow-x-auto text-sm font-mono leading-[1.6] ${className ?? ''}`}
    >
      <div className="p-6">
        <Content />
      </div>
    </div>
  )
}
