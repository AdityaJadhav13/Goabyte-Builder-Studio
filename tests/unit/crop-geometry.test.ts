import { describe, expect, it } from 'vitest'
import {
  clampCrop,
  cropToSourceRect,
  effectiveResolution,
  autoFrame,
  VERTICAL_SUBJECT_BIAS,
} from '@/lib/image/crop-geometry'
import { coverFit, containFit } from '@/lib/canvas/cover-fit'

const within = (value: number, expected: number, tolerance = 1e-9) =>
  Math.abs(value - expected) < tolerance

describe('autoFrame — the automatic framing (D-9)', () => {
  it('is deterministic — the same photo always frames identically', () => {
    // With no manual adjustment, a user who re-uploads the same photo must get
    // the same graphic (NFR-035).
    expect(autoFrame(3024, 4032, 1)).toEqual(autoFrame(3024, 4032, 1))
  })

  it('returns the whole image when aspects already match', () => {
    const crop = autoFrame(1000, 1000, 1)
    expect(crop).toEqual({ x: 0, y: 0, width: 1, height: 1 })
  })

  it('crops the sides of a landscape photo, staying centred horizontally', () => {
    const crop = autoFrame(2000, 1000, 1)
    expect(within(crop.width, 0.5)).toBe(true)
    expect(crop.height).toBe(1)
    expect(within(crop.x, 0.25)).toBe(true)
    expect(crop.y).toBe(0)
  })

  it('biases upward on a portrait photo instead of centring', () => {
    const crop = autoFrame(1000, 2000, 1)
    expect(within(crop.height, 0.5)).toBe(true)

    // Centred would be y = 0.25. The bias must sit above that.
    expect(crop.y).toBeLessThan(0.25)
    expect(within(crop.y, VERTICAL_SUBJECT_BIAS - 0.25)).toBe(true)
  })

  it('clamps the bias rather than leaving the image bounds', () => {
    // A very tall image: biased centre would push the top edge negative.
    const crop = autoFrame(1000, 10000, 1)
    expect(crop.y).toBeGreaterThanOrEqual(0)
    expect(crop.y + crop.height).toBeLessThanOrEqual(1)
  })

  it.each([
    [4000, 3000],
    [3000, 4000],
    [10000, 200],
    [200, 10000],
    [1, 1],
  ])('always produces an in-bounds crop for %i×%i', (w, h) => {
    const crop = autoFrame(w, h, 1)
    expect(crop.x).toBeGreaterThanOrEqual(0)
    expect(crop.y).toBeGreaterThanOrEqual(0)
    expect(crop.x + crop.width).toBeLessThanOrEqual(1 + 1e-9)
    expect(crop.y + crop.height).toBeLessThanOrEqual(1 + 1e-9)
  })
})

describe('clampCrop — FR-020, out of bounds is impossible by construction', () => {
  it('leaves a valid crop untouched', () => {
    const crop = { x: 0.1, y: 0.2, width: 0.5, height: 0.5 }
    expect(clampCrop(crop)).toEqual(crop)
  })

  it('pulls a crop that overflows the right edge back into bounds', () => {
    expect(clampCrop({ x: 0.9, y: 0, width: 0.5, height: 0.5 })).toMatchObject({ x: 0.5 })
  })

  it('handles negative origins', () => {
    expect(clampCrop({ x: -0.5, y: -0.5, width: 0.5, height: 0.5 })).toMatchObject({
      x: 0,
      y: 0,
    })
  })

  it('degrades an oversized crop to a valid one rather than an inverted one', () => {
    const clamped = clampCrop({ x: 0, y: 0, width: 5, height: 5 })
    expect(clamped).toEqual({ x: 0, y: 0, width: 1, height: 1 })
  })
})

describe('cropToSourceRect', () => {
  it('converts normalized coordinates to source pixels', () => {
    const rect = cropToSourceRect(
      { x: 0.25, y: 0.5, width: 0.5, height: 0.25 },
      { width: 2000, height: 1000 },
    )
    expect(rect).toEqual({ sx: 500, sy: 500, sw: 1000, sh: 250 })
  })

  it('clamps before converting, so no out-of-bounds drawImage is possible', () => {
    const rect = cropToSourceRect(
      { x: 0.9, y: 0, width: 0.5, height: 1 },
      { width: 1000, height: 1000 },
    )
    expect(rect.sx + rect.sw).toBeLessThanOrEqual(1000)
  })

  it('is resolution-independent — the same crop scales with the image', () => {
    const crop = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
    const small = cropToSourceRect(crop, { width: 1000, height: 1000 })
    const large = cropToSourceRect(crop, { width: 2400, height: 2400 })
    expect(large.sw / small.sw).toBeCloseTo(2.4)
  })
})

describe('effectiveResolution — FR-062', () => {
  const image = { width: 2400, height: 2400 }

  it('reports ok when the crop supplies enough source pixels', () => {
    expect(effectiveResolution({ x: 0, y: 0, width: 1, height: 1 }, image, 1080)).toBe(
      'ok',
    )
  })

  it('reports soft when a tight crop would require upscaling', () => {
    expect(
      effectiveResolution({ x: 0.4, y: 0.4, width: 0.2, height: 0.2 }, image, 1080),
    ).toBe('soft')
  })

  it('is driven by the crop, not the source size — a big photo can still be soft', () => {
    const huge = { width: 8000, height: 8000 }
    expect(effectiveResolution({ x: 0, y: 0, width: 0.1, height: 0.1 }, huge, 1080)).toBe(
      'soft',
    )
  })
})

describe('coverFit / containFit — never distort', () => {
  it('crops the sides of a wide source', () => {
    const rect = coverFit({ width: 2000, height: 1000 }, { width: 100, height: 100 })
    expect(rect).toEqual({ sx: 500, sy: 0, sw: 1000, sh: 1000 })
  })

  it('crops the top and bottom of a tall source', () => {
    const rect = coverFit({ width: 1000, height: 2000 }, { width: 100, height: 100 })
    expect(rect).toEqual({ sx: 0, sy: 500, sw: 1000, sh: 1000 })
  })

  it('preserves the source aspect ratio when containing', () => {
    const fitted = containFit({ width: 1600, height: 900 }, { width: 400, height: 400 })
    expect(fitted.width / fitted.height).toBeCloseTo(1600 / 900)
    expect(fitted.width).toBeLessThanOrEqual(400)
    expect(fitted.height).toBeLessThanOrEqual(400)
  })
})
