import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CONTRAST_SAFE, PALETTE } from '@/lib/brand/palette'

/**
 * ARCHITECTURE §15 — design tokens have one source of truth.
 *
 * `app/globals.css` owns the tokens; `lib/brand/palette.ts` mirrors them for
 * the canvas renderer. These tests turn "remember to update both" into a build
 * failure, and turn the contrast claims in DESIGN_SYSTEM.md into something a
 * machine checks rather than something a human asserted once.
 */

function parseThemeColors(css: string): Record<string, string> {
  const themeBlock = /@theme\s*\{([\s\S]*?)\n\}/.exec(css)
  if (!themeBlock?.[1]) throw new Error('No @theme block found in globals.css')

  const colors: Record<string, string> = {}
  const tokenPattern = /--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g
  for (const match of themeBlock[1].matchAll(tokenPattern)) {
    const [, name, value] = match
    if (name && value) colors[name] = value.toLowerCase()
  }
  return colors
}

// ── WCAG 2.1 relative luminance and contrast ratio ─────────────────────────
function channel(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  )
}

function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

describe('design token parity', () => {
  const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8')
  const cssColors = parseThemeColors(css)

  it('every @theme colour token has a matching entry in PALETTE', () => {
    expect(cssColors).toEqual(PALETTE)
  })

  it('finds a non-trivial number of tokens (guards against a broken parser)', () => {
    // A regex that silently stops matching would make the test above pass
    // vacuously against an empty object. Pin the count.
    expect(Object.keys(cssColors).length).toBe(Object.keys(PALETTE).length)
    expect(Object.keys(cssColors).length).toBeGreaterThanOrEqual(12)
  })
})

describe('brand contrast guarantees (NFR-014)', () => {
  it.each(CONTRAST_SAFE.bodyText)(
    '%s on %s meets AA for body text (>= 4.5:1)',
    (fg, bg) => {
      expect(contrastRatio(PALETTE[fg], PALETTE[bg])).toBeGreaterThanOrEqual(4.5)
    },
  )

  it.each(CONTRAST_SAFE.displayOnly)(
    '%s on %s meets AA-large (>= 3:1) and is restricted to display sizes',
    (fg, bg) => {
      const ratio = contrastRatio(PALETTE[fg], PALETTE[bg])
      expect(ratio).toBeGreaterThanOrEqual(3)
      // If one of these ever clears 4.5 it should be promoted to bodyText
      // rather than left under a needlessly strict usage restriction.
      expect(ratio).toBeLessThan(4.5)
    },
  )

  it('pink is never safe for body text on green — the documented trap', () => {
    // Guards the specific mistake DESIGN_SYSTEM.md §3.3 warns about, so that a
    // future palette tweak cannot quietly make the written rule wrong.
    expect(contrastRatio(PALETTE.pink, PALETTE['green-800'])).toBeLessThan(4.5)
    expect(contrastRatio(PALETTE.cream, PALETTE.pink)).toBeLessThan(4.5)
    expect(contrastRatio(PALETTE.ink, PALETTE.pink)).toBeGreaterThanOrEqual(4.5)
  })
})
