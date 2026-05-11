import type { Metadata } from 'next'
import { getAllResources } from '@/lib/content'
import { ExploreLayout } from '@/components/explore/explore-layout'

export const metadata: Metadata = {
  title: 'Jelajahi Komponen — lailit.supply',
  description: 'Komponen gratis dan premium untuk Framer, Webflow, HTML, dan React.',
}

export default async function ExplorePage() {
  const resources = await getAllResources()
  return <ExploreLayout resources={resources} />
}
