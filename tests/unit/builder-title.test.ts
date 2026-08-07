import { describe, expect, it } from 'vitest'
import {
  BUILDER_TITLES,
  nextTitle,
  suggestTitle,
} from '@/features/builder-title/suggest-title'

/**
 * S1-1, NFR-035. The default title must be deterministic: a random one would
 * change between the preview and the export, making the preview a lie.
 */
describe('suggestTitle', () => {
  it('is deterministic for a given name', () => {
    expect(suggestTitle('Aditya')).toBe(suggestTitle('Aditya'))
    expect(suggestTitle('Nitin Gupta')).toBe(suggestTitle('Nitin Gupta'))
  })

  it('ignores case and surrounding whitespace', () => {
    expect(suggestTitle('  ADITYA  ')).toBe(suggestTitle('aditya'))
  })

  it('always returns a title from the curated list', () => {
    for (const name of ['Aditya', 'आदित्य', '🚀', '', 'x'.repeat(200)]) {
      expect(BUILDER_TITLES).toContain(suggestTitle(name))
    }
  })

  it('spreads across the list rather than collapsing onto one entry', () => {
    const names = Array.from({ length: 200 }, (_, i) => `builder${i}`)
    const distinct = new Set(names.map(suggestTitle))
    expect(distinct.size).toBeGreaterThan(BUILDER_TITLES.length / 2)
  })

  it('handles an empty name without throwing', () => {
    expect(BUILDER_TITLES).toContain(suggestTitle(''))
  })
})

describe('nextTitle', () => {
  it('advances through the list and wraps', () => {
    expect(nextTitle(BUILDER_TITLES[0]!)).toBe(BUILDER_TITLES[1])
    expect(nextTitle(BUILDER_TITLES.at(-1)!)).toBe(BUILDER_TITLES[0])
  })

  it('falls back to the first entry for an unknown value', () => {
    // A user who typed their own title then hits "Try another".
    expect(BUILDER_TITLES).toContain(nextTitle('something bespoke'))
  })
})

describe('the list itself', () => {
  it('has no duplicates', () => {
    expect(new Set(BUILDER_TITLES).size).toBe(BUILDER_TITLES.length)
  })

  it('stays within the card chip budget of 28 characters', () => {
    for (const title of BUILDER_TITLES) {
      expect(title.length, `"${title}" is too long for the chip`).toBeLessThanOrEqual(28)
    }
  })
})
