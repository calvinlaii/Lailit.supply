import { cn } from '@/lib/utils'

type ThumbnailPlaceholderProps = {
  category: 'animation' | 'ui-components' | 'layout' | 'interactions'
  title: string
  className?: string
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  animation: 'from-neutral-200 to-neutral-300',
  'ui-components': 'from-neutral-100 to-neutral-200',
  layout: 'from-neutral-200 to-neutral-400',
  interactions: 'from-neutral-100 to-neutral-300',
}

export function ThumbnailPlaceholder({ category, title, className }: ThumbnailPlaceholderProps) {
  const gradient = CATEGORY_GRADIENTS[category] ?? 'from-neutral-100 to-neutral-200'
  return (
    <div
      role="img"
      aria-label={`${title} thumbnail`}
      className={cn(`w-full aspect-video rounded-t-xl bg-gradient-to-br ${gradient}`, className)}
    />
  )
}
