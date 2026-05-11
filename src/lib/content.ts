import 'server-only'
import { cache } from 'react'
import fs from 'fs'
import path from 'path'
import fg from 'fast-glob'
import matter from 'gray-matter'
import { z } from 'zod'

const CONTENT_ROOT = path.join(process.cwd(), 'content/resources')

export const ResourceFrontmatterSchema = z.object({
  title: z.string(),
  category: z.enum(['animation', 'ui-components', 'layout', 'interactions']),
  description: z.string().optional().nullable(),
  tags: z.array(z.string()),
  is_premium: z.boolean(),
  available_formats: z.array(z.enum(['framer', 'webflow', 'html', 'jsx', 'tsx'])),
  mux_playback_id: z.string().nullable(),
  demo_url: z.string().nullable(),
  published_at: z.string().optional().nullable(),
})

export type ResourceMeta = z.infer<typeof ResourceFrontmatterSchema> & {
  slug: string
}

export const getAllResources = cache(async (): Promise<ResourceMeta[]> => {
  const indexFiles = fg.sync('*/index.mdx', {
    cwd: CONTENT_ROOT,
    absolute: true,
  })

  return indexFiles.map((filePath) => {
    const slug = path.basename(path.dirname(filePath))
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data } = matter(fileContent)
    try {
      const validated = ResourceFrontmatterSchema.parse(data)
      return { slug, ...validated }
    } catch (e) {
      throw new Error(`Invalid frontmatter in ${slug}/index.mdx: ${e}`)
    }
  })
})

export const getResourceBySlug = cache(async (slug: string): Promise<ResourceMeta | null> => {
  const all = await getAllResources()
  return all.find((r) => r.slug === slug) ?? null
})
