import {
  BUILDER_TITLES,
  type BuilderTitleLabel,
} from '@/features/builder-title/suggest-title'
import type { PaletteToken } from '@/lib/brand/palette'

/**
 * A distinct crew-builder colourway per builder title.
 *
 * Two people with different titles should not receive the same card back. The
 * mascot is the most recognisable thing on the reverse, so it is what carries
 * the difference — a Founder and a Web3 Security Researcher read as different
 * crew members at a glance.
 *
 * Deterministic by construction: the theme is looked up from the title string,
 * never generated. The same title always produces the same mascot, so preview
 * and export cannot diverge (NFR-035).
 *
 * Every colour is a brand token. Nothing here invents a hex value, which is
 * what keeps the reverse inside the design system rather than beside it.
 */
export interface MascotTheme {
  /** Helmet band — the largest colour area, so it does most of the work. */
  readonly suit: PaletteToken
  /** Visor glass. Kept dark on light suits and vice versa for readability. */
  readonly visor: PaletteToken
  /** Halo behind the mascot. */
  readonly halo: PaletteToken
}

/** Fallback for a custom title the user typed themselves. */
export const DEFAULT_MASCOT_THEME: MascotTheme = {
  suit: 'pink',
  visor: 'green-700',
  halo: 'yellow',
}

/**
 * Keyed by title id rather than label, so rewording a label cannot silently
 * reassign somebody's colourway.
 */
const THEMES: Record<string, MascotTheme> = {
  'protocol-builder': { suit: 'pink', visor: 'green-900', halo: 'yellow' },
  'smart-contract-engineer': {
    suit: 'yellow',
    visor: 'green-900',
    halo: 'pink',
  },
  'web3-developer': { suit: 'cream', visor: 'green-700', halo: 'yellow' },
  'blockchain-architect': {
    suit: 'green-600',
    visor: 'green-900',
    halo: 'cream',
  },
  'defi-builder': { suit: 'yellow-dim', visor: 'green-800', halo: 'cream' },
  'dapp-builder': { suit: 'pink-dim', visor: 'green-900', halo: 'yellow' },
  'web3-security-researcher': {
    suit: 'green-900',
    visor: 'pink',
    halo: 'cream',
  },
  'ai-web3-builder': { suit: 'pink', visor: 'yellow', halo: 'cream' },
  'frontend-engineer': { suit: 'cream', visor: 'pink', halo: 'yellow' },
  'backend-engineer': {
    suit: 'green-700',
    visor: 'yellow',
    halo: 'cream',
  },
  'product-builder': { suit: 'sand', visor: 'green-700', halo: 'pink' },
  'protocol-researcher': {
    suit: 'green-800',
    visor: 'cream',
    halo: 'yellow',
  },
  'growth-community': { suit: 'pink', visor: 'cream', halo: 'yellow' },
  founder: { suit: 'yellow', visor: 'pink', halo: 'cream' },
}

/** Resolve a mascot colourway from a builder title label. */
export function mascotThemeFor(title: string | null | undefined): MascotTheme {
  const trimmed = title?.trim()
  if (!trimmed) return DEFAULT_MASCOT_THEME

  const match = BUILDER_TITLES.find(
    ({ label }) => label.toLowerCase() === trimmed.toLowerCase(),
  )
  if (!match) return DEFAULT_MASCOT_THEME

  return THEMES[match.id] ?? DEFAULT_MASCOT_THEME
}

/** Every canonical title has a theme — asserted by test, not by hope. */
export const THEMED_TITLE_LABELS: readonly BuilderTitleLabel[] = BUILDER_TITLES.map(
  ({ label }) => label,
)

export const MASCOT_THEMES = THEMES
