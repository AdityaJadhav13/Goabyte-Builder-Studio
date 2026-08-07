import { PALETTE } from '@/lib/brand/palette'
import { createSurface, releaseSurface, toPngBlob } from '@/lib/canvas/surface'
import { appError } from '@/lib/errors/app-error'
import type { DecodedImage } from '@/lib/image/decode'
import { createNormalizedImage, type NormalizedImage } from '@/lib/image/normalized-image'

/**
 * Decoded pixels → the one canonical working image.
 *
 * Three jobs, each closing a specific failure mode:
 *   1. Cap the size          — keeps iOS from killing the tab (R1, FR-012)
 *   2. Flatten onto opaque   — transparent PNGs would otherwise export with
 *                              transparent regions that look broken in X's
 *                              dark mode (FR-013)
 *   3. Produce a preview URL — react-easy-crop needs a URL, not a drawable
 *
 * Orientation is NOT handled here. It was applied exactly once at decode.
 */

/**
 * FR-012. 2400px is ~2.2× the 1080px export, which is ample supersampling
 * headroom while staying far inside every canvas limit we expect to meet.
 * PROVISIONAL: SPIKE-2 confirms the ceiling on real hardware.
 */
export const WORKING_MAX_EDGE = 2400

/**
 * Stepwise halving. A single large minification aliases badly because browser
 * bilinear sampling only reads a 2×2 neighbourhood — halving repeatedly until
 * within 2× of target, then resizing once more, is materially sharper for a
 * few milliseconds of work (NFR-032).
 */
function downscale(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): HTMLCanvasElement {
  let current = createSurface(sourceWidth, sourceHeight)
  current.ctx.drawImage(source, 0, 0, sourceWidth, sourceHeight)

  let width = sourceWidth
  let height = sourceHeight

  while (width > targetWidth * 2) {
    width = Math.max(targetWidth, Math.round(width / 2))
    height = Math.max(targetHeight, Math.round(height / 2))

    const next = createSurface(width, height)
    next.ctx.drawImage(current.canvas, 0, 0, width, height)
    releaseSurface(current.canvas)
    current = next
  }

  if (width === targetWidth && height === targetHeight) {
    return current.canvas
  }

  const final = createSurface(targetWidth, targetHeight)
  final.ctx.drawImage(current.canvas, 0, 0, targetWidth, targetHeight)
  releaseSurface(current.canvas)
  return final.canvas
}

export async function normalizeImage(
  decoded: DecodedImage,
  file: File,
): Promise<NormalizedImage> {
  const longestEdge = Math.max(decoded.width, decoded.height)
  const scale = Math.min(1, WORKING_MAX_EDGE / longestEdge)
  const width = Math.max(1, Math.round(decoded.width * scale))
  const height = Math.max(1, Math.round(decoded.height * scale))

  // The opaque base must be painted BEFORE the photo, so a transparent source
  // composites onto brand colour rather than onto nothing.
  const working = createSurface(width, height)
  working.ctx.fillStyle = PALETTE['green-900']
  working.ctx.fillRect(0, 0, width, height)

  if (scale < 1) {
    const scaled = downscale(decoded.source, decoded.width, decoded.height, width, height)
    working.ctx.drawImage(scaled, 0, 0)
    releaseSurface(scaled)
  } else {
    working.ctx.drawImage(decoded.source, 0, 0, width, height)
  }

  // The decoded original is no longer needed; holding it alongside the working
  // copy is exactly the two-full-resolution-decodes state that kills iOS tabs.
  decoded.close()

  let previewUrl: string
  try {
    previewUrl = URL.createObjectURL(await toPngBlob(working.canvas))
  } catch (cause) {
    releaseSurface(working.canvas)
    throw appError('DECODE_FAILED', { cause })
  }

  return createNormalizedImage({
    source: working.canvas,
    previewUrl,
    width,
    height,
    provenance: {
      originalWidth: decoded.width,
      originalHeight: decoded.height,
      mimeType: file.type || 'unknown',
      byteSize: file.size,
      heicConverted: decoded.heicConverted,
      downscaled: scale < 1,
    },
    // Both resources, one disposal (FR-015).
    dispose: () => {
      URL.revokeObjectURL(previewUrl)
      releaseSurface(working.canvas)
    },
  })
}
