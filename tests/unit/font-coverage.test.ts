import { describe, expect, it } from 'vitest'
import { FONT_STACK, REQUIRED_FACES } from '@/features/render/fonts'
import { PFP_LAYOUT } from '@/features/render/templates/pfp.layout'
import { CARD_LAYOUT } from '@/features/render/templates/builder-card.layout'
import { BUILDER_CARD_BACK_LAYOUT } from '@/features/render/templates/builder-card-back.layout'
import { CREW_LAYOUT } from '@/features/render/templates/crew.layout'

/**
 * Follow-up created by SPIKE-4 (docs/spikes/SPIKE-4-FONTS-ASSETS.md §10).
 *
 * `REQUIRED_FACES` is what `ensureFontsReady()` awaits before any canvas text.
 * A weight used by a template but MISSING from that list is a silent export
 * bug: the preview looks right because the DOM already loaded the face, and
 * the export ships in a fallback. This converts "someone remembered" into a
 * build failure.
 */

interface TypeSpec {
  readonly fontFamily: string
  readonly fontWeight: number
}

function specsIn(layout: object): TypeSpec[] {
  return Object.values(layout).flatMap((value): TypeSpec[] => {
    if (typeof value !== 'object' || value === null) return []
    if ('fontFamily' in value && 'fontWeight' in value) return [value as TypeSpec]
    return specsIn(value)
  })
}

const ALL_SPECS = [
  ...specsIn(PFP_LAYOUT),
  ...specsIn(CARD_LAYOUT),
  ...specsIn(BUILDER_CARD_BACK_LAYOUT),
  ...specsIn(CREW_LAYOUT),
]

/** 'HHG Display' from `"HHG Display", Georgia, serif`. */
const primaryFamily = (stack: string): string =>
  stack
    .split(',')[0]!
    .trim()
    .replace(/^["']|["']$/g, '')

describe('font coverage', () => {
  it('finds type specs to check (guards against a broken extractor)', () => {
    expect(ALL_SPECS.length).toBeGreaterThanOrEqual(6)
  })

  it.each(ALL_SPECS)(
    'every family/weight a template draws with is awaited: $fontWeight $fontFamily',
    (spec) => {
      const family = primaryFamily(spec.fontFamily)
      const covered = REQUIRED_FACES.some(
        (face) => face.includes(family) && face.startsWith(String(spec.fontWeight)),
      )
      expect(
        covered,
        `${spec.fontWeight} "${family}" is missing from REQUIRED_FACES`,
      ).toBe(true)
    },
  )

  it('every required face is actually used by a template — no dead entries', () => {
    for (const face of REQUIRED_FACES) {
      const used = ALL_SPECS.some(
        (spec) =>
          face.includes(primaryFamily(spec.fontFamily)) &&
          face.startsWith(String(spec.fontWeight)),
      )
      expect(used, `${face} is loaded but never drawn with`).toBe(true)
    }
  })

  it('every stack names a real fallback, so a failed load degrades', () => {
    for (const stack of Object.values(FONT_STACK)) {
      expect(stack.split(',').length).toBeGreaterThan(1)
    }
  })
})
