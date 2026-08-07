import { DESIGN } from '../types'

/**
 * Layout CONFIGURATION for the Slice 1 placeholder. Coordinates only — no
 * drawing code, no branching, no canvas API.
 *
 * The separation from `placeholder.draw.ts` is the point of the whole
 * arrangement: Slice 2 replaces these numbers with Lavitra's production spec
 * without touching a line of drawing logic, and the recording-context tests
 * assert against these named values rather than against magic numbers.
 *
 * Every value is in DESIGN UNITS (1080-space), never CSS or device pixels.
 */

const { width, height } = DESIGN.pfp

export const PLACEHOLDER_LAYOUT = {
  canvas: { width, height },

  /** Full-bleed photo area. The photo is the hero. */
  photo: { x: 0, y: 0, width, height },

  /** Ink keyline around the whole graphic. */
  keyline: { width: 20 },

  /**
   * Nothing may be drawn inside this circle (FR-023). Slice 1 has no
   * decoration to keep out, but the constant is asserted by tests now so that
   * Slice 2's frame art cannot silently violate it.
   */
  subjectSafeZone: { centreX: 540, centreY: 470, radius: 330 },

  /** Bottom lockup bar. Survives as a silhouette at 48px avatar size. */
  bar: { x: 0, y: 912, width, height: 168, ruleWidth: 3 },

  label: {
    x: 48,
    baselineY: 1014,
    fontSize: 40,
    letterSpacing: 4,
    text: 'SLICE 1 · PLACEHOLDER',
  },

  /** Top-right corner mark — verifies positioning and scale independence. */
  cornerMark: { centreX: 960, centreY: 120, radius: 60, strokeWidth: 3 },
} as const
