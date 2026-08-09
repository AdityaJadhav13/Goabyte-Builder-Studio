import { describe, expect, it } from 'vitest'
import {
  BUILDER_STUDIO_QR,
  BUILDER_STUDIO_QR_URL,
  createQrMatrix,
} from '@/lib/qr/qr-matrix'

describe('Builder ID QR matrix', () => {
  it('is deterministic and square', () => {
    const again = createQrMatrix(BUILDER_STUDIO_QR_URL)
    expect(again).toEqual(BUILDER_STUDIO_QR)
    expect(BUILDER_STUDIO_QR.length).toBeGreaterThanOrEqual(21)
    expect(
      BUILDER_STUDIO_QR.every((row) => row.length === BUILDER_STUDIO_QR.length),
    ).toBe(true)
  })

  it('contains the standard top-left finder pattern', () => {
    expect(BUILDER_STUDIO_QR[0]?.slice(0, 7)).toEqual(Array(7).fill(true))
    expect(BUILDER_STUDIO_QR[1]?.slice(0, 7)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
      true,
    ])
    expect(BUILDER_STUDIO_QR[3]?.slice(0, 7)).toEqual([
      true,
      false,
      true,
      true,
      true,
      false,
      true,
    ])
  })
})
