/**
 * Shared drawing primitives.
 *
 * Both templates need these. Keeping them here rather than in either template
 * is what stops the PFP and the card growing divergent implementations of the
 * same shape — ARCHITECTURE ADR-1, the reason `features/render/` was merged.
 *
 * All synchronous, all mutating only the supplied context.
 */

export interface Rect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/**
 * Stroke a rectangle so the whole line sits INSIDE the given bounds.
 *
 * `strokeRect` centres the stroke on the path, so half of it falls outside and
 * gets clipped at a canvas edge. Every keyline in this product goes through
 * here rather than re-deriving the inset.
 */
export function strokeInset(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  lineWidth: number,
  color: string,
): void {
  const inset = lineWidth / 2
  ctx.lineWidth = lineWidth
  ctx.strokeStyle = color
  ctx.strokeRect(
    rect.x + inset,
    rect.y + inset,
    rect.width - lineWidth,
    rect.height - lineWidth,
  )
}

export function fillRect(ctx: CanvasRenderingContext2D, rect: Rect, color: string): void {
  ctx.fillStyle = color
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
}

export function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number,
): void {
  const r = Math.min(radius, rect.width / 2, rect.height / 2)
  ctx.beginPath()
  ctx.moveTo(rect.x + r, rect.y)
  ctx.lineTo(rect.x + rect.width - r, rect.y)
  ctx.arcTo(rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + r, r)
  ctx.lineTo(rect.x + rect.width, rect.y + rect.height - r)
  ctx.arcTo(
    rect.x + rect.width,
    rect.y + rect.height,
    rect.x + rect.width - r,
    rect.y + rect.height,
    r,
  )
  ctx.lineTo(rect.x + r, rect.y + rect.height)
  ctx.arcTo(rect.x, rect.y + rect.height, rect.x, rect.y + rect.height - r, r)
  ctx.lineTo(rect.x, rect.y + r)
  ctx.arcTo(rect.x, rect.y, rect.x + r, rect.y, r)
  ctx.closePath()
}

/** Filled chip with an ink keyline — the card's builder-title treatment. */
export function drawChip(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number,
  fill: string,
  strokeColor: string,
  strokeWidth: number,
): void {
  roundedRectPath(ctx, rect, radius)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.lineWidth = strokeWidth
  ctx.strokeStyle = strokeColor
  ctx.stroke()
}

export function drawCircle(
  ctx: CanvasRenderingContext2D,
  centreX: number,
  centreY: number,
  radius: number,
  fill: string,
  strokeColor?: string,
  strokeWidth = 0,
): void {
  ctx.beginPath()
  ctx.arc(centreX, centreY, radius, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  if (strokeColor && strokeWidth > 0) {
    ctx.lineWidth = strokeWidth
    ctx.strokeStyle = strokeColor
    ctx.stroke()
  }
}

/**
 * A stylised sun: filled disc plus radiating rays. Drawn rather than shipped
 * as an SVG asset — it is a dozen calls, it scales exactly with the design
 * space, and it avoids an asset fetch that would need decoding before every
 * render (FR-044).
 */
export function drawSunMark(
  ctx: CanvasRenderingContext2D,
  centreX: number,
  centreY: number,
  radius: number,
  rayLength: number,
  rayCount: number,
  fill: string,
  ink: string,
  strokeWidth: number,
): void {
  ctx.save()
  ctx.lineWidth = strokeWidth
  ctx.strokeStyle = ink
  ctx.lineCap = 'round'

  for (let i = 0; i < rayCount; i++) {
    const angle = (Math.PI * 2 * i) / rayCount
    const inner = radius + rayLength * 0.35
    const outer = radius + rayLength
    ctx.beginPath()
    ctx.moveTo(centreX + Math.cos(angle) * inner, centreY + Math.sin(angle) * inner)
    ctx.lineTo(centreX + Math.cos(angle) * outer, centreY + Math.sin(angle) * outer)
    ctx.stroke()
  }

  drawCircle(ctx, centreX, centreY, radius, fill, ink, strokeWidth)
  ctx.restore()
}

/**
 * Vertical scrim behind text sitting on a photo.
 *
 * The PFP lockup sits over an unknown image, so legibility cannot be assumed
 * from the photo. A gradient from transparent to opaque ink guarantees the
 * contrast measured in DESIGN_SYSTEM §3.2 regardless of what was uploaded —
 * this is what makes the frame work on both bright and dark photos.
 */
export function drawScrim(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  fromColor: string,
  toColor: string,
): void {
  const gradient = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.height)
  gradient.addColorStop(0, fromColor)
  gradient.addColorStop(1, toColor)
  ctx.fillStyle = gradient
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
}
