import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ResourceMeta } from '@/lib/content'
import { ThumbnailPlaceholder } from '@/components/explore/thumbnail-placeholder'

type ResourceCardProps = {
  resource: ResourceMeta
  className?: string
}

const CATEGORY_LABELS: Record<string, string> = {
  animation: 'Animation',
  'ui-components': 'UI Components',
  layout: 'Layout',
  interactions: 'Interactions',
}

export function ResourceCard({ resource, className }: ResourceCardProps) {
  const { slug, title, category, is_premium } = resource

  return (
    <article aria-label={title} className={cn('group', className)}>
      <Link
        href={`/explore/${slug}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 rounded-xl"
      >
        <Card className="overflow-hidden ring-1 ring-neutral-200 hover:ring-neutral-950 transition-all duration-150 ease-out border-0 shadow-none rounded-xl">
          <ThumbnailPlaceholder category={category} title={title} />
          <CardHeader className="px-4 pt-3 pb-0">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-sm font-semibold leading-[1.45] text-neutral-950 line-clamp-2">
                {title}
              </CardTitle>
              <div className="shrink-0 ml-2">
                {is_premium ? (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Lock className="w-3 h-3" aria-hidden="true" />
                    Premium
                  </Badge>
                ) : (
                  <Badge className="text-xs bg-neutral-950 text-white hover:bg-neutral-950">
                    Gratis
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <p className="text-sm font-normal leading-[1.45] text-neutral-500">
              {CATEGORY_LABELS[category] ?? category}
            </p>
          </CardContent>
        </Card>
      </Link>
    </article>
  )
}
