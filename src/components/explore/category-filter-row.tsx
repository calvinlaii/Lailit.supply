 'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ResourceMeta } from '@/lib/content'
import { ResourceCard } from '@/components/explore/resource-card'

type Category = 'all' | 'animation' | 'ui-components' | 'layout' | 'interactions'

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'animation', label: 'Animation' },
  { value: 'ui-components', label: 'UI Components' },
  { value: 'layout', label: 'Layout' },
  { value: 'interactions', label: 'Interactions' },
]

type CategoryFilterRowProps = {
  resources: ResourceMeta[]
}

export function CategoryFilterRow({ resources }: CategoryFilterRowProps) {
  const [active, setActive] = useState<Category>('all')

  const filtered =
    active === 'all' ? resources : resources.filter((r) => r.category === active)

  return (
    <div>
      <div
        role="tablist"
        aria-label="Filter kategori"
        className="flex flex-wrap gap-2 mb-8"
      >
        {CATEGORIES.map((cat) => {
          const isActive = active === cat.value
          return (
            <button
              key={cat.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(cat.value)}
              className={cn(
                'inline-flex items-center justify-center px-4 rounded-full text-sm font-semibold min-h-[44px] transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950',
                isActive
                  ? 'bg-neutral-950 text-white'
                  : 'border border-neutral-200 text-neutral-950 bg-white hover:bg-neutral-50 hover:border-neutral-950'
              )}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center flex flex-col items-center gap-3">
          <Search className="w-8 h-8 text-neutral-400" aria-hidden="true" />
          <h3 className="text-base font-semibold text-neutral-950">Tidak ada komponen</h3>
          <p className="text-sm font-normal text-neutral-500 leading-[1.45]">
            Coba pilih kategori lain.
          </p>
        </div>
      ) : (
        <div
          role="tabpanel"
          aria-label={`Komponen kategori ${CATEGORIES.find((c) => c.value === active)?.label ?? 'Semua'}`}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
        >
          {filtered.map((resource) => (
            <ResourceCard key={resource.slug} resource={resource} />
          ))}
        </div>
      )}
    </div>
  )
}
