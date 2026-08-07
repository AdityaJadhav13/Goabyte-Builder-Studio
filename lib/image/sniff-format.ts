/**
 * Identify an image by its bytes, never by its extension or reported MIME type.
 *
 * PRD FR-003. Both lie routinely: iOS often reports an empty type string, and
 * renaming `report.pdf` to `photo.jpg` is the cheapest way to break a naive
 * uploader.
 *
 * Shared by validation (is this supported?) and decode (is the HEIC fallback
 * relevant?), so the two can never disagree about what a file is.
 */

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'heic' | 'unknown'

/** Bytes needed to identify every format below. */
export const SNIFF_BYTE_COUNT = 16

const startsWith = (bytes: Uint8Array, signature: readonly number[]): boolean =>
  signature.every((byte, i) => bytes[i] === byte)

const ascii = (bytes: Uint8Array, start: number, end: number): string =>
  String.fromCharCode(...bytes.slice(start, end))

export function sniffImageFormat(bytes: Uint8Array): ImageFormat {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg'
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png'
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return 'gif'

  // WebP is a RIFF container: "RIFF" ....(size).... "WEBP"
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') return 'webp'

  // HEIC/HEIF are ISO-BMFF: a 4-byte size, then "ftyp", then a brand.
  if (ascii(bytes, 4, 8) === 'ftyp') {
    const brand = ascii(bytes, 8, 12).toLowerCase()
    if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heif'].includes(brand)) {
      return 'heic'
    }
  }

  return 'unknown'
}

/** Formats the pipeline accepts. GIF is sniffable but not offered. */
export const SUPPORTED_FORMATS: readonly ImageFormat[] = ['jpeg', 'png', 'webp', 'heic']

export const isSupportedFormat = (format: ImageFormat): boolean =>
  SUPPORTED_FORMATS.includes(format)

export async function sniffFile(file: Blob): Promise<ImageFormat> {
  const head = await file.slice(0, SNIFF_BYTE_COUNT).arrayBuffer()
  return sniffImageFormat(new Uint8Array(head))
}
