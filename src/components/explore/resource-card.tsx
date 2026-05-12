import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { ResourceMeta } from '@/lib/content'
import { ThumbnailPlaceholder } from '@/components/explore/thumbnail-placeholder'

type ResourceCardProps = {
  resource: ResourceMeta
  className?: string
}

const CATEGORY_ICONS: Record<string, string> = {
  animation: '/icons/cat-scroll.svg',
  'ui-components': '/icons/cat-buttons.svg',
  layout: '/icons/view-grid.svg',
  interactions: '/icons/cat-cursor2.svg',
}

export function ResourceCard({ resource, className }: ResourceCardProps) {
  const { slug, title, category, is_premium, thumbnail_key } = resource
  const icon = is_premium ? '/icons/cta-lock.svg' : (CATEGORY_ICONS[category] ?? '/icons/cat-buttons.svg')

  return (
    <article role="listitem" aria-label={title} className={cn('group', className)}>
      <Link
        href={`/explore/${slug}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 rounded-[15px]"
      >
        <div className="relative overflow-hidden rounded-[15px] bg-[#161616] shadow-[0px_0px_0px_1px_rgba(255,255,255,0.06)] group-hover:shadow-[0px_0px_0px_1px_rgba(255,255,255,0.15)] transition-all duration-200 ease-out">
          {/* Thumbnail */}
          <ThumbnailPlaceholder category={category} title={title} thumbnailKey={thumbnail_key} />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

          {/* Floating title bar */}
          <div className="absolute bottom-[11px] left-[11px] right-[11px] flex items-center justify-between gap-2">
            <div className="bg-[#292929] w-[100px] border border-white/[0.1] rounded-[10px] px-[14px] py-[12px] flex-1">
              <span className="text-[13px] font-semibold text-white leading-none line-clamp-1 block">
                {title}
              </span>
            </div>
            <div className="bg-[#292929] border border-white/[0.12] rounded-[12px] w-[38px] h-[38px] flex items-center justify-center shrink-0 p-[9px]">
              <Image src={icon} alt="" width={17} height={17} className="w-full h-full" />
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}
