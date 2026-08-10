import type { CardSide, OutputFormat } from '@/features/render/types'

/**
 * Stable, safe, meaningful download filenames. PRD FR-046.
 *
 * Sanitisation is not cosmetic: the subject string will eventually come from a
 * free-text name field, so it must survive emoji, non-Latin scripts, path
 * separators and absurd lengths without producing an unusable file.
 */

const MAX_SLUG_LENGTH = 32
const FALLBACK_SLUG = 'builder'

/**
 * Reduce arbitrary text to `[a-z0-9-]`.
 *
 * NFD + combining-mark strip turns "Ādityā" into "adity" rather than dropping
 * it entirely. Scripts with no Latin decomposition (Devanagari, CJK) reduce to
 * nothing, which is why the fallback exists — a Hindi name must still produce a
 * working download, just not a transliterated one.
 */
export function slugify(input: string): string {
  const slug = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '')

  return slug.length > 0 ? slug : FALLBACK_SLUG
}

export function buildFileName(
  format: OutputFormat,
  subject?: string | null,
  cardSide: CardSide = 'front',
): string {
  const output = format === 'builder-card' ? `builder-id-${cardSide}` : format
  return `hhgoa-2026-${slugify(subject ?? '')}-${output}.png`
}
