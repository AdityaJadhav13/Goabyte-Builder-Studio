import { describe, expect, it } from 'vitest'
import {
  BUILDER_PLATE_PATH,
  CREW_PLATE_PATH,
  PFP_HERITAGE_PLATE_PATH,
  PFP_MIDNIGHT_PLATE_PATH,
  PFP_POSTCARD_PLATE_PATH,
} from '@/features/render/assets'
import { PFP_FRAMES } from '@/features/render/frame-catalog'
import { renderTemplate } from '@/features/render/render-template'
import { CARD_LAYOUT } from '@/features/render/templates/builder-card.layout'
import { CREW_LAYOUT } from '@/features/render/templates/crew.layout'
import { PFP_LAYOUT } from '@/features/render/templates/pfp.layout'
import {
  DESIGN,
  type BuilderFields,
  type CrewFields,
  type OutputFormat,
  type PfpFrameId,
  type RenderAssets,
  type RenderModel,
} from '@/features/render/types'
import { REQUIRED_HASHTAG } from '@/features/share/share-copy'
import { PALETTE } from '@/lib/brand/palette'
import { createRecordingContext } from '@/lib/canvas/recording-context'
import { createNormalizedImage } from '@/lib/image/normalized-image'

/** Renderer tests assert semantic layout decisions rather than bitmap hashes. */

const ASSETS: RenderAssets = { fonts: 'ready', art: new Map() }
const POSTCARD_PLATE = { id: 'postcard' } as unknown as ImageBitmap
const MIDNIGHT_PLATE = { id: 'midnight' } as unknown as ImageBitmap
const HERITAGE_PLATE = { id: 'heritage' } as unknown as ImageBitmap
const BUILDER_PLATE = { id: 'builder' } as unknown as ImageBitmap
const CREW_PLATE = { id: 'crew' } as unknown as ImageBitmap
const PLATE_ASSETS: RenderAssets = {
  fonts: 'ready',
  art: new Map([
    [PFP_POSTCARD_PLATE_PATH, POSTCARD_PLATE],
    [PFP_MIDNIGHT_PLATE_PATH, MIDNIGHT_PLATE],
    [PFP_HERITAGE_PLATE_PATH, HERITAGE_PLATE],
    [BUILDER_PLATE_PATH, BUILDER_PLATE],
    [CREW_PLATE_PATH, CREW_PLATE],
  ]),
}

const FIELDS: BuilderFields = {
  name: 'Aditya Jadhav',
  role: 'Backend · Architecture',
  team: 'GoaByte',
  title: 'Ships on deadline',
}

const CREW: CrewFields = {
  teamName: 'GoaByte Crew',
  projectUrl: 'https://example.com/goabyte',
  members: [],
}

function model(
  format: OutputFormat,
  fields: BuilderFields | null = null,
  pfpFrame: PfpFrameId = 'postcard',
  crew: CrewFields | null = format === 'crew' ? CREW : null,
): RenderModel {
  return {
    format,
    image: createNormalizedImage({
      source: {} as CanvasImageSource,
      width: 2400,
      height: 2400,
      provenance: {
        originalWidth: 4000,
        originalHeight: 4000,
        mimeType: 'image/jpeg',
        byteSize: 1000,
        heicConverted: false,
        downscaled: true,
      },
      dispose: () => {},
    }),
    crop: { x: 0, y: 0, width: 1, height: 1 },
    fields,
    pfpFrame,
    crew,
  }
}

function render(
  format: OutputFormat,
  scale = 1,
  fields: BuilderFields | null = null,
  assets = ASSETS,
  pfpFrame: PfpFrameId = 'postcard',
  crew: CrewFields | null = format === 'crew' ? CREW : null,
) {
  const rec = createRecordingContext()
  renderTemplate({ ctx: rec.ctx, scale }, model(format, fields, pfpFrame, crew), assets)
  return rec
}

const textOf = (rec: ReturnType<typeof render>) =>
  rec.callsOf('fillText').map((call) => String(call.args[0]))

