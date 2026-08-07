import { appError } from '@/lib/errors/app-error'
import { fail, ok, type ValidationResult } from './validate-file'

/**
 * POST-DECODE validation. Everything that only becomes knowable once real
 * pixel dimensions exist.
 *
 * Kept separate from raw-file validation because the two answer genuinely
 * different questions, fail for different reasons, and — critically — because
 * a raw-file check that pretended to know dimensions would be guessing.
 *
 * PRD FR-005, FR-006, FR-061.
 */

/** FR-005. Below this, a 1080px export is visibly mushy. */
export const MIN_SOURCE_EDGE = 256

/** FR-006. Accepted, but the user is warned the result may look soft. */
export const SOFT_QUALITY_EDGE = 512

/**
 * Pathological decoded size guard (FR-061).
 *
 * This is the real memory ceiling, expressed in the unit that actually costs
 * memory. 80 MP ≈ 320 MB of raw RGBA — already past what a phone will tolerate,
 * and far past anything a camera produces. A file can clear the 32 MB size
 * limit and still land here: that is the point.
 *
 * PROVISIONAL: SPIKE-2 measures the real device ceiling.
 */
export const MAX_DECODED_PIXELS = 80_000_000

export type ImageQuality = 'ok' | 'soft'

export interface DecodedImageAssessment {
  readonly quality: ImageQuality
}

export function validateDecodedImage(
  width: number,
  height: number,
): ValidationResult<DecodedImageAssessment> {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return fail(appError('DECODE_FAILED', { cause: `bad dimensions ${width}×${height}` }))
  }

  if (width * height > MAX_DECODED_PIXELS) {
    return fail(appError('IMAGE_TOO_LARGE', { cause: `${width * height} px decoded` }))
  }

  const shortestEdge = Math.min(width, height)

  if (shortestEdge < MIN_SOURCE_EDGE) {
    return fail(appError('IMAGE_TOO_SMALL', { width, height, minEdge: MIN_SOURCE_EDGE }))
  }

  return ok({ quality: shortestEdge < SOFT_QUALITY_EDGE ? 'soft' : 'ok' })
}
