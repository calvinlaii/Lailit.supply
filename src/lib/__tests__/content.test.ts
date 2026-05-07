import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('fast-glob', () => ({
  default: { sync: vi.fn() },
}))
vi.mock('gray-matter', () => ({
  default: vi.fn(),
}))
vi.mock('fs', () => ({
  default: { readFileSync: vi.fn() },
}))

const VALID_FRONTMATTER = {
  title: 'Fade In On Scroll',
  category: 'animation' as const,
  tags: ['scroll', 'fade'],
  is_premium: false,
  available_formats: ['framer', 'jsx'] as const,
  mux_playback_id: null,
  demo_url: null,
}

describe('ResourceFrontmatterSchema', () => {
  it('accepts valid frontmatter', async () => {
    const { ResourceFrontmatterSchema } = await import('../content')
    expect(() => ResourceFrontmatterSchema.parse(VALID_FRONTMATTER)).not.toThrow()
  })

  it('rejects invalid category', async () => {
    const { ResourceFrontmatterSchema } = await import('../content')
    expect(() =>
      ResourceFrontmatterSchema.parse({ ...VALID_FRONTMATTER, category: 'invalid-cat' })
    ).toThrow()
  })

  it('rejects empty object (missing required fields)', async () => {
    const { ResourceFrontmatterSchema } = await import('../content')
    expect(() => ResourceFrontmatterSchema.parse({})).toThrow()
  })

  it('accepts all valid categories', async () => {
    const { ResourceFrontmatterSchema } = await import('../content')
    const cats = ['animation', 'ui-components', 'layout', 'interactions'] as const
    cats.forEach((cat) => {
      expect(() =>
        ResourceFrontmatterSchema.parse({ ...VALID_FRONTMATTER, category: cat })
      ).not.toThrow()
    })
  })

  it('accepts all valid formats', async () => {
    const { ResourceFrontmatterSchema } = await import('../content')
    const formats = ['framer', 'webflow', 'html', 'jsx', 'tsx'] as const
    expect(() =>
      ResourceFrontmatterSchema.parse({ ...VALID_FRONTMATTER, available_formats: [...formats] })
    ).not.toThrow()
  })
})

describe('getAllResources', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.resetModules()
  })

  it('returns array with slug from directory name', async () => {
    const fg = await import('fast-glob')
    const matter = await import('gray-matter')
    const fs = await import('fs')

    vi.mocked(fg.default.sync).mockReturnValue([
      '/project/content/resources/animation-fade-in-on-scroll/index.mdx',
    ])
    vi.mocked(fs.default.readFileSync).mockReturnValue('---\ntitle: T\n---')
    vi.mocked(matter.default as any).mockReturnValue({ data: VALID_FRONTMATTER })

    const { getAllResources } = await import('../content')
    const results = await getAllResources()
    expect(results).toHaveLength(1)
    expect(results[0].slug).toBe('animation-fade-in-on-scroll')
    expect(results[0].title).toBe('Fade In On Scroll')
  })

  it('throws descriptive error with slug when frontmatter is invalid', async () => {
    const fg = await import('fast-glob')
    const matter = await import('gray-matter')
    const fs = await import('fs')

    vi.mocked(fg.default.sync).mockReturnValue([
      '/project/content/resources/bad-resource/index.mdx',
    ])
    vi.mocked(fs.default.readFileSync).mockReturnValue('---\ntitle: T\n---')
    vi.mocked(matter.default as any).mockReturnValue({ data: { title: 'Bad', category: 'INVALID' } })

    const { getAllResources } = await import('../content')
    await expect(getAllResources()).rejects.toThrow(/bad-resource/)
  })
})

describe('getResourceBySlug', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.resetModules()
  })

  it('returns null for unknown slug', async () => {
    const fg = await import('fast-glob')
    vi.mocked(fg.default.sync).mockReturnValue([])

    const { getResourceBySlug } = await import('../content')
    const result = await getResourceBySlug('does-not-exist')
    expect(result).toBeNull()
  })
})
