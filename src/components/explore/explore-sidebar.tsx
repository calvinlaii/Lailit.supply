'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { ResourceMeta } from '@/lib/content'

const CATEGORIES: {
  value: string
  label: string
  icon: string
  iconCn: string
}[] = [
  { value: 'animation',     label: 'Animation',      icon: '/icons/cat-scroll.svg',   iconCn: 'bg-purple-500/20 border-purple-500/30' },
  { value: 'ui-components', label: 'UI Components',  icon: '/icons/cat-buttons.svg',  iconCn: 'bg-[#ff4040]/20 border-[#ff4040]/30' },
  { value: 'layout',        label: 'Layout',         icon: '/icons/view-grid.svg',    iconCn: 'bg-emerald-500/20 border-emerald-500/30' },
  { value: 'interactions',  label: 'Interactions',   icon: '/icons/cat-cursor.svg',   iconCn: 'bg-blue-500/20 border-blue-500/30' },
]

type ExploreSidebarProps = {
  resources: ResourceMeta[]
}

export function ExploreSidebar({ resources }: ExploreSidebarProps) {
  const pathname = usePathname()
  const isExplore = pathname === '/explore'
  const totalFree = resources.filter((r) => !r.is_premium).length
  const catCount = (cat: string) => resources.filter((r) => r.category === cat).length

  return (
    <aside className="w-[280px] shrink-0 flex flex-col bg-[#1a1a1a] border-r border-white/[0.06] h-full">

      {/* Logo row */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4 shrink-0">
        <Link
          href="/"
          className="text-[11px] text-white uppercase tracking-[-0.04em] leading-none hover:opacity-80 transition-opacity duration-150 focus-visible:outline-2 focus-visible:outline-white rounded"
          style={{ fontFamily: 'var(--font-pixeled)' }}
        >
          LAILIT
        </Link>
        <button
          className="w-8 h-8 rounded-[10px] bg-white/[0.07] flex items-center justify-center hover:bg-white/[0.12] transition-colors duration-150 cursor-pointer"
          aria-label="Mode"
        >
          <Image src="/icons/mode-light.svg" alt="" width={16} height={16} />
        </button>
      </div>

      {/* Section button */}
      <div className="px-3 shrink-0">
        <Link
          href="/explore"
          className={cn(
            'w-full flex items-center gap-3 px-3 py-3 rounded-[16px] transition-colors duration-150',
            isExplore ? 'bg-white/[0.08]' : 'bg-white/[0.04] hover:bg-white/[0.07]',
          )}
        >
          <div className="w-9 h-9 rounded-lg bg-[#ff4040]/20 border border-[#ff4040]/30 flex items-center justify-center shrink-0 p-[9px]">
            <Image src="/icons/section-icon.svg" alt="" width={16} height={16} className="w-full h-full" />
          </div>
          <span className="text-[15px] font-semibold text-white flex-1 text-left">Komponen</span>
          <Image src="/icons/chevron-right.svg" alt="" width={14} height={14} className="opacity-30 shrink-0" />
        </Link>
      </div>

      {/* Free pill */}
      <div className="px-5 pt-4 pb-3 shrink-0">
        <div className="inline-flex items-center gap-2 bg-[#222] rounded-full px-3 py-1.5 border border-white/[0.08]">
          <span className="text-[15px] font-bold text-white tabular-nums leading-none">{totalFree}</span>
          <span className="text-[14px] font-semibold text-white leading-none">Free</span>
          <span style={{ fontFamily: "'Caveat', cursive" }} className="text-[16px] font-bold text-[#b8f566] leading-none">
            for you!
          </span>
        </div>
      </div>

      {/* Category list */}
      <nav className="flex-1 overflow-y-auto min-h-0 py-1" aria-label="Filter kategori" data-lenis-prevent>
        {CATEGORIES.map((cat) => {
          const count = catCount(cat.value)
          return (
            <Link
              key={cat.value}
              href={`/explore?category=${cat.value}`}
              className="w-full flex items-center gap-[10px] px-[15px] py-[11.5px] hover:bg-white/[0.04] transition-colors duration-100 border-b border-t border-white/[0.04]"
            >
              <div className={cn('w-[34px] h-[34px] rounded-[12px] border flex items-center justify-center shrink-0 p-[8px]', cat.iconCn)}>
                <Image src={cat.icon} alt="" width={16} height={16} className="w-full h-full" />
              </div>
              <span className="text-[14px] font-semibold tabular-nums shrink-0 text-white/35">{count}</span>
              <span className="flex-1 text-[14px] text-white/55 font-normal text-left">{cat.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mx-5 border-t border-white/[0.07] shrink-0" />

      {/* Secondary nav */}
      <div className="py-2 shrink-0">
        {[
          { icon: '/icons/panduan.svg', label: 'Panduan', href: '/panduan' },
          { icon: '/icons/easings.svg', label: 'Easings', href: '/easings' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-5 py-[11px] hover:bg-white/[0.04] transition-colors duration-100"
          >
            <div className="w-8 h-8 rounded-lg border border-white/[0.1] flex items-center justify-center shrink-0 p-[7px]">
              <Image src={item.icon} alt="" width={16} height={16} className="w-full h-full opacity-40" />
            </div>
            <span className="text-[14px] font-normal text-white/40 flex-1">{item.label}</span>
            <Image src="/icons/chevron-small.svg" alt="" width={14} height={14} className="opacity-20" />
          </Link>
        ))}
      </div>

      <div className="mx-5 border-t border-white/[0.07] shrink-0" />

      {/* CTA */}
      <div className="px-3 py-4 shrink-0">
        <Link
          href="/pricing"
          className="flex items-center justify-center gap-2 w-full rounded-[10px] bg-[#111] border border-white/[0.1] text-white text-[14px] font-semibold py-3.5 hover:bg-[#222] hover:border-white/20 active:scale-[0.98] transition-all duration-150 focus-visible:outline-2 focus-visible:outline-white"
        >
          <Image src="/icons/cta-lock.svg" alt="" width={16} height={16} />
          Buka Akses
        </Link>
      </div>
    </aside>
  )
}
