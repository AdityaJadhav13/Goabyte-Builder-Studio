import { FONT_STACK } from '../fonts'
import { DESIGN } from '../types'

/**
 * Text and photo registration for the generated square Goa plate.
 * The artwork is deliberately text-free; every glyph below remains exact,
 * selectable in tests and identical between preview and export.
 */
const { width, height } = DESIGN.pfp

export const PFP_LAYOUT = {
  canvas: { width, height },
  photo: {
    centreX: 540,
    centreY: 524,
    radius: 291,
    x: 249,
    y: 233,
    width: 582,
    height: 582,
    borderWidth: 6,
  },
  subjectSafeZone: { centreX: 540, centreY: 524, radius: 276 },
  topTitle: {
    centreX: 540,
    baselineY: 118,
    fontFamily: FONT_STACK.display,
    fontWeight: 400,
    fontSize: 58,
    letterSpacing: 1,
    text: 'HH GOA 2026',
  },
  topKicker: {
    centreX: 540,
    baselineY: 155,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 17,
    letterSpacing: 5,
    text: 'GOABYTE · MAKER EDITION',
  },
  bottomTitle: {
    centreX: 540,
    baselineY: 989,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 31,
    letterSpacing: 4,
    text: 'BUILD · CONNECT · GROW',
  },
  tag: {
    centreX: 540,
    baselineY: 1022,
    fontFamily: FONT_STACK.text,
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: 1,
    text: '#FrameInGoa',
  },
} as const
