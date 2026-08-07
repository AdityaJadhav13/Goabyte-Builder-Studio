import { describe, expect, it } from 'vitest'
import { renderTemplate } from '@/features/render/render-template'
import { PLACEHOLDER_LAYOUT as L } from '@/features/render/templates/placeholder.layout'
import { DESIGN, type RenderAssets, type RenderModel } from '@/features/render/types'
import { createRecordingContext } from '@/lib/canvas/recording-context'
import { PALETTE } from '@/lib/brand/palette'
import { createNormalizedImage } from '@/lib/image/normalized-image'

/**
 * Renderer tests assert LAYOUT DECISIONS, not pixels (D-5, ADR-5). No
 * node-canvas, no golden images, no PNG byte hashes — canvas encoding is
 * implementation-dependent and a pixel test would fail for reasons unrelated
 * to our correctness.
 */

const ASSETS: RenderAssets = { fonts: 'ready', art: new Map() }

function model(overrides: Partial<RenderModel> = {}): RenderModel {
  const image = createNormalizedImage({
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
  })

  return {
    format: 'pfp',
    image,
    crop: { x: 0, y: 0, width: 1, height: 1 },
    ...overrides,
  }
}

function render(scale: number, m: RenderModel = model()) {
  const rec = createRecordingContext()
  renderTemplate({ ctx: rec.ctx, scale }, m, ASSETS)
  return rec
}

describe('renderTemplate — transform and scale', () => {
  it('applies exactly one transform, carrying the scale', () => {
    const rec = render(0.45)
    const transforms = rec.callsOf('setTransform')

    expect(transforms).toHaveLength(1)
    expect(transforms[0]!.args).toEqual([0.45, 0, 0, 0.45, 0, 0])
  })

  it('brackets the render in save/restore so it cannot leak canvas state', () => {
    const rec = render(1)
    expect(rec.calls[0]!.method).toBe('save')
    expect(rec.calls.at(-1)!.method).toBe('restore')
  })

  it('emits IDENTICAL drawing calls at preview and export scale', () => {
    // The core parity guarantee (NFR-036, D-2): preview and export differ only
    // by the transform. If this ever fails, the two have diverged.
    const strip = (rec: ReturnType<typeof render>) =>
      rec.calls
        .filter((c) => c.method !== 'setTransform')
        .map((c) => ({ method: c.method, args: c.args, fill: c.fillStyle }))

    expect(strip(render(0.45))).toEqual(strip(render(1)))
  })
})

describe('drawPlaceholder — layout decisions', () => {
  it('paints an opaque base before anything else, so exports are never transparent', () => {
    const rec = render(1)
    const firstFill = rec.callsOf('fillRect')[0]!

    expect(firstFill.args).toEqual([0, 0, L.canvas.width, L.canvas.height])
    expect(firstFill.fillStyle).toBe(PALETTE['green-900'])
  })

  it('draws the photo full bleed at the design size', () => {
    const draws = render(1).callsOf('drawImage')
    expect(draws).toHaveLength(1)

    const [, , , , , dx, dy, dw, dh] = draws[0]!.args as number[]
    expect([dx, dy, dw, dh]).toEqual([
      L.photo.x,
      L.photo.y,
      L.photo.width,
      L.photo.height,
    ])
  })

  it('derives the source rect from the crop', () => {
    const cropped = model({ crop: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 } })
    const [, sx, sy, sw, sh] = render(1, cropped).callsOf('drawImage')[0]!
      .args as number[]

    // 2400px working image, quarter-inset crop.
    expect([sx, sy, sw, sh]).toEqual([600, 600, 1200, 1200])
  })

  it('keeps the keyline stroke fully inside the canvas', () => {
    const stroke = render(1).callsOf('strokeRect')[0]!
    const [x, y, w, h] = stroke.args as number[]

    // strokeRect centres the stroke on the path, so a half-width inset is
    // what keeps it from being clipped at the edge.
    expect(x).toBe(L.keyline.width / 2)
    expect(y).toBe(L.keyline.width / 2)
    expect(x! - L.keyline.width / 2).toBeGreaterThanOrEqual(0)
    expect(x! + w! + L.keyline.width / 2).toBeLessThanOrEqual(L.canvas.width)
    expect(y! + h! + L.keyline.width / 2).toBeLessThanOrEqual(L.canvas.height)
    expect(stroke.lineWidth).toBe(L.keyline.width)
  })

  it('draws the lockup bar at the configured position', () => {
    const bar = render(1)
      .callsOf('fillRect')
      .find((c) => (c.args as number[])[1] === L.bar.y)

    expect(bar).toBeDefined()
    expect(bar!.args).toEqual([L.bar.x, L.bar.y, L.bar.width, L.bar.height])
  })

  it('draws the label inside the bar, not outside it', () => {
    const text = render(1).callsOf('fillText')[0]!
    const [, x, baselineY] = text.args as [string, number, number]

    expect(x).toBe(L.label.x)
    expect(baselineY).toBeGreaterThan(L.bar.y)
    expect(baselineY).toBeLessThan(L.bar.y + L.bar.height)
  })

  it('uses ink for the keyline — the structural motif, not a soft shadow', () => {
    expect(render(1).callsOf('strokeRect')[0]!.strokeStyle).toBe(PALETTE.ink)
  })
})

describe('subject safe zone — FR-023', () => {
  it('keeps every drawn decoration clear of the face area', () => {
    // Slice 1 has only the corner mark to keep out, but asserting it now means
    // Slice 2's frame art cannot silently encroach on the subject.
    const zone = L.subjectSafeZone
    const mark = L.cornerMark

    const distance = Math.hypot(mark.centreX - zone.centreX, mark.centreY - zone.centreY)
    expect(distance).toBeGreaterThan(zone.radius + mark.radius)
  })

  it('keeps the lockup bar below the safe zone', () => {
    expect(L.bar.y).toBeGreaterThan(L.subjectSafeZone.centreY + L.subjectSafeZone.radius)
  })
})

describe('layout configuration invariants', () => {
  it('matches the declared export size', () => {
    expect(L.canvas).toEqual(DESIGN.pfp)
  })

  it('places the bar flush with the bottom edge', () => {
    expect(L.bar.y + L.bar.height).toBe(L.canvas.height)
  })

  it('keeps the corner mark fully on canvas', () => {
    expect(L.cornerMark.centreX + L.cornerMark.radius).toBeLessThanOrEqual(L.canvas.width)
    expect(L.cornerMark.centreY - L.cornerMark.radius).toBeGreaterThanOrEqual(0)
  })
})
