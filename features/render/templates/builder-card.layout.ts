import { FONT_STACK } from '../fonts'
import { DESIGN } from '../types'

/** Registration map for the modern 4:5 lanyard-style Builder ID. */
const { width, height } = DESIGN['builder-card']

const valueStyle = {
  x: 134,
  maxWidth: 548,
  fontFamily: FONT_STACK.text,
  fontWeight: 750,
  fontSize: 31,
  minFontSize: 20,
  maxLines: 1,
  lineHeight: 34,
} as const

const labelStyle = {
  x: 134,
  fontFamily: FONT_STACK.text,
  fontWeight: 800,
  fontSize: 13,
  letterSpacing: 3,
} as const

export const CARD_LAYOUT = {
  canvas: { width, height },
  safeRegion: { left: 52, right: width - 52, top: 38, bottom: height - 24 },
  photo: {
    x: 145,
    y: 315,
    width: 530,
    height: 590,
    radius: 18,
    borderWidth: 7,
  },
  header: {
    centreX: 468,
    line1Y: 159,
    line2Y: 224,
    fontFamily: FONT_STACK.display,
    fontWeight: 400,
    fontSize: 58,
    letterSpacing: 1,
    line1: 'HACKER HOUSE',
    line2: 'GOA 2026',
  },
  headerMeta: {
    centreX: 468,
    /*
     * Was 263, which put the baseline directly on the header panel's bottom
     * keyline — the glyphs sat astride the stroke. 287 clears the panel and
     * still leaves ~28px above the photo well at y=315.
     */
    baselineY: 287,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: 3,
    text: 'BUILDER AT HACKER HOUSE GOA 2026',
  },
  titleChip: {
    x: 128,
    y: 922,
    maxWidth: 420,
    height: 56,
    paddingX: 24,
    radius: 6,
    borderWidth: 4,
    fontFamily: FONT_STACK.text,
    fontWeight: 800,
    fontSize: 21,
    minFontSize: 16,
    maxLines: 1,
    lineHeight: 24,
    letterSpacing: 2,
  },
  /*
   * An opaque plate for the identity column.
   *
   * The front composites text over generated plate artwork, and that artwork
   * carries sparkles and dot clusters inside the cream information panel — a
   * yellow star landed on "STACK / ROLE" and blue dots on the value beneath
   * it. Coordinate-based tests cannot see a collision between baked art and
   * live text, so the surface is guaranteed here rather than hoped for. Same
   * principle as the PFP scrim and the landing panels.
   *
   * Inset from the panel's own border so the plate's frame still reads.
   */
  identityPlate: {
    x: 122,
    y: 1012,
    width: 590,
    height: 262,
    radius: 12,
    fill: '#efe3c8',
  },
  /* Same treatment for the footer ticker: a pink star sat across "SHIP". */
  footerPlate: {
    x: 250,
    y: 1312,
    width: 580,
    height: 34,
    radius: 8,
  },
  identity: {
    name: {
      label: { ...labelStyle, baselineY: 1050, text: 'BUILDER NAME' },
      value: { ...valueStyle, topY: 1062, fontSize: 35, lineHeight: 38 },
    },
    role: {
      label: { ...labelStyle, baselineY: 1142, text: 'STACK / ROLE' },
      value: { ...valueStyle, topY: 1154 },
    },
    team: {
      label: { ...labelStyle, baselineY: 1230, text: 'CREW / TEAM' },
      value: { ...valueStyle, topY: 1242 },
    },
  },
  qr: {
    x: 786,
    y: 1045,
    size: 188,
    quietModules: 4,
    borderWidth: 3,
  },
  qrLabel: {
    centreX: 880,
    baselineY: 1261,
    fontFamily: FONT_STACK.text,
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: 2,
    text: 'SCAN THE BUILD',
  },
  date: {
    centreX: 880,
    baselineY: 1294,
    fontFamily: FONT_STACK.text,
    fontWeight: 750,
    fontSize: 14,
    letterSpacing: 1,
    text: '28–31 OCT · GOA',
  },
  footer: {
    centreX: 540,
    baselineY: 1335,
    fontFamily: FONT_STACK.text,
    fontWeight: 800,
    fontSize: 14,
    letterSpacing: 3,
    text: 'BUILD · CONNECT · SHIP · #FrameInGoa',
  },
} as const
