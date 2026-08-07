import { appError } from '@/lib/errors/app-error'
import { sniffFile } from '@/lib/image/sniff-format'

/**
 * File → drawable pixels, upright, whatever the source format.
 *
 * PROVISIONAL — gated on SPIKE-1 (PRD §11.1, D-7).
 *
 * The native-first ordering below is a HYPOTHESIS about createImageBitmap's
 * behaviour with HEIC, not an established fact. SPIKE-1 may reorder the
 * branches or make them capability-selected. It may NOT change this module's
 * public shape: callers get a DecodedImage and never learn which path ran.
 *
 * FR-009, FR-010, FR-011.
 */

export interface DecodedImage {
  readonly source: CanvasImageSource
  readonly width: number
  readonly height: number
  readonly heicConverted: boolean
  /** Frees the decoded pixels. Must be called once normalization has copied them. */
  close(): void
}

function fromBitmap(bitmap: ImageBitmap, heicConverted: boolean): DecodedImage {
  return {
    source: bitmap,
    width: bitmap.width,
    height: bitmap.height,
    heicConverted,
    close: () => bitmap.close(),
  }
}

/**
 * `imageOrientation: 'from-image'` is passed EXPLICITLY rather than relying on
 * the default, which has varied across browsers and versions. This is the one
 * and only place EXIF orientation is applied (FR-011) — every consumer
 * downstream receives upright pixels and contains no rotation logic.
 */
const decodeNative = (blob: Blob): Promise<ImageBitmap> =>
  createImageBitmap(blob, { imageOrientation: 'from-image' })

/**
 * Fallback for browsers without createImageBitmap. <img> applies EXIF
 * orientation itself (`image-orientation: from-image` is the CSS default), so
 * both paths converge on the same guarantee.
 */
async function decodeViaImageElement(blob: Blob): Promise<DecodedImage> {
  const url = URL.createObjectURL(blob)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      heicConverted: false,
      close: () => URL.revokeObjectURL(url),
    }
  } catch (cause) {
    URL.revokeObjectURL(url)
    throw appError('DECODE_FAILED', { cause })
  }
}

/**
 * Loaded only after a native decode of a HEIC has actually failed (FR-010).
 * ~1.4 MB that most users never download — on browsers with native HEIC
 * support, and for everyone uploading JPG or PNG, this import never runs.
 */
async function convertHeic(file: File): Promise<Blob> {
  try {
    const { default: heic2any } = await import('heic2any')
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
    return Array.isArray(converted) ? converted[0]! : converted
  } catch (cause) {
    throw appError('HEIC_UNSUPPORTED', { cause })
  }
}

export async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap !== 'function') {
    return decodeViaImageElement(file)
  }

  try {
    return fromBitmap(await decodeNative(file), false)
  } catch (nativeFailure) {
    // Only HEIC has a second chance. Anything else is genuinely unreadable,
    // and pulling in a 1.4 MB converter to confirm that would be wasteful.
    if ((await sniffFile(file)) !== 'heic') {
      throw appError('DECODE_FAILED', { cause: nativeFailure })
    }

    const jpeg = await convertHeic(file)
    try {
      return fromBitmap(await decodeNative(jpeg), true)
    } catch (cause) {
      throw appError('DECODE_FAILED', { cause })
    }
  }
}
