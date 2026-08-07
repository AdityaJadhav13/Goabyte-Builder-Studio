import { describe, expect, it } from 'vitest'
import { renderTemplate } from '@/features/render/render-template'
import { PFP_LAYOUT } from '@/features/render/templates/pfp.layout'
import { CARD_LAYOUT } from '@/features/render/templates/builder-card.layout'
import {
  DESIGN,
  type BuilderFields,
  type OutputFormat,
  type RenderAssets,
  type RenderModel,
} from '@/features/render/types'
import { createRecordingContext } from '@/lib/canvas/recording-context'
import { PALETTE } from '@/lib/brand/palette'
import { createNormalizedImage } from '@/lib/image/normalized-image'
import { REQUIRED_HASHTAG } from '@/features/share/share-copy'

/**
 * Renderer tests assert LAYOUT DECISIONS, not pixels (D-5, ADR-5).
 */

const ASSETS: RenderAssets = { fonts: 'ready', art: new Map() }

const FIELDS: BuilderFields = {
  name: 'Aditya Jadhav',
  role: 'Backend · Architecture',
  title: 'Ships on deadline',
}

function model(format: OutputFormat, fields: BuilderFields | null = null): RenderModel {
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
  }
}

function render(format: OutputFormat, scale = 1, fields: BuilderFields | null = null) {
  const rec = createRecordingContext()
  renderTemplate({ ctx: rec.ctx, scale }, model(format, fields), ASSETS)
  return rec
}

const textOf = (rec: ReturnType<typeof render>) =>
  rec.callsOf('fillText').map((c) => String(c.args[0]))

describe('preview/export parity — both formats (NFR-036, D-2)', () => {
  it.each<OutputFormat>(['pfp', 'builder-card'])(
    '%s emits identical drawing calls at preview and export scale',
    (format) => {
      const strip = (rec: ReturnType<typeof render>) =>
        rec.calls
          .filter((c) => c.method !== 'setTransform')
          .map((c) => ({ m: c.method, a: c.args, f: c.fillStyle, s: c.strokeStyle }))

      expect(strip(render(format, 0.45, FIELDS))).toEqual(
        strip(render(format, 1, FIELDS)),
      )
    },
  )

  it.each<OutputFormat>(['pfp', 'builder-card'])(
    '%s applies exactly one transform carrying the scale',
    (format) => {
      const transforms = render(format, 0.45, FIELDS).callsOf('setTransform')
      expect(transforms).toHaveLength(1)
      expect(transforms[0]!.args).toEqual([0.45, 0, 0, 0.45, 0, 0])
    },
  )
})

describe('PFP frame', () => {
  it('paints an opaque base first, so exports are never transparent', () => {
    const first = render('pfp').callsOf('fillRect')[0]!
    expect(first.args).toEqual([0, 0, PFP_LAYOUT.canvas.width, PFP_LAYOUT.canvas.height])
    expect(first.fillStyle).toBe(PALETTE['green-900'])
  })

  it('draws the photo full bleed', () => {
    const draws = render('pfp').callsOf('drawImage')
    expect(draws).toHaveLength(1)
    const [, , , , , dx, dy, dw, dh] = draws[0]!.args as number[]
    expect([dx, dy, dw, dh]).toEqual([0, 0, 1080, 1080])
  })

  it('carries the required hashtag into the graphic itself', () => {
    expect(textOf(render('pfp')).join(' ')).toContain(REQUIRED_HASHTAG)
  })

  it('lays a scrim behind the lockup so it reads over any photo', () => {
    // Without this the frame is illegible on a bright beach shot.
    expect(render('pfp').callsOf('createLinearGradient')).toHaveLength(1)
  })

  it('keeps the keyline stroke fully inside the canvas', () => {
    const stroke = render('pfp').callsOf('strokeRect').at(-1)!
    const [x, y, w, h] = stroke.args as number[]
    expect(x).toBe(PFP_LAYOUT.keyline.width / 2)
    expect(x! + w! + PFP_LAYOUT.keyline.width / 2).toBeLessThanOrEqual(1080)
    expect(y! + h! + PFP_LAYOUT.keyline.width / 2).toBeLessThanOrEqual(1080)
  })

  it('keeps every decoration clear of the subject safe zone — FR-023', () => {
    const zone = PFP_LAYOUT.subjectSafeZone
    const sun = PFP_LAYOUT.sun
    const distance = Math.hypot(sun.centreX - zone.centreX, sun.centreY - zone.centreY)
    expect(distance).toBeGreaterThan(zone.radius + sun.radius + sun.rayLength)
    expect(PFP_LAYOUT.bar.y).toBeGreaterThan(zone.centreY + zone.radius)
  })
})

