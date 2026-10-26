import type { Language } from '../i18n'
import metaRaw from '../test_images_meta.json'

export interface TestImageMeta {
  slug: string
  photo_id: string
  author: string
  author_url: string
  unsplash_url: string
  alt: {
    ru: string
    tj: string
    en: string
  }
}

export const TEST_IMAGE_METADATA: Record<string, TestImageMeta> = Object.fromEntries(
  (metaRaw as TestImageMeta[]).map((item) => [item.slug, item])
)

/**
 * Get optimized local WebP cover image path
 */
export function getTestCover(slug: string): string {
  if (TEST_IMAGE_METADATA[slug]) {
    return `/images/tests/${slug}.webp`
  }
  if (slug === 'color-perception' || slug === 'color-hue-discrimination') {
    return '/images/tests/contrast-sensitivity.webp'
  }
  return '/hero-bg.jpg'
}

/**
 * Get localized image alt description
 */
export function getTestAlt(slug: string, lang: Language): string {
  const meta = TEST_IMAGE_METADATA[slug]
  if (!meta) return 'SIHAT screening'
  return meta.alt[lang] || meta.alt.ru || meta.alt.en || 'SIHAT screening'
}

/**
 * Get photo author and license attribution
 */
export function getTestPhotoCredit(slug: string): { author: string; author_url: string; unsplash_url: string } | null {
  const meta = TEST_IMAGE_METADATA[slug]
  if (!meta) return null
  return {
    author: meta.author,
    author_url: meta.author_url,
    unsplash_url: meta.unsplash_url,
  }
}
