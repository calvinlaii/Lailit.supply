'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ResourceMeta } from '@/lib/content'
import { ResourceCard } from '@/components/explore/resource-card'

type Category = 'all' | 'animation' | 'ui-components' | 'layout' | 'interactions'
type SortOrder = 'newest' | 'oldest' | 'az'

const CATEGORIES: {
  value: Category
  label: string
  icon: string
  iconCn: string
}[] = [
  {
    value: 'animation',
    label: 'Animation',
    icon: '/icons/cat-scroll.svg',
    iconCn: 'bg-purple-500/20 border-purple-500/30',
  },
  {
    value: 'ui-components',
    label: 'UI Components',
    icon: '/icons/cat-buttons.svg',
    iconCn: 'bg-[#ff4040]/20 border-[#ff4040]/30',
  },
  {
    value: 'layout',
    label: 'Layout',
    icon: '/icons/view-grid.svg',
    iconCn: 'bg-emerald-500/20 border-emerald-500/30',
  },
  {
    value: 'interactions',
    label: 'Interactions',
    icon: '/icons/cat-cursor.svg',
    iconCn: 'bg-blue-500/20 border-blue-500/30',
  },
]

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'oldest', label: 'Terlama' },
  { value: 'az', label: 'A–Z' },
]

type ExploreLayoutProps = {
  resources: ResourceMeta[]
}