describe('Builder ID card', () => {
  it('renders name, role and title', () => {
    const text = textOf(render('builder-card', 1, FIELDS)).join(' ')
    expect(text).toContain('Aditya Jadhav')
    expect(text).toContain('Backend')
    expect(text).toContain('Ships on deadline')
  })

  it('carries the required hashtag', () => {
    expect(textOf(render('builder-card', 1, FIELDS)).join(' ')).toContain(
      REQUIRED_HASHTAG,
    )
  })

  it('keeps identity content inside the central safe region — FR-027', () => {
    const { safeRegion } = CARD_LAYOUT
    expect(CARD_LAYOUT.photo.x).toBeGreaterThanOrEqual(
      safeRegion.left - CARD_LAYOUT.margin,
    )
    expect(CARD_LAYOUT.name.x).toBeGreaterThanOrEqual(
      safeRegion.left - CARD_LAYOUT.margin,
    )
    expect(CARD_LAYOUT.photo.y + CARD_LAYOUT.photo.height).toBeLessThanOrEqual(
      safeRegion.bottom,
    )
  })

  it('omits the chip and reflows when there is no builder title — FR-033', () => {
    const withTitle = render('builder-card', 1, FIELDS)
    const without = render('builder-card', 1, { ...FIELDS, title: null })

    expect(textOf(withTitle)).toContain('Ships on deadline')
    expect(textOf(without)).not.toContain('Ships on deadline')

    // The footer moves UP rather than leaving a hole.
    const footerY = (rec: ReturnType<typeof render>) =>
      Math.max(...rec.callsOf('fillText').map((c) => Number(c.args[2])))
    expect(footerY(without)).toBeLessThan(footerY(withTitle))
  })

  it('draws the title chip with INK text, never cream — DESIGN_SYSTEM §3.3', () => {
    // cream-on-pink is 3.27:1 and fails AA. This is the pairing most likely to
    // be got wrong by someone working from a screenshot.
    const chipText = render('builder-card', 1, FIELDS)
      .callsOf('fillText')
      .find((c) => String(c.args[0]).includes('Ships on deadline'))
    expect(chipText!.fillStyle).toBe(PALETTE.ink)
  })

  it('never distorts the photo — cover-fit preserves aspect', () => {
    const [, , , sw, sh, , , dw, dh] = render('builder-card', 1, FIELDS).callsOf(
      'drawImage',
    )[0]!.args as number[]
    expect(sw! / sh!).toBeCloseTo(dw! / dh!, 2)
  })

  it('survives a long name, an emoji name and a Devanagari name', () => {
    for (const name of ['A'.repeat(64), '🚀🔥 Builder 👨‍💻', 'आदित्य जाधव']) {
      const rec = render('builder-card', 1, { ...FIELDS, name })
      expect(rec.callsOf('fillText').length).toBeGreaterThan(3)
    }
  })
})

describe('layout configuration invariants', () => {
  it('each layout matches its declared export size', () => {
    expect(PFP_LAYOUT.canvas).toEqual(DESIGN.pfp)
    expect(CARD_LAYOUT.canvas).toEqual(DESIGN['builder-card'])
  })

  it('font floors are below their design sizes', () => {
    expect(CARD_LAYOUT.name.minFontSize).toBeLessThan(CARD_LAYOUT.name.fontSize)
    expect(CARD_LAYOUT.role.minFontSize).toBeLessThan(CARD_LAYOUT.role.fontSize)
  })

  it('no on-card text floor drops below a readable size at timeline scale', () => {
    expect(CARD_LAYOUT.role.minFontSize).toBeGreaterThanOrEqual(24)
    expect(CARD_LAYOUT.titleChip.minFontSize).toBeGreaterThanOrEqual(20)
  })
})
