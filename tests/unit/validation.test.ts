import { describe, expect, it } from 'vitest'
import { MAX_FILE_BYTES, validateRawFile } from '@/features/upload/validate-file'
import {
  MAX_DECODED_PIXELS,
  MIN_SOURCE_EDGE,
  validateDecodedImage,
} from '@/features/upload/validate-decoded-image'
import { sniffImageFormat } from '@/lib/image/sniff-format'

/**
 * Validation is split in two because the two stages answer different
 * questions. These tests mirror that split deliberately — a raw-file test that
 * asserted something about dimensions would be testing a lie.
 */

/** Fixed-length buffer so the type is `Uint8Array<ArrayBuffer>`, which `File` accepts. */
function bytes(...values: number[]): Uint8Array<ArrayBuffer> {
  const buffer = new Uint8Array(new ArrayBuffer(16))
  buffer.set(values)
  return buffer
}

const file = (content: Uint8Array<ArrayBuffer>, name: string, type = '') =>
  new File([content], name, { type })

const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0)
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
const PDF = bytes(0x25, 0x50, 0x44, 0x46, 0x2d)

describe('sniffImageFormat — bytes, never extensions', () => {
  it.each([
    ['jpeg', JPEG],
    ['png', PNG],
    ['unknown', PDF],
  ])('identifies %s', (expected, input) => {
    expect(sniffImageFormat(input)).toBe(expected)
  })

  it('identifies WebP through its RIFF container', () => {
    const webp = new Uint8Array(new ArrayBuffer(16))
    webp.set([0x52, 0x49, 0x46, 0x46], 0) // "RIFF"
    webp.set([0x57, 0x45, 0x42, 0x50], 8) // "WEBP"
    expect(sniffImageFormat(webp)).toBe('webp')
  })

  it.each(['heic', 'mif1', 'heix', 'msf1'])('identifies HEIC brand %s', (brand) => {
    const heic = new Uint8Array(new ArrayBuffer(16))
    heic.set([0x00, 0x00, 0x00, 0x18], 0)
    heic.set(
      [...'ftyp'].map((c) => c.charCodeAt(0)),
      4,
    )
    heic.set(
      [...brand].map((c) => c.charCodeAt(0)),
      8,
    )
    expect(sniffImageFormat(heic)).toBe('heic')
  })
})

describe('validateRawFile — pre-decode only', () => {
  it('accepts a real JPEG', async () => {
    const result = await validateRawFile(file(JPEG, 'photo.jpg', 'image/jpeg'))
    expect(result.ok).toBe(true)
  })

  it('accepts HEIC reported with an empty MIME type, as iOS often does', async () => {
    const heic = new Uint8Array(new ArrayBuffer(16))
    heic.set(
      [...'ftyp'].map((c) => c.charCodeAt(0)),
      4,
    )
    heic.set(
      [...'heic'].map((c) => c.charCodeAt(0)),
      8,
    )
    const result = await validateRawFile(file(heic, 'IMG_0001.HEIC', ''))
    expect(result.ok).toBe(true)
  })

  it('rejects a zero-byte file', async () => {
    const result = await validateRawFile(file(new Uint8Array(0), 'empty.jpg'))
    expect(result).toMatchObject({ ok: false, error: { code: 'FILE_EMPTY' } })
  })

  it('rejects a PDF renamed to .jpg with a matching MIME type', async () => {
    // Extension AND declared type both claim JPEG. Only the bytes disagree.
    const result = await validateRawFile(file(PDF, 'photo.jpg', 'image/jpeg'))
    expect(result).toMatchObject({ ok: false, error: { code: 'UNSUPPORTED_TYPE' } })
  })

  it('rejects an oversized file and states both numbers', async () => {
    const huge = new File([new Uint8Array(16)], 'big.jpg')
    Object.defineProperty(huge, 'size', { value: MAX_FILE_BYTES + 1 })
    const result = await validateRawFile(huge)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('FILE_TOO_LARGE')
      expect(result.error.userMessage).toContain('32.0 MB')
      expect(result.error.recovery).toBe('choose-another-file')
    }
  })
})

describe('validateDecodedImage — post-decode only', () => {
  it('accepts a normal photo at full quality', () => {
    expect(validateDecodedImage(3024, 4032)).toMatchObject({
      ok: true,
      value: { quality: 'ok' },
    })
  })

  it('accepts a small-but-usable image with a soft-quality warning', () => {
    expect(validateDecodedImage(400, 400)).toMatchObject({
      ok: true,
      value: { quality: 'soft' },
    })
  })

  it('uses the SHORTEST edge, so a wide panorama is judged by its height', () => {
    expect(validateDecodedImage(10000, 300)).toMatchObject({
      ok: true,
      value: { quality: 'soft' },
    })
  })

  it('rejects an image below the minimum edge', () => {
    const result = validateDecodedImage(100, 100)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('IMAGE_TOO_SMALL')
      expect(result.error.userMessage).toContain('100×100')
      expect(result.error.userMessage).toContain(String(MIN_SOURCE_EDGE))
    }
  })

  it('rejects a pathological decoded pixel count regardless of file size', () => {
    // FR-061: decoded pixels are the memory risk, not compressed bytes. This
    // input would sail through every raw-file check.
    const edge = Math.ceil(Math.sqrt(MAX_DECODED_PIXELS)) + 1000
    expect(validateDecodedImage(edge, edge)).toMatchObject({
      ok: false,
      error: { code: 'IMAGE_TOO_LARGE' },
    })
  })

  it('rejects nonsensical dimensions from a partial decode', () => {
    expect(validateDecodedImage(0, 0).ok).toBe(false)
    expect(validateDecodedImage(NaN, 100).ok).toBe(false)
  })
})