export function ExploreLayout({ resources }: ExploreLayoutProps) {
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const topSearchRef = useRef<HTMLInputElement>(null)

  const totalFree = resources.filter((r) => !r.is_premium).length

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        topSearchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const catCount = (cat: Category) => resources.filter((r) => r.category === cat).length
  const hasPremium = (cat: Category) =>
    resources.filter((r) => r.category === cat).some((r) => r.is_premium)

  const filtered = resources
    .filter((r) => activeCategory === 'all' || r.category === activeCategory)
    .filter((r) =>
      searchQuery === '' || r.title.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortOrder === 'az') return a.title.localeCompare(b.title)
      if (sortOrder === 'oldest') return a.slug.localeCompare(b.slug)
      return b.slug.localeCompare(a.slug)
    })

  const activeLabel =
    activeCategory === 'all'
      ? 'Komponen'
      : CATEGORIES.find((c) => c.value === activeCategory)?.label ?? 'Komponen'

  return (
    <div className="flex h-full">
      {/* ── Sidebar ── */}
      <aside className="w-[280px] shrink-0 flex flex-col bg-[#1a1a1a] border-r border-white/[0.06]">

        {/* Logo row */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 shrink-0">
          <Link
            href="/"
            className="text-[11px] text-white uppercase tracking-[-0.04em] leading-none hover:opacity-80 transition-opacity duration-150 focus-visible:outline-2 focus-visible:outline-white rounded" style={{ fontFamily: 'var(--font-pixeled)' }}
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
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-3 rounded-[16px] transition-colors duration-150 cursor-pointer',
              activeCategory === 'all' ? 'bg-white/[0.08]' : 'bg-white/[0.04] hover:bg-white/[0.07]',
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-[#ff4040]/20 border border-[#ff4040]/30 flex items-center justify-center shrink-0 p-[9px]">
              <Image src="/icons/section-icon.svg" alt="" width={16} height={16} className="w-full h-full" />
            </div>
            <span className="text-[15px] font-semibold text-white flex-1 text-left">Komponen</span>
            <Image src="/icons/chevron-right.svg" alt="" width={14} height={14} className="opacity-30 shrink-0" />
          </button>
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
        <nav className="flex-1 overflow-y-auto min-h-0 py-1" aria-label="Filter kategori">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.value
            const count = catCount(cat.value)
            const locked = hasPremium(cat.value)
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'w-full flex items-center gap-[10px] px-[15px] py-[11.5px] transition-colors duration-100 cursor-pointer border-b border-t border-white/[0.04]',
                  isActive ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]',
                )}
              >
                <div className={cn(
                  'w-[34px] h-[34px] rounded-[12px] border flex items-center justify-center shrink-0 p-[8px]',
                  cat.iconCn,
                )}>
                  <Image src={cat.icon} alt="" width={16} height={16} className="w-full h-full" />
                </div>
                <span className={cn('text-[14px] font-semibold tabular-nums shrink-0', isActive ? 'text-white/70' : 'text-white/35')}>
                  {count}
                </span>
                <span className={cn('flex-1 text-[14px] text-left', isActive ? 'text-white font-medium' : 'text-white/55 font-normal')}>
                  {cat.label}
                </span>
                {locked && (
                  <Image src="/icons/chevron-small.svg" alt="" width={14} height={14} className="opacity-20 shrink-0" />
                )}
              </button>
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

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto min-w-0 bg-[#161616]">

        {/* Sticky topbar */}
        <div className="sticky top-0 z-10 flex items-center gap-4 px-5 h-[82px] bg-[#161616]/90 backdrop-blur-md border-b border-white/[0.05]">
          {/* Left */}
          <div className="shrink-0 min-w-[120px]">
            <span className="text-[20px] font-medium text-white/50 whitespace-nowrap">
              Free Compons
            </span>
          </div>

          {/* Center: search */}
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-[448px] bg-[#222] border border-white/[0.1] rounded-[10px] flex items-center gap-3 px-5 py-3.5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              <Image src="/icons/search.svg" alt="" width={16} height={16} className="shrink-0 opacity-30" />
              <input
                ref={topSearchRef}
                type="search"
                placeholder={`Cari ${resources.length} komponen`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Cari komponen"
                className="flex-1 bg-transparent text-[14px] text-white/80 placeholder:text-white/30 focus:outline-none min-w-0"
              />
              <div className="w-px h-4 bg-white/10 shrink-0" />
              <div className="relative flex items-center shrink-0">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  aria-label="Urutan"
                  className="appearance-none bg-transparent text-[13px] text-white/40 focus:outline-none cursor-pointer pr-4"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#222] text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 w-3 h-3 text-white/30 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="shrink-0 min-w-[120px] flex justify-end">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-[12px] border border-white/[0.08] bg-white/[0.04] hover:border-white/15 transition-colors duration-150 cursor-pointer p-[7px]"
              aria-label="Tersimpan"
            >
              <Image src="/icons/bookmark.svg" alt="" width={14} height={14} className="w-full h-full opacity-35" />
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center justify-center text-center px-8 pt-20 pb-14">
          <p className="text-[14px] text-white/40 mb-5 flex items-center gap-1.5">
            Halo <span>👋</span>
          </p>
          <h1 className="text-[3rem] sm:text-[4rem] text-white leading-[1.4] tracking-[-0.04em] max-w-4xl" style={{ fontFamily: 'var(--font-pixeled)' }}>
            Selamat datang di lailit
          </h1>
          <div className="mt-6 flex items-center gap-1.5 select-none" aria-hidden="true">
            <Image src="/icons/arrow-curved.svg" alt="" width={32} height={22} />
            <span style={{ fontFamily: "'Caveat', cursive" }} className="text-[17px] font-bold text-[#b8f566]">
              Coba {totalFree} gratis
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="px-4 pb-10">
          {/* View toggle */}
          <div className="mb-4">
            <div className="inline-flex items-center gap-[10px] bg-[#282828] rounded-[10px] p-[10px]">
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
                className={cn(
                  'flex items-center justify-center w-[39px] h-[39px] rounded-[5px] transition-colors duration-150 cursor-pointer p-[5px]',
                  viewMode === 'grid' ? 'bg-[#4c4c4c]' : 'hover:bg-[#383838]',
                )}
              >
                <Image src="/icons/view-grid.svg" alt="" width={29} height={29} className="w-full h-full" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                className={cn(
                  'flex items-center justify-center w-[39px] h-[39px] rounded-[5px] transition-colors duration-150 cursor-pointer p-[5px]',
                  viewMode === 'list' ? 'bg-[#4c4c4c]' : 'hover:bg-[#383838]',
                )}
              >
                <Image src="/icons/view-list.svg" alt="" width={30} height={30} className="w-full h-full" />
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center">
                <Image src="/icons/search.svg" alt="" width={16} height={16} className="opacity-20" />
              </div>
              <p className="text-[13px] font-medium text-white/40">Tidak ada komponen</p>
              <p className="text-[12px] text-white/20">Coba kata kunci lain</p>
            </div>
          ) : (
            <div
              role="list"
              aria-label={`Komponen ${activeLabel}`}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[1800px]:grid-cols-5 gap-4"
            >
              {filtered.map((resource) => (
                <ResourceCard key={resource.slug} resource={resource} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
