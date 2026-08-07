/**
 * Aspect-preserving fit maths. Pure, no DOM.
 *
 * PRD FR-022 / IMAGE_ENGINE rule: never stretch an image. Every place that
 * could distort goes through here.
 */

export interface Size {
  readonly width: number
  readonly height: number
}

export interface SourceRect {
  readonly sx: number
  readonly sy: number
  readonly sw: number
  readonly sh: number
}

/**
 * Largest centred region of `source` matching `target`'s aspect ratio.
 *
 * Used as a safety net at draw time: the cropper already produces a rect at
 * the right aspect, but a rounding difference or a future template change must
 * not be able to distort the photo.
 */
export function coverFit(source: Size, target: Size): SourceRect {
  const sourceAspect = source.width / source.height
  const targetAspect = target.width / target.height

  if (sourceAspect > targetAspect) {
    // Source is wider — crop the sides.
    const sw = source.height * targetAspect
    return { sx: (source.width - sw) / 2, sy: 0, sw, sh: source.height }
  }

  // Source is taller (or equal) — crop top and bottom.
  const sh = source.width / targetAspect
  return { sx: 0, sy: (source.height - sh) / 2, sw: source.width, sh }
}

/** Largest box of `source`'s aspect that fits entirely inside `bounds`. */
export function containFit(source: Size, bounds: Size): Size {
  const scale = Math.min(bounds.width / source.width, bounds.height / source.height)
  return { width: source.width * scale, height: source.height * scale }
}