describe('preview/export parity — every format (NFR-036, D-2)', () => {
  it.each<OutputFormat>(['pfp', 'builder-card', 'crew'])(
    '%s emits identical drawing calls at preview and export scale',
    (format) => {
      const strip = (rec: ReturnType<typeof render>) =>
        rec.calls
          .filter((call) => call.method !== 'setTransform')
          .map((call) => ({
            method: call.method,
            args: call.args,
            fill: call.fillStyle,
            stroke: call.strokeStyle,
          }))

      expect(strip(render(format, 0.45, FIELDS))).toEqual(
        strip(render(format, 1, FIELDS)),
      )
    },
  )

  it.each<OutputFormat>(['pfp', 'builder-card', 'crew'])(
    '%s applies exactly one transform carrying the scale',
    (format) => {
      const transforms = render(format, 0.45, FIELDS).callsOf('setTransform')
      expect(transforms).toHaveLength(1)
      expect(transforms[0]!.args).toEqual([0.45, 0, 0, 0.45, 0, 0])
    },
  )
})

describe('vintage Goa PFP', () => {
  it('paints an opaque base first', () => {
    const first = render('pfp').callsOf('fillRect')[0]!
    expect(first.args).toEqual([0, 0, 1080, 1080])
    expect(first.fillStyle).toBe(PALETTE['green-900'])
  })

  it.each([
    ['postcard', POSTCARD_PLATE],
    ['midnight', MIDNIGHT_PLATE],
    ['heritage', HERITAGE_PLATE],
  ] as const)('registers the %s plate to the full square canvas', (frame, plate) => {
    const firstDraw = render('pfp', 1, null, PLATE_ASSETS, frame).callsOf('drawImage')[0]!
    expect(firstDraw.args[0]).toBe(plate)
    expect(firstDraw.args.slice(1)).toEqual([0, 0, 1080, 1080])
  })

  it.each(PFP_FRAMES)('clips the user photo into the $label aperture', (frame) => {
    const record = render('pfp', 1, null, ASSETS, frame.id)
    expect(record.callsOf('clip')).toHaveLength(1)
    const photo = record.callsOf('drawImage')[0]!

    if (frame.aperture.shape === 'circle') {
      const { centreX, centreY, radius } = frame.aperture
      expect(photo.args.slice(5)).toEqual([
        centreX - radius,
        centreY - radius,
        radius * 2,
        radius * 2,
      ])
      expect(
        record
          .callsOf('arc')
          .some((call) =>
            call.args
              .slice(0, 3)
              .every((value, index) =>
                Object.is(value, [centreX, centreY, radius][index]),
              ),
          ),
      ).toBe(true)
    } else {
      expect(photo.args.slice(5)).toEqual([
        frame.aperture.x,
        frame.aperture.y,
        frame.aperture.width,
        frame.aperture.height,
      ])
    }
  })

  it('exposes three distinct, selectable PFP treatments', () => {
    expect(PFP_FRAMES.map((frame) => frame.id)).toEqual([
      'postcard',
      'midnight',
      'heritage',
    ])
    expect(new Set(PFP_FRAMES.map((frame) => frame.platePath)).size).toBe(3)
  })

  it('carries exact GoaByte branding and the required hashtag', () => {
    const text = textOf(render('pfp')).join(' ')
    expect(text).toContain('HH GOA 2026')
    expect(text).toContain('GOABYTE')
    expect(text).toContain(REQUIRED_HASHTAG)
  })
})

