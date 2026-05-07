import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { getAllResources, getResourceBySlug } from '@/lib/content'
import { PaywallStub } from '@/components/explore/paywall-stub'
import { VideoPlaceholder } from '@/components/explore/video-placeholder'
import { ThumbnailPlaceholder } from '@/components/explore/thumbnail-placeholder'
import { FormatContentWrapper } from '@/components/explore/format-content-wrapper'
import { Badge } from '@/components/ui/badge'

type Format = 'framer' | 'webflow' | 'html' | 'jsx' | 'tsx'

export async function generateStaticParams() {
  const resources = await getAllResources()
  return resources.map((r) => ({ slug: r.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const resource = await getResourceBySlug(slug)
  if (!resource) return { title: 'Komponen tidak ditemukan — lailit.supply' }
  return {
    title: `${resource.title} — lailit.supply`,
    description: `Komponen ${resource.title} untuk ${resource.available_formats.join(', ')}.`,
  }
}

function readFormatSource(slug: string, format: Format): string | null {
  const contentRoot = path.join(process.cwd(), 'content/resources')
  const formatFilePath = path.join(contentRoot, slug, `${format}.mdx`)
  if (!fs.existsSync(formatFilePath)) return null
  return fs.readFileSync(formatFilePath, 'utf-8')
}

const CATEGORY_LABELS: Record<string, string> = {
  animation: 'Animation',
  'ui-components': 'UI Components',
  layout: 'Layout',
  interactions: 'Interactions',
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const resource = await getResourceBySlug(slug)
  if (!resource) notFound()

  if (resource.is_premium) {
    return (
      <div className="px-4 sm:px-8 lg:px-12 py-16 lg:py-24">
        <div className="max-w-[1200px] mx-auto">
          <Link
            href="/explore"
            className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-950 transition-colors duration-150 mb-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
          >
            ← Kembali ke Jelajahi
          </Link>
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-[60%]">
              <ThumbnailPlaceholder category={resource.category} title={resource.title} />
              <h1 className="mt-6 text-3xl font-semibold leading-[1.2] tracking-[-0.02em] text-neutral-950">
                {resource.title}
              </h1>
              <div className="mt-3 flex gap-2 items-center">
                <Badge variant="outline" className="text-xs">Premium</Badge>
                <span className="text-sm text-neutral-500">
                  {CATEGORY_LABELS[resource.category] ?? resource.category}
                </span>
              </div>
            </div>
            <div className="lg:w-[40%]">
              <PaywallStub />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const formatEntries = resource.available_formats.map((fmt) => {
    const source = readFormatSource(slug, fmt as Format)
    return [fmt, source] as [Format, string | null]
  })

  const compiledFormats = Object.fromEntries(
    formatEntries.filter(
      (e): e is [Format, string] => e[1] !== null
    )
  ) as Record<Format, string>

  const availableFormats = Object.keys(compiledFormats) as Format[]

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-16 lg:py-24">
      <div className="max-w-[1200px] mx-auto">
        <Link
          href="/explore"
          className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-950 transition-colors duration-150 mb-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
        >
          ← Kembali ke Jelajahi
        </Link>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-[60%] flex flex-col gap-6">
            <VideoPlaceholder title={resource.title} />
            <div>
              <h1 className="text-3xl font-semibold leading-[1.2] tracking-[-0.02em] text-neutral-950">
                {resource.title}
              </h1>
              <div className="mt-3 flex gap-2 items-center flex-wrap">
                <Badge className="text-xs bg-neutral-950 text-white hover:bg-neutral-950">
                  Gratis
                </Badge>
                <span className="text-sm text-neutral-500">
                  {CATEGORY_LABELS[resource.category] ?? resource.category}
                </span>
              </div>
              {resource.demo_url && (
                <a
                  href={resource.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
                >
                  Lihat Demo
                </a>
              )}
            </div>
          </div>

          <div className="lg:w-[40%]">
            {availableFormats.length > 0 ? (
              <FormatContentWrapper
                formats={availableFormats}
                compiledFormats={compiledFormats}
              />
            ) : (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
                Belum ada format tersedia.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
