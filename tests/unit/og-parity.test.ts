import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PALETTE } from '@/lib/brand/palette'

/**
 * `scripts/og-template.html` is rendered outside the build, so it cannot
 * import PALETTE and duplicates the hex values. This makes that duplication
 * impossible to drift silently — the same technique as token-parity.test.ts.
 */
describe('Open Graph poster palette', () => {
  const html = readFileSync(join(process.cwd(), 'scripts/og-template.html'), 'utf8')

  const declared = Object.fromEntries(
    [...html.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6});/g)].map(([, name, value]) => [
      name,
      value!.toLowerCase(),
    ]),
  )

  it('declares a meaningful number of tokens', () => {
    expect(Object.keys(declared).length).toBeGreaterThanOrEqual(6)
  })

  it.each(Object.entries(declared))('--%s matches PALETTE', (name, value) => {
    expect(PALETTE[name as keyof typeof PALETTE]).toBe(value)
  })

  it('references the same font files the app ships', () => {
    expect(html).toContain('hhg-display-400.woff2')
    expect(html).toContain('hhg-text-var.woff2')
  })

  it('carries the required hashtag', () => {
    expect(html).toContain('#FrameInGoa')
  })
})
