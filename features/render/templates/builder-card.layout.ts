import { FONT_STACK } from '../fonts'
import { DESIGN } from '../types'

/**
 * Original GoaByte poster layout for the 1080×1350 Builder ID.
 * Coordinates and typography policy live here; the draw module stays purely
 * concerned with painting those decisions.
 */

const { width, height } = DESIGN['builder-card']
const MARGIN = 64

export const CARD_LAYOUT = {
  canvas: { width, height },
  margin: MARGIN,
  safeRegion: { left: 80, right: width - 80, top: 80, bottom: height - 80 },

  frame: {
    outerWidth: 18,
    glowWidth: 34,
    innerInset: 34,
    innerWidth: 7,
  },

  accentRail: { x: 0, y: 0, width: 26, height },
  accentBlock: { x: width - 270, y: 0, width: 270, height: 48 },
  halftone: {
    x: width - 238,
    y: 74,
    columns: 9,
    rows: 6,
    gap: 22,
    radius: 4,
  },

  eyebrow: {
    x: MARGIN,
    baselineY: 96,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 24,
    letterSpacing: 5,
    text: 'GOABYTE PRESENTS · HH GOA 2026',
  },

  brand: {
    x: MARGIN,
    baselineY: 270,
    fontFamily: FONT_STACK.display,
    fontWeight: 400,
    fontSize: 152,
    letterSpacing: -3,
    text: 'BUILDER',
    strokeWidth: 5,
  },

  brandAccent: {
    rightX: width - MARGIN,
    baselineY: 285,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 54,
    letterSpacing: 2,
    text: 'GOA / 26',
  },

  sun: {
    centreX: width - 116,
    centreY: 154,
    radius: 32,
    rayLength: 23,
    rayCount: 12,
    strokeWidth: 4,
  },

  /** Portrait photo makes the output read as an identity poster, not a banner. */
  photo: { x: MARGIN, y: 360, width: 402, height: 590, borderWidth: 7, radius: 20 },
  photoShadow: { offsetX: 14, offsetY: 14 },
  photoCaptionBar: { height: 64 },
  photoCaption: {
    x: 88,
    baselineY: 928,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: 3,
    text: 'BUILDER / 2026',
  },

  identityPanel: { x: 500, y: 360, width: 516, height: 590, radius: 20, borderWidth: 5 },
  identityDot: { centreX: 966, centreY: 405, radius: 13, strokeWidth: 4 },
  identityLabel: {
    x: 536,
    baselineY: 414,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 19,
    letterSpacing: 4,
    text: 'MEET THE BUILDER',
  },

  name: {
    x: 536,
    topY: 446,
    maxWidth: 438,
    fontFamily: FONT_STACK.display,
    fontWeight: 400,
    fontSize: 60,
    minFontSize: 42,
    maxLines: 2,
    lineHeight: 62,
  },

  roleLabel: {
    x: 536,
    baselineY: 640,
    fontFamily: FONT_STACK.text,
    fontWeight: 500,
    fontSize: 18,
    letterSpacing: 4,
    text: 'WHAT I BUILD',
  },

  role: {
    x: 536,
    topY: 660,
    maxWidth: 438,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 36,
    minFontSize: 26,
    maxLines: 3,
    lineHeight: 42,
  },

  titleChip: {
    x: 536,
    topY: 804,
    height: 66,
    paddingX: 22,
    radius: 4,
    borderWidth: 4,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 25,
    minFontSize: 21,
    maxLines: 1,
    lineHeight: 30,
    letterSpacing: 2,
    maxWidth: 394,
  },

  privacy: {
    x: 536,
    baselineY: 917,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 17,
    letterSpacing: 2,
    text: 'PRIVATE · ON-DEVICE · READY TO POST',
  },

  titleChipReflow: 44,
  roleReflow: 42,

  footer: {
    ruleY: 994,
    ruleWidth: 5,
    x: MARGIN,
    baselineY: 1294,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: 3,
    text: 'GOA, INDIA · 28–31 OCT 2026',
  },

  slogan: {
    x: MARGIN,
    firstBaselineY: 1090,
    secondBaselineY: 1174,
    thirdBaselineY: 1258,
    fontFamily: FONT_STACK.display,
    fontWeight: 400,
    fontSize: 78,
    first: 'BUILD.',
    second: 'CONNECT.',
    third: 'MAKE WAVES.',
  },

  tag: {
    rightX: width - MARGIN,
    baselineY: 1294,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 25,
    letterSpacing: 1,
    text: '#FrameInGoa',
  },

  qrShadow: { x: 781, y: 1033, width: 195, height: 195 },
  qr: {
    x: 769,
    y: 1021,
    size: 195,
    quietModules: 5,
    borderWidth: 5,
  },
  qrLabel: {
    x: 769,
    baselineY: 1248,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: 3,
    text: 'SCAN · BUILD · CONNECT',
  },

  palm: { baseX: 700, baseY: 1238, height: 124, lean: -20, lineWidth: 5 },
  waves: {
    x: 520,
    y: 1192,
    width: 205,
    rows: 5,
    rowGap: 19,
    amplitude: 8,
    segments: 18,
    lineWidth: 4,
  },
  sparkles: [
    { x: 618, y: 1080, radius: 14 },
    { x: 742, y: 1046, radius: 10 },
    { x: 472, y: 978, radius: 9 },
  ],
} as const
