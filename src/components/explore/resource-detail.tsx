'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useUser } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import type { ResourceMeta } from '@/lib/content'
import { ThumbnailPlaceholder } from '@/components/explore/thumbnail-placeholder'
import { useLenisOnRef } from '@/hooks/use-lenis-on-ref'

const FORMAT_META: Record<string, { label: string; icon: string }> = {
  framer:  { label: 'Framer',  icon: '/icons/framer.svg' },
  webflow: { label: 'Webflow', icon: '/icons/webflow.svg' },
  tsx:     { label: 'TSX',     icon: '/icons/react.svg' },
  jsx:     { label: 'JSX',     icon: '/icons/react.svg' },
  html:    { label: 'HTML',    icon: '/icons/html.svg' },
}

const CATEGORY_LABEL: Record<string, string> = {
  animation:     'Animation',
  'ui-components': 'UI Components',
  layout:        'Layout',
  interactions:  'Interactions',
}

type Format = 'framer' | 'webflow' | 'html' | 'jsx' | 'tsx'

type ResourceDetailProps = {
  resource: ResourceMeta
  related: ResourceMeta[]
  formatSources?: Partial<Record<Format, string>>
}

export function ResourceDetail({ resource, related, formatSources }: ResourceDetailProps) {
  const sources = formatSources ?? {}
  const [activeFormat, setActiveFormat] = useState(resource.available_formats[0] ?? 'framer')
  const formats = resource.available_formats
  const { user } = useUser()
  const creatorName = user
    ? (user.firstName ?? user.username ?? user.primaryEmailAddress?.emailAddress ?? 'Calvin')
    : 'Calvin'
  const creatorImage = user?.imageUrl ?? null
  const scrollRef = useRef<HTMLDivElement>(null)
  useLenisOnRef(scrollRef)

  return (
    <div ref={scrollRef} className="flex-1 min-w-0 overflow-y-auto bg-[#161616]">
      <div className="max-w-[1432px] mx-auto px-8">

        {/* ── Header: breadcrumb + title (gap-96 between rows, Figma 37:10278) ── */}
        <div className="flex flex-col gap-24 pt-8 mb-5">

          {/* Row 1: breadcrumb left · search + bookmark right */}
          <div className="flex items-center gap-[7px] min-h-[48px]">
            <Link
              href="/explore"
              className="text-[16px] font-medium text-white/50 hover:text-white/70 transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              Free Compons
            </Link>
            <div className="opacity-60 shrink-0">
              <Image src="/icons/breadcrumb-sep.svg" alt="" width={7} height={19} />
            </div>
            <span className="text-[16px] font-medium text-white/50 truncate min-w-0">
              {resource.title}
            </span>

            {/* right: search + bookmark */}
            <div className="flex-1 flex items-center justify-end gap-1.5 ml-4">
              <div className="bg-[#222] border border-white/[0.1] rounded-[10px] flex items-center gap-3 px-5 py-3.5 max-w-[448px] w-full shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
                <Image src="/icons/search.svg" alt="" width={16} height={16} className="shrink-0 opacity-30" />
                <input
                  type="search"
                  placeholder="Cari komponen"
                  className="flex-1 bg-transparent text-[14px] text-white/80 placeholder:text-white/30 focus:outline-none min-w-0"
                />
                <div className="w-px h-4 bg-white/10 shrink-0" />
                <span className="text-[13px] text-white/40 shrink-0 select-none">Terbaru</span>
              </div>
              <button className="bg-[#222] border border-white/[0.1] flex items-center justify-center h-[51px] w-[48px] rounded-[10px] hover:bg-[#2a2a2a] transition-colors cursor-pointer shrink-0">
                <Image src="/icons/bookmark.svg" alt="Bookmark" width={14} height={14} className="opacity-50" />
              </button>
            </div>
          </div>

          {/* Row 2: title + action buttons */}
          <div className="flex items-center gap-4 min-h-[55px]">
            <h1 className="flex-1 text-[42px] font-normal text-[#f4f4f4] tracking-[-0.03em] leading-[1] min-w-0 truncate">
              {resource.title}
            </h1>
            <div className="flex items-center gap-1.5 shrink-0">
              {resource.demo_url && (
                <a
                  href={resource.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1a1a1a] flex items-center gap-1 h-8 px-3 rounded-[4px] text-[15px] text-[#e1e1e1] tracking-[-0.01em] hover:bg-[#252525] transition-colors duration-150"
                >
                  Live Preview
                </a>
              )}
              <button className="bg-[#1a1a1a] flex items-center justify-center w-8 h-8 rounded-[4px] hover:bg-[#252525] transition-colors duration-150 cursor-pointer">
                <Image src="/icons/share.svg" alt="Share" width={19} height={19} />
              </button>
              <button className="bg-[#1a1a1a] flex items-center justify-center w-8 h-8 rounded-[4px] hover:bg-[#252525] transition-colors duration-150 cursor-pointer">
                <Image src="/icons/bookmark.svg" alt="Bookmark" width={19} height={19} className="opacity-70" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Preview area ── */}
        <div className="bg-[#1a1a1a] rounded-[15px] p-2 mb-5">
          <div className="bg-[#151313] rounded-[6px] overflow-hidden" style={{ height: '480px' }}>
            <ThumbnailPlaceholder
              category={resource.category}
              title={resource.title}
              thumbnailKey={resource.thumbnail_key}
              className="w-full h-full aspect-auto"
            />
          </div>
        </div>

        {/* ── Description + Resource details ── */}
        <div className="flex gap-5 mb-5">
          {/* Description */}
          <div className="bg-[#1a1a1a] flex-1 flex flex-col gap-4 p-[15px] rounded-[15px] min-w-0">
            <p className="text-[24px] font-normal text-[#f4f4f4] tracking-[-0.01em] leading-none">
              Description
            </p>
            <div className="h-px bg-white/[0.12]" />
            <p className="text-[16px] text-[#898989] tracking-[-0.01em] leading-relaxed">
              {resource.description
                ? resource.description
                : `${resource.title} — komponen siap pakai untuk proyek Anda. Tersedia dalam ${formats.map((f) => FORMAT_META[f]?.label ?? f).join(', ')}.`}
            </p>
          </div>

          {/* Resource details */}
          <div className="bg-[#1a1a1a] flex-1 flex flex-col gap-2.5 p-[15px] rounded-[15px] min-w-0">
            <div className="flex flex-col gap-1">
              <p className="text-[24px] font-normal text-[#f4f4f4] tracking-[-0.01em] leading-none">
                Resource details
              </p>
              <p className="text-[10px] text-[#838383] tracking-[-0.01em]">
                View information and actions for this resource.
              </p>
            </div>
            <div className="h-px bg-white/[0.12]" />
            <div className="flex flex-col gap-3 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#817f7f] tracking-[-0.01em]">Creator</span>
                <Link
                  href="/"
                  className="text-[13px] text-white tracking-[-0.01em] hover:text-white/70 transition-colors flex items-center gap-1.5"
                >
                  {creatorImage ? (
                    <img src={creatorImage} alt={creatorName} className="w-4 h-4 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold text-white leading-none">
                        {creatorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {creatorName}
                  <Image src="/icons/arrow-right-sm.svg" alt="" width={8} height={16} />
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#817f7f] tracking-[-0.01em]">Published</span>
                <span className="text-[13px] text-[#817f7f] tracking-[-0.01em]">
                  {resource.published_at ?? 'May 2026'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#817f7f] tracking-[-0.01em]">Category</span>
                <Link
                  href={`/explore?category=${resource.category}`}
                  className="text-[13px] text-white tracking-[-0.01em] hover:text-white/70 transition-colors flex items-center gap-1"
                >
                  {CATEGORY_LABEL[resource.category] ?? resource.category}
                  <Image src="/icons/arrow-right-sm.svg" alt="" width={8} height={16} />
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#817f7f] tracking-[-0.01em]">Need help?</span>
                <span className="text-[13px] text-[#817f7f] tracking-[-0.01em]">Join Slack</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick actions (tags) ── */}
        {resource.tags.length > 0 && (
          <div className="bg-[#1a1a1a] flex flex-col gap-2.5 p-[15px] rounded-[15px] mb-5">
            <p className="text-[24px] font-normal text-[#f4f4f4] tracking-[-0.01em] leading-none">
              Quick actions
            </p>
            <div className="flex flex-wrap gap-1">
              {resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center h-[22px] px-2 rounded-[5px] bg-white/[0.06] text-[12px] text-white tracking-[-0.01em]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Format tabs ── */}
        {formats.length > 0 && (
          <div className="bg-[#1a1a1a] flex items-center p-1 rounded-[8px] mb-5">
            {formats.map((fmt) => {
              const meta = FORMAT_META[fmt]
              const isActive = activeFormat === fmt
              return (
                <button
                  key={fmt}
                  onClick={() => setActiveFormat(fmt)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 h-12 rounded-[4px] transition-colors duration-150 cursor-pointer',
                    isActive ? 'bg-[#151313]' : 'opacity-40 hover:opacity-70',
                  )}
                >
                  {meta && (
                    <Image src={meta.icon} alt="" width={22} height={22} className="shrink-0" />
                  )}
                  <span className="text-[15px] text-[#f4f4f4] tracking-[-0.01em]">
                    {meta?.label ?? fmt.toUpperCase()}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* ── Code section ── */}
        {resource.is_premium ? (
          <div className="bg-[#1a1a1a] rounded-[15px] mb-5 p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center">
              <Image src="/icons/cta-lock.svg" alt="" width={16} height={16} />
            </div>
            <p className="text-[15px] font-semibold text-white/70">Konten Premium</p>
            <p className="text-[13px] text-white/30">Berlangganan untuk mengakses semua format kode.</p>
            <a href="/pricing" className="px-6 py-2.5 bg-white text-[#111] text-[14px] font-semibold rounded-[8px] hover:bg-white/90 transition-colors">
              Lihat Paket Harga
            </a>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] rounded-[8px] mb-5 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-[13px] font-medium text-white/50">
                {FORMAT_META[activeFormat]?.label ?? activeFormat}
              </span>
              <button className="text-[12px] text-white/40 hover:text-white/70 transition-colors cursor-pointer">
                Copy
              </button>
            </div>
            <div className="p-6 min-h-[200px]">
              {sources[activeFormat as Format] ? (
                <pre className="text-[12px] text-white/70 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
                  {sources[activeFormat as Format]}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-[160px]">
                  <p className="text-[13px] text-white/20">Kode akan tersedia segera</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Related components ── */}
        {related.length > 0 && (
          <div className="pb-10">
            <p className="text-[13px] font-medium text-white/40 mb-4 uppercase tracking-[0.04em]">
              Related
            </p>
            <div className="grid grid-cols-3 gap-4">
              {related.slice(0, 3).map((r) => (
                <Link
                  key={r.slug}
                  href={`/explore/${r.slug}`}
                  className="group block bg-[#161616] rounded-[15px] overflow-hidden shadow-[0px_0px_0px_1px_rgba(255,255,255,0.06)] hover:shadow-[0px_0px_0px_1px_rgba(255,255,255,0.15)] transition-all duration-200"
                >
                  <ThumbnailPlaceholder category={r.category} title={r.title} thumbnailKey={r.thumbnail_key} className="aspect-[4/3]" />
                  <div className="px-3.5 py-2.5">
                    <span className="text-[13px] font-semibold text-white leading-none line-clamp-1">
                      {r.title}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