describe('vintage Goa Builder ID', () => {
  it('renders exact name, stack, team and optional title', () => {
    const text = textOf(render('builder-card', 1, FIELDS)).join(' ')
    expect(text).toContain('Aditya Jadhav')
    expect(text).toContain('Backend')
    expect(text).toContain('GoaByte')
    expect(text).toContain('SHIPS ON DEADLINE')
  })

  it('registers the generated portrait plate to 1080×1350', () => {
    const firstDraw = render('builder-card', 1, FIELDS, PLATE_ASSETS).callsOf(
      'drawImage',
    )[0]!
    expect(firstDraw.args.slice(1)).toEqual([0, 0, 1080, 1350])
  })

  it('clips the user photo into the proper rectangular ID aperture', () => {
    const photo = render('builder-card', 1, FIELDS).callsOf('drawImage')[0]!
    const [, , , , , dx, dy, dw, dh] = photo.args as number[]
    expect([dx, dy]).toEqual([CARD_LAYOUT.photo.x, CARD_LAYOUT.photo.y])
    expect(dw).toBe(CARD_LAYOUT.photo.width)
    expect(dh).toBe(CARD_LAYOUT.photo.height)
    expect(dw).not.toBe(dh)
  })

  it('paints the credential heading and event metadata as exact canvas text', () => {
    const text = textOf(render('builder-card', 1, FIELDS))
    expect(text).toContain('HACKER HOUSE')
    expect(text).toContain('GOA 2026')
    expect(text).toContain('OFFICIAL BUILDER CREDENTIAL')
    expect(text).toContain('28–31 OCT · GOA')
  })

  it('paints the real QR matrix and keeps it in the dedicated plaque', () => {
    const record = render('builder-card', 1, FIELDS)
    expect(record.callsOf('fillRect').length).toBeGreaterThan(150)
    expect(CARD_LAYOUT.qr.x + CARD_LAYOUT.qr.size).toBeLessThanOrEqual(
      CARD_LAYOUT.safeRegion.right,
    )
    expect(CARD_LAYOUT.qr.y + CARD_LAYOUT.qr.size).toBeLessThanOrEqual(
      CARD_LAYOUT.safeRegion.bottom,
    )
  })

  it('carries the required hashtag', () => {
    expect(textOf(render('builder-card', 1, FIELDS)).join(' ')).toContain(
      REQUIRED_HASHTAG,
    )
  })

  it('omits only the optional title when it is blank', () => {
    const text = textOf(render('builder-card', 1, { ...FIELDS, title: null }))
    expect(text).not.toContain('Ships on deadline')
    expect(text).toContain('Aditya Jadhav')
    expect(text).toContain('GoaByte')
  })

  it('survives long, emoji and Devanagari identity fields', () => {
    for (const fields of [
      { ...FIELDS, name: 'A'.repeat(64) },
      { ...FIELDS, name: '🚀🔥 Builder 👨‍💻' },
      { ...FIELDS, name: 'आदित्य जाधव', team: 'टीम गोवाबाइट' },
      { ...FIELDS, role: 'TypeScript React Canvas Architecture Product Design' },
    ]) {
      expect(
        render('builder-card', 1, fields).callsOf('fillText').length,
      ).toBeGreaterThan(8)
    }
  })
})

describe('GoaByte Crew Frame', () => {
  it('dispatches the crew renderer at its true 2048×1362 output size', () => {
    const firstDraw = render('crew', 1, FIELDS, PLATE_ASSETS).callsOf('drawImage')[0]!
    expect(firstDraw.args[0]).toBe(CREW_PLATE)
    expect(firstDraw.args.slice(1)).toEqual([0, 0, 2048, 1362])
    expect(CREW_LAYOUT.canvas).toEqual({ width: 2048, height: 1362 })
  })

  it('renders the team, lead builder and required campaign hashtag', () => {
    const text = textOf(render('crew', 1, FIELDS)).join(' ')
    expect(text).toContain('GOABYTE CREW')
    expect(text).toContain('Aditya Jadhav')
    expect(text).toContain('BACKEND · ARCHITECTURE')
    expect(text).toContain(REQUIRED_HASHTAG)
  })
})

describe('layout configuration invariants', () => {
  it('each layout matches its declared export size', () => {
    expect(PFP_LAYOUT.canvas).toEqual(DESIGN.pfp)
    expect(CARD_LAYOUT.canvas).toEqual(DESIGN['builder-card'])
    expect(CREW_LAYOUT.canvas).toEqual(DESIGN.crew)
  })

  it('identity text floors stay readable', () => {
    expect(CARD_LAYOUT.identity.name.value.minFontSize).toBeGreaterThanOrEqual(20)
    expect(CARD_LAYOUT.identity.role.value.minFontSize).toBeGreaterThanOrEqual(20)
    expect(CARD_LAYOUT.identity.team.value.minFontSize).toBeGreaterThanOrEqual(20)
  })
})
