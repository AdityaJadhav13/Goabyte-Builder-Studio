import type { SourceRect } from '@/lib/canvas/cover-fit'

/**
 * All crop maths. Pure, DOM-free, and the highest-value unit-test target in
 * the codebase — a subtly wrong crop looks *nearly* right and survives review.
 *
 * Crops are stored in NORMALIZED 0–1 coordinates relative to the working image
 * (FR-019). Not pixels: pixel coordinates are implicitly bound to a resolution,
 * so changing WORKING_MAX_EDGE would silently change what a stored crop means.
 */

export interface CropRect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface ImageDimensions {
  readonly width: number
  readonly height: number
}

/**
 * Faces sit above the geometric centre in portrait photographs, so a true
 * centre crop routinely cuts foreheads. Biasing the default crop centre to 42%
 * of image height produces a good result for the majority who never touch the
 * cropper — which, on mobile, is most people.
 *
 * No face detection: the FaceDetector API is Chromium-flag-only and not a real
 * option. This costs nothing and is right far more often than centre.
 * PRD FR-017, improvement I4.
 */
export const VERTICAL_SUBJECT_BIAS = 0.42

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

/** Largest region of the given aspect, centred horizontally, biased upward. */
export function smartDefaultCrop(
  imageWidth: number,
  imageHeight: number,
  aspect: number,
): CropRect {
  const imageAspect = imageWidth / imageHeight

  // Fit the target aspect inside the image without leaving the bounds.
  const normalizedWidth = imageAspect > aspect ? aspect / imageAspect : 1
  const normalizedHeight = imageAspect > aspect ? 1 : imageAspect / aspect

  return {
    x: (1 - normalizedWidth) / 2,
    y: clamp(VERTICAL_SUBJECT_BIAS - normalizedHeight / 2, 0, 1 - normalizedHeight),
    width: normalizedWidth,
    height: normalizedHeight,
  }
}

/**
 * Force a crop inside [0,1] without changing its size where possible.
 *
 * Size is clamped first, then position, so an oversized rect degrades to a
 * valid one rather than to an inverted one. FR-020 asks for out-of-bounds to be
 * impossible by construction: every crop entering state passes through here.
 */
export function clampCrop(crop: CropRect): CropRect {
  const width = clamp(crop.width, 0, 1)
  const height = clamp(crop.height, 0, 1)
  return {
    width,
    height,
    x: clamp(crop.x, 0, 1 - width),
    y: clamp(crop.y, 0, 1 - height),
  }
}

/** Normalized crop → `drawImage` source arguments. */
export function cropToSourceRect(crop: CropRect, image: ImageDimensions): SourceRect {
  const safe = clampCrop(crop)
  return {
    sx: safe.x * image.width,
    sy: safe.y * image.height,
    sw: safe.width * image.width,
    sh: safe.height * image.height,
  }
}

/**
 * Effective output quality is a property of the CROP, not of the source
 * (FR-062, D-6). A 4000px photo cropped to a tight 300px region cannot make a
 * sharp 1080px export, and the user deserves to be told rather than handed a
 * soft image with no explanation.
 */
export function effectiveResolution(
  crop: CropRect,
  image: ImageDimensions,
  targetEdgePixels: number,
): 'ok' | 'soft' {
  const { sw, sh } = cropToSourceRect(crop, image)
  return Math.min(sw, sh) < targetEdgePixels ? 'soft' : 'ok'
}
