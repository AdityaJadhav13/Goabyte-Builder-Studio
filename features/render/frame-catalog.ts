import {
  PFP_HERITAGE_PLATE_PATH,
  PFP_MIDNIGHT_PLATE_PATH,
  PFP_POSTCARD_PLATE_PATH,
} from './assets'
import type { PfpFrameId } from './types'

export interface PfpFrameDefinition {
  readonly id: PfpFrameId
  readonly label: string
  readonly description: string
  readonly platePath: string
  readonly aperture:
    | {
        readonly shape: 'circle'
        readonly centreX: number
        readonly centreY: number
        readonly radius: number
        readonly borderWidth: number
      }
    | {
        readonly shape: 'rounded-rect'
        readonly x: number
        readonly y: number
        readonly width: number
        readonly height: number
        readonly radius: number
        readonly borderWidth: number
      }
  readonly ink: string
  readonly accent: string
  readonly headerBaselineY: number
  readonly footerBaselineY: number
}

/**
 * One catalog drives both the picker thumbnails and the deterministic canvas
 * renderer. A frame can therefore never show one aperture in the UI and cut a
 * different one into the exported PNG.
 */
export const PFP_FRAMES: readonly PfpFrameDefinition[] = [
  {
    id: 'postcard',
    label: 'Coastal postcard',
    description: 'Bright paper, palms and pink registration ink.',
    platePath: PFP_POSTCARD_PLATE_PATH,
    aperture: {
      shape: 'rounded-rect',
      x: 226,
      y: 236,
      width: 628,
      height: 628,
      radius: 48,
      borderWidth: 7,
    },
    ink: '#062a1d',
    accent: '#ef2d70',
    headerBaselineY: 128,
    footerBaselineY: 1011,
  },
  {
    id: 'midnight',
    label: 'Midnight Goa',
    description: 'Neon coastlines on deep tropical ink.',
    platePath: PFP_MIDNIGHT_PLATE_PATH,
    aperture: {
      shape: 'rounded-rect',
      x: 184,
      y: 170,
      width: 715,
      height: 710,
      radius: 54,
      borderWidth: 7,
    },
    ink: '#fff4d6',
    accent: '#f8df00',
    headerBaselineY: 105,
    footerBaselineY: 1012,
  },
  {
    id: 'heritage',
    label: 'Heritage portal',
    description: 'Ornate brass, old Goa and maker folklore.',
    platePath: PFP_HERITAGE_PLATE_PATH,
    aperture: {
      shape: 'circle',
      centreX: 540,
      centreY: 524,
      radius: 291,
      borderWidth: 6,
    },
    ink: '#2b160d',
    accent: '#8d2a1e',
    headerBaselineY: 118,
    footerBaselineY: 1022,
  },
] as const

export const frameById = (id: PfpFrameId): PfpFrameDefinition =>
  PFP_FRAMES.find((frame) => frame.id === id) ?? PFP_FRAMES[0]!
