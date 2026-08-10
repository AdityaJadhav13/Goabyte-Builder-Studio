import { describe, expect, it } from 'vitest'
import { BUILDER_TITLES } from '@/features/builder-title/suggest-title'
import {
  DEFAULT_MASCOT_THEME,
  MASCOT_THEMES,
  mascotThemeFor,
} from '@/features/render/templates/mascot-theme'
import { PALETTE } from '@/lib/brand/palette'

/**
 * Every canonical title gets its own crew-builder colourway, and the mapping is
 * deterministic — the same title must never render two different mascots
 * between preview and export (NFR-035).
 */
describe('mascot themes', () => {
  it('covers every canonical builder title', () => {
    for (const { id, label } of BUILDER_TITLES) {
      expect(MASCOT_THEMES[id], `no theme for "${label}"`).toBeDefined()
    }
  })

  it('uses only real brand tokens — no invented hex values', () => {
    for (const theme of Object.values(MASCOT_THEMES)) {
      for (const token of [theme.suit, theme.visor, theme.halo]) {
        expect(PALETTE[token], `${token} is not a palette token`).toBeDefined()
      }
    }
  })

  it('is deterministic for a given title', () => {
    for (const { label } of BUILDER_TITLES) {
      expect(mascotThemeFor(label)).toEqual(mascotThemeFor(label))
    }
  })

  it('gives different titles visibly different mascots', () => {
    // Not all 14 need be unique on every channel, but the set as a whole must
    // not collapse onto one look — that would defeat the point.
    const signatures = BUILDER_TITLES.map(({ label }) => {
      const t = mascotThemeFor(label)
      return `${t.suit}|${t.visor}|${t.halo}`
    })
    expect(new Set(signatures).size).toBe(BUILDER_TITLES.length)
  })

  it('never puts the visor the same colour as the suit', () => {
    // The visor would vanish into the helmet.
    for (const [id, theme] of Object.entries(MASCOT_THEMES)) {
      expect(theme.visor, `${id} visor matches suit`).not.toBe(theme.suit)
    }
  })

  it('is case- and whitespace-insensitive', () => {
    const label = BUILDER_TITLES[0]!.label
    expect(mascotThemeFor(`  ${label.toUpperCase()}  `)).toEqual(mascotThemeFor(label))
  })

  it('falls back for a custom or missing title rather than throwing', () => {
    expect(mascotThemeFor(null)).toEqual(DEFAULT_MASCOT_THEME)
    expect(mascotThemeFor('')).toEqual(DEFAULT_MASCOT_THEME)
    expect(mascotThemeFor('Chief Vibes Officer')).toEqual(DEFAULT_MASCOT_THEME)
  })
})
