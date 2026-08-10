import { FONT_STACK } from '../fonts'
import { DESIGN } from '../types'
import { HH_GOA_CAMPAIGN } from '@/lib/brand/campaign'

const { width, height } = DESIGN.crew

export interface CrewMemberPlacement {
  readonly centreX: number
  readonly centreY: number
  readonly radius: number
  readonly nameY: number
  readonly roleY: number
}

export const CREW_MEMBER_LAYOUTS: Readonly<
  Record<number, readonly CrewMemberPlacement[]>
> = {
  1: [{ centreX: 1024, centreY: 720, radius: 215, nameY: 980, roleY: 1030 }],
  2: [
    { centreX: 680, centreY: 715, radius: 180, nameY: 940, roleY: 985 },
    { centreX: 1368, centreY: 715, radius: 180, nameY: 940, roleY: 985 },
  ],
  3: [
    { centreX: 550, centreY: 705, radius: 155, nameY: 905, roleY: 948 },
    { centreX: 1024, centreY: 705, radius: 155, nameY: 905, roleY: 948 },
    { centreX: 1498, centreY: 705, radius: 155, nameY: 905, roleY: 948 },
  ],
  4: [
    { centreX: 430, centreY: 700, radius: 140, nameY: 885, roleY: 925 },
    { centreX: 826, centreY: 700, radius: 140, nameY: 885, roleY: 925 },
    { centreX: 1222, centreY: 700, radius: 140, nameY: 885, roleY: 925 },
    { centreX: 1618, centreY: 700, radius: 140, nameY: 885, roleY: 925 },
  ],
}

export const CREW_LAYOUT = {
  canvas: { width, height },
  header: {
    centreX: 975,
    baselineY: 165,
    maxWidth: 1390,
    fontFamily: FONT_STACK.display,
    fontWeight: 400,
    fontSize: 78,
    minFontSize: 54,
    lineHeight: 80,
    text: HH_GOA_CAMPAIGN,
  },
  team: {
    centreX: 1024,
    baselineY: 390,
    maxWidth: 1540,
    fontFamily: FONT_STACK.display,
    fontWeight: 400,
    fontSize: 128,
    minFontSize: 66,
    lineHeight: 130,
  },
  kicker: {
    centreX: 1024,
    baselineY: 445,
    fontFamily: FONT_STACK.text,
    fontWeight: 800,
    fontSize: 22,
    letterSpacing: 6,
    text: 'BUILD TOGETHER · SHIP FROM GOA',
  },
  qr: { x: 1727, y: 46, size: 164, quietModules: 4, borderWidth: 3 },
  qrLabel: {
    centreX: 1809,
    baselineY: 227,
    fontFamily: FONT_STACK.text,
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: 2,
    text: 'MEET THE CREW',
  },
  memberName: {
    fontFamily: FONT_STACK.display,
    fontWeight: 400,
    fontSize: 48,
    minFontSize: 27,
    lineHeight: 50,
  },
  memberRole: {
    fontFamily: FONT_STACK.text,
    fontWeight: 800,
    fontSize: 20,
    minFontSize: 14,
    lineHeight: 22,
  },
  footer: {
    centreX: 1024,
    baselineY: 1272,
    fontFamily: FONT_STACK.text,
    fontWeight: 800,
    fontSize: 28,
    letterSpacing: 5,
    text: 'CREW MODE · COLLABORATE · INNOVATE · LAUNCH · #FrameInGoa',
  },
} as const
