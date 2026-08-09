import type { SourceRect } from '@/lib/canvas/cover-fit'

/**
 * Framing maths. Pure, DOM-free, and the highest-value unit-test target in the
 * codebase — a subtly wrong frame looks *nearly* right and survives review.
 *
 * Automatic framing remains the starting point, while the editor can now
 * derive a tighter frame from three simple controls: zoom, horizontal
 * position and vertical position. Keeping that maths here (rather than in a
 * React component) guarantees the preview and downloaded PNG use the exact
 * same normalized crop.
 *
 * Frames are expressed in NORMALIZED 0–1 coordinates relative to the working
 * image (FR-019). Not pixels: pixel coordinates are implicitly bound to a
 * resolution, so changing WORKING_MAX_EDGE would silently change what a stored
 * frame means.
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

export interface FrameControls {
  /** 1 = automatic frame, 3 = three-times tighter. */
  readonly zoom: number
  /** -100 = left edge, 0 = automatic position, 100 = right edge. */
  readonly positionX: number
  /** -100 = top edge, 0 = automatic position, 100 = bottom edge. */
  readonly positionY: number
}

export const MIN_FRAME_ZOOM = 1
export const MAX_FRAME_ZOOM = 3
export const MIN_FRAME_POSITION = -100
export const MAX_FRAME_POSITION = 100
/** At an image edge, reserve 35% zoom so both axes always have travel. */
export const FRAME_POSITION_ZOOM_ASSIST = 0.35

export const DEFAULT_FRAME_CONTROLS: FrameControls = {
  zoom: MIN_FRAME_ZOOM,
  positionX: 0,
  positionY: 0,
}

/**
 * A crop using the full source height cannot move vertically, and one using
 * the full width cannot move horizontally. Positioning therefore applies the
 * smallest visible zoom needed to create safe in-bounds travel on both axes.
 */
export function minimumZoomForPosition(positionX: number, positionY: number): number {
  const furthestPosition = Math.max(
    Math.abs(clamp(positionX, MIN_FRAME_POSITION, MAX_FRAME_POSITION)),
    Math.abs(clamp(positionY, MIN_FRAME_POSITION, MAX_FRAME_POSITION)),
  )
  return (
    MIN_FRAME_ZOOM + (furthestPosition / MAX_FRAME_POSITION) * FRAME_POSITION_ZOOM_ASSIST
  )
}

/**
 * Faces sit above the geometric centre in portrait photographs, so a true
 * centre crop routinely cuts foreheads. Biasing the frame centre to 42% of
 * image height produces a good result across ordinary phone photos.
 *
 * No face detection: the FaceDetector API is Chromium-flag-only and not a real
 * option, and an ML model on the critical path would cost more than it earns.
 *
 * With automatic framing this constant carries the whole product: it is the
 * difference between a good result and a decapitated one, with no manual
 * correction available. PRD FR-017, improvement I4.
 */
export const VERTICAL_SUBJECT_BIAS = 0.42

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

/**
 * THE framing. Largest region of the target aspect that fits inside the image,
 * centred horizontally and biased upward.
 *
 * Deterministic: identical inputs always produce an identical frame, so the
 * preview a user sees is exactly what downloads (NFR-035).
 */
export function autoFrame(
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
 * Convert user-facing zoom/position controls into a normalized source crop.
 *
 * Position zero preserves the subject-biased automatic frame. Moving a slider
 * interpolates from that neutral point to the corresponding image edge, so a
 * user can rescue an off-centre subject even at 1× zoom. At tighter zooms the
 * neutral point stays anchored to the original automatic subject centre.
 */
export function frameFromControls(
  imageWidth: number,
  imageHeight: number,
  aspect: number,
  controls: FrameControls,
): CropRect {
  const base = autoFrame(imageWidth, imageHeight, aspect)
  const zoom = Math.max(
    clamp(controls.zoom, MIN_FRAME_ZOOM, MAX_FRAME_ZOOM),
    minimumZoomForPosition(controls.positionX, controls.positionY),
  )
  const width = base.width / zoom
  const height = base.height / zoom
  const neutralX = clamp(base.x + base.width / 2 - width / 2, 0, 1 - width)
  const neutralY = clamp(base.y + base.height / 2 - height / 2, 0, 1 - height)

  const position = (neutral: number, maximum: number, value: number): number => {
    const safeValue = clamp(value, MIN_FRAME_POSITION, MAX_FRAME_POSITION)
    return safeValue < 0
      ? neutral * ((safeValue + 100) / 100)
      : neutral + (maximum - neutral) * (safeValue / 100)
  }

  return clampCrop({
    x: position(neutralX, 1 - width, controls.positionX),
    y: position(neutralY, 1 - height, controls.positionY),
    width,
    height,
  })
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
