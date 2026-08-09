import { FONT_STACK } from '../fonts'
import { DESIGN } from '../types'

/** Original GoaByte square-frame poster, expressed in 1080 design units. */

const { width, height } = DESIGN.pfp

export const PFP_LAYOUT = {
  canvas: { width, height },
  photo: { x: 0, y: 0, width, height },
  keyline: { width: 20, innerInset: 34, innerWidth: 7 },

  subjectSafeZone: { centreX: 540, centreY: 460, radius: 325 },
  scrim: { x: 0, y: 690, width, height: 390 },
  bar: { x: 0, y: 824, width, height: 256, ruleWidth: 12 },

  ticker: { x: 52, y: 52, width: 256, height: 86, borderWidth: 5 },
  tickerTop: {
    x: 72,
    baselineY: 86,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 17,
    letterSpacing: 3,
    text: 'GOABYTE / EDITION',
  },
  tickerMain: {
    x: 72,
    baselineY: 124,
    fontFamily: FONT_STACK.display,
    fontWeight: 400,
    fontSize: 42,
    letterSpacing: 1,
    text: 'GOA 26',
  },

  eventLine: {
    x: 52,
    baselineY: 905,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 30,
    letterSpacing: 7,
    text: 'HACKER HOUSE',
  },
  yearLine: {
    x: 52,
    baselineY: 984,
    fontFamily: FONT_STACK.display,
    fontWeight: 400,
    fontSize: 94,
    letterSpacing: 0,
    text: 'GOA / 2026',
    strokeWidth: 4,
  },
  microLine: {
    x: 52,
    baselineY: 1028,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: 4,
    text: 'BUILD · CONNECT · MAKE WAVES',
  },

  tag: {
    rightX: width - 52,
    baselineY: 916,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 37,
    letterSpacing: 1,
    text: '#FrameInGoa',
  },

  sun: {
    centreX: 928,
    centreY: 152,
    radius: 54,
    rayLength: 34,
    rayCount: 12,
    strokeWidth: 5,
  },

  corners: { inset: 46, length: 88, width: 12 },
  halftone: { x: 60, y: 176, columns: 6, rows: 5, gap: 19, radius: 3 },
  waves: {
    x: 620,
    y: 958,
    width: 410,
    rows: 5,
    rowGap: 18,
    amplitude: 8,
    segments: 20,
    lineWidth: 4,
  },
  sparkles: [
    { x: 360, y: 868, radius: 13 },
    { x: 1002, y: 776, radius: 10 },
  ],
} as const
