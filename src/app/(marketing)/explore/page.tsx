import type { Metadata } from 'next'
import { getAllResources } from '@/lib/content'
import { CategoryFilterRow } from '@/components/explore/category-filter-row'

export const metadata: Metadata = {
  title: 'Jelajahi Komponen — lailit.supply',
  description:
    'Komponen gratis untuk Framer, Webflow, HTML, JSX, dan TSX. Jelajahi koleksi komponen premium untuk developer kreatif.',
}

export default async function ExplorePage() {
  const resources = await getAllResources()

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-16 lg:py-24">
      <div className="max-w-[1200px] mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950">
            Jelajahi Komponen
          </h1>
          <p className="mt-4 text-base font-normal leading-[1.5] text-neutral-500 max-w-[52ch]">
            Komponen gratis untuk Framer, Webflow, HTML, JSX, dan TSX.
          </p>
        </header>

        <CategoryFilterRow resources={resources} />
      </div>
    </div>
  )
}
