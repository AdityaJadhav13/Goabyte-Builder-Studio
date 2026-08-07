import { FONT_STACK } from '../fonts'
import { DESIGN } from '../types'

/**
 * PFP layout CONFIGURATION. Coordinates and type specs only — no drawing code,
 * no canvas API, no branching.
 *
 * Every value is in DESIGN UNITS (1080-space), never CSS or device pixels.
 * Changing the look means editing this file; `pfp.draw.ts` should not need to
 * change at all.
 *
 * DESIGN_SYSTEM §6.1.
 */

const { width, height } = DESIGN.pfp

export const PFP_LAYOUT = {
  canvas: { width, height },

  /** Full bleed. The photo is the hero (Lavitra §3). */
  photo: { x: 0, y: 0, width, height },

  /** Ink keyline around the whole graphic — the defining structural motif. */
  keyline: { width: 20 },

  /**
   * FR-023: no graphic element may enter this circle. Asserted by test so that
   * a future decoration cannot silently encroach on someone's face.
   */
  subjectSafeZone: { centreX: 540, centreY: 470, radius: 330 },

  /**
   * A gradient scrim behind the lockup. The frame sits over an unknown photo,
   * so legibility cannot be inferred from the image — this is what makes the
   * design work on both a bright beach shot and a dark indoor one.
   */
  scrim: { x: 0, y: 700, width, height: 380 },

  /** Bottom lockup bar. Survives as a silhouette at 48px avatar size. */
  bar: { x: 0, y: 912, width, height: 168, ruleWidth: 4 },

  eventLine: {
    x: 52,
    baselineY: 992,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 40,
    letterSpacing: 5,
    text: 'HACKER HOUSE GOA',
  },

  yearLine: {
    x: 52,
    baselineY: 1046,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 30,
    letterSpacing: 10,
    text: '2026',
  },

  /** Right-aligned hashtag — the thing the whole submission turns on. */
  tag: {
    rightX: width - 52,
    baselineY: 1024,
    fontFamily: FONT_STACK.display,
    fontWeight: 400,
    fontSize: 52,
    text: '#FrameInGoa',
  },

  /**
   * Sun mark, top-right. Sized and placed to clear the subject safe zone —
   * verified by test, not by eye.
   */
  sun: {
    centreX: 928,
    centreY: 152,
    radius: 54,
    rayLength: 34,
    rayCount: 12,
    strokeWidth: 5,
  },

  /** Corner brackets: poster registration marks, cheap and distinctive. */
  corners: { inset: 52, length: 74, width: 8 },
} as const
