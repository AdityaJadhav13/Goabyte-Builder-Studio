/**
 * TypeScript mirror of the `@theme` colour tokens in `app/globals.css`.
 *
 * This file exists because the canvas renderer needs colour values as strings
 * and CSS cannot be imported into a `.ts` module. It is a mirror, not a second
 * source of truth: `tests/unit/token-parity.test.ts` parses `globals.css` and
 * fails if the two ever drift apart.
 *
 * ARCHITECTURE §15.
 */
export const PALETTE = {
  ink: '#14110e',
  cream: '#f7efe1',
  'cream-dim': '#eadfcb',
  sand: '#e8d9bc',
  'green-900': '#05221a',
  'green-800': '#0a3527',
  'green-700': '#0f4a35',
  'green-600': '#16674a',
  yellow: '#f9c22e',
  'yellow-dim': '#e0a91b',
  pink: '#ef3e76',
  'pink-dim': '#d22a60',
} as const

export type PaletteToken = keyof typeof PALETTE

/**
 * Foreground/background pairings verified against WCAG 2.1 AA (NFR-014).
 * Numbers are measured, not assumed — see DESIGN_SYSTEM.md §3.3.
 *
 * The important finding: pink is a DISPLAY colour. `pink` on `green-800` is
 * 3.62:1 and `cream` on `pink` is 3.27:1 — both fail AA for body text. Pink
 * surfaces carry `ink` text (5.04:1), never `cream`.
 */
export const CONTRAST_SAFE = {
  /** Passes AA (≥4.5:1) for text at any size. */
  bodyText: [
    ['ink', 'cream'],
    ['ink', 'cream-dim'],
    ['ink', 'sand'],
    ['ink', 'yellow'],
    ['ink', 'pink'],
    ['cream', 'green-900'],
    ['cream', 'green-800'],
    ['cream', 'green-700'],
    ['cream', 'green-600'],
    ['yellow', 'green-900'],
    ['yellow', 'green-800'],
    ['yellow', 'green-700'],
    ['cream-dim', 'green-800'],
    ['yellow-dim', 'green-800'],
  ],
  /** Passes AA-large (≥3:1) only. Restricted to ≥24px, or ≥19px bold. */
  displayOnly: [
    ['pink', 'green-800'],
    ['pink', 'green-900'],
    ['cream', 'pink'],
    ['yellow', 'green-600'],
    ['pink-dim', 'cream'],
  ],
} as const satisfies Record<string, ReadonlyArray<readonly [PaletteToken, PaletteToken]>>
