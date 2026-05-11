import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'
import { getAllResources, getResourceBySlug } from '@/lib/content'
import { ExploreSidebar } from '@/components/explore/explore-sidebar'
import { ResourceDetail } from '@/components/explore/resource-detail'

type Format = 'framer' | 'webflow' | 'html' | 'jsx' | 'tsx'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const resources = await getAllResources()
  return resources.map((r) => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const resource = await getResourceBySlug(slug)
  if (!resource) return {}
  return {
    title: `${resource.title} — lailit.supply`,
    description: `Komponen ${resource.title} untuk ${resource.available_formats.join(', ')}.`,
  }
}

function readFormatSource(slug: string, format: Format): string | null {
  const contentRoot = path.join(process.cwd(), 'content/resources')
  const filePath = path.join(contentRoot, slug, `${format}.mdx`)
  if (!fs.existsSync(filePath)) return null
  return fs.readFileSync(filePath, 'utf-8')
}

export default async function ResourcePage({ params }: Props) {
  const { slug } = await params
  const [resource, all] = await Promise.all([getResourceBySlug(slug), getAllResources()])
  if (!resource) notFound()

  const formatSources = Object.fromEntries(
    resource.available_formats
      .map((fmt) => [fmt, readFormatSource(slug, fmt as Format)])
      .filter(([, src]) => src !== null)
  ) as Record<Format, string>

  const related = all
    .filter((r) => r.slug !== slug && r.category === resource.category)
    .slice(0, 3)

  return (
    <div className="flex h-full">
      <ExploreSidebar resources={all} />
      <ResourceDetail
        resource={resource}
        related={related}
        formatSources={formatSources}
      />
    </div>
  )
}
