import { FONT_STACK } from '../fonts'
import { DESIGN } from '../types'

/**
 * Builder ID card layout CONFIGURATION. Coordinates and type specs only.
 *
 * 1080×1350 (4:5) per D-4. DESIGN_SYSTEM §6.2.
 *
 * Text fields carry their own floor and line budget: policy lives here, the
 * fitting mechanism lives in `lib/canvas/fit-text.ts`.
 */

const { width, height } = DESIGN['builder-card']
const MARGIN = 64

export const CARD_LAYOUT = {
  canvas: { width, height },
  margin: MARGIN,

  /**
   * FR-027. A conservative central safe region, justified by UI overlays,
   * repost and embed contexts, thumbnail treatments and future changes to
   * platform presentation — NOT by any one platform's current crop behaviour
   * (D-4). Photo, name and role stay inside it.
   */
  safeRegion: { left: 80, right: width - 80, top: 80, bottom: height - 80 },

  eyebrow: {
    x: MARGIN,
    baselineY: 108,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 26,
    letterSpacing: 5,
    text: 'HACKER HOUSE GOA 2026',
  },

  /** Photo well, 5:4. Automatic framing targets this aspect, not the canvas. */
  photo: { x: MARGIN, y: 152, width: 952, height: 760, borderWidth: 4 },

  name: {
    x: MARGIN,
    topY: 952,
    maxWidth: width - MARGIN * 2,
    fontFamily: FONT_STACK.display,
    fontWeight: 400,
    fontSize: 88,
    minFontSize: 56,
    maxLines: 2,
    lineHeight: 92,
  },

  role: {
    x: MARGIN,
    topY: 1088,
    maxWidth: width - MARGIN * 2,
    fontFamily: FONT_STACK.text,
    fontWeight: 500,
    fontSize: 34,
    minFontSize: 26,
    maxLines: 2,
    lineHeight: 42,
  },

  /**
   * Builder title chip. Pink fill with INK text — `cream` on `pink` measures
   * 3.27:1 and fails AA (DESIGN_SYSTEM §3.3). This is the single pairing most
   * likely to be got wrong by someone working from a screenshot.
   */
  titleChip: {
    x: MARGIN,
    topY: 1172,
    height: 60,
    paddingX: 26,
    radius: 4,
    borderWidth: 3,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 26,
    minFontSize: 22,
    maxLines: 1,
    lineHeight: 30,
    letterSpacing: 2,
    maxWidth: width - MARGIN * 2 - 52,
  },

  /**
   * Vertical distance everything below moves UP when a block is absent.
   *
   * Both the role and the title are optional, and reserving their space when
   * they are empty leaves a visible hole — a card with a name and nothing else
   * looked broken rather than minimal. The layout closes up instead (FR-033).
   */
  titleChipReflow: 96,
  roleReflow: 84,

  footer: {
    ruleY: 1266,
    ruleWidth: 3,
    x: MARGIN,
    baselineY: 1318,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 24,
    letterSpacing: 3,
    text: 'BUILDER STUDIO · BY GOABYTE',
  },

  tag: {
    rightX: width - MARGIN,
    baselineY: 1318,
    fontFamily: FONT_STACK.display,
    fontWeight: 400,
    fontSize: 40,
    text: '#FrameInGoa',
  },

  sun: {
    centreX: width - MARGIN - 34,
    centreY: 92,
    radius: 30,
    rayLength: 20,
    rayCount: 12,
    strokeWidth: 4,
  },
} as const
