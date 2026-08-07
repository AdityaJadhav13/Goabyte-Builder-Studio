import { PALETTE } from '@/lib/brand/palette'
import {
  drawScrim,
  drawSunMark,
  fillRect,
  strokeInset,
} from '@/lib/canvas/draw-primitives'
import { cropToSourceRect } from '@/lib/image/crop-geometry'
import type { RenderModel, RenderTarget } from '../types'
import { PFP_LAYOUT as L } from './pfp.layout'

/**
 * Production PFP frame.
 *
 * Drawing only — every coordinate and type spec comes from `pfp.layout.ts`, so
 * this file contains no magic numbers.
 *
 * Deterministic and synchronous, with no external side effects: it mutates the
 * supplied CanvasRenderingContext2D and nothing else. No network, no asset
 * loading, no dynamic import, no application state, no clock, no randomness,
 * no storage, no async. Enforced by ESLint over `*.draw.ts`.
 */

/** Poster registration marks. Two strokes per corner, ink on photo. */
function drawCornerBrackets(ctx: CanvasRenderingContext2D): void {
  const { inset, length, width: w } = L.corners
  const right = L.canvas.width - inset
  const bottom = L.canvas.height - inset

  ctx.strokeStyle = PALETTE.cream
  ctx.lineWidth = w
  ctx.lineCap = 'square'

  const bracket = (x: number, y: number, dx: number, dy: number) => {
    ctx.beginPath()
    ctx.moveTo(x + dx * length, y)
    ctx.lineTo(x, y)
    ctx.lineTo(x, y + dy * length)
    ctx.stroke()
  }

  bracket(inset, inset, 1, 1)
  bracket(right, inset, -1, 1)
  // Bottom corners are omitted: the lockup bar occupies that edge, and
  // brackets there would collide with the type.
}

export function drawPfp(target: RenderTarget, model: RenderModel): void {
  const { ctx } = target

  // Opaque base — guarantees the export has no transparent regions (NFR-034)
  // even if the photo somehow fails to cover the canvas.
  fillRect(ctx, { x: 0, y: 0, ...L.canvas }, PALETTE['green-900'])

  // ── Photo, full bleed, from the automatic frame ──────────────────────────
  const src = cropToSourceRect(model.crop, model.image)
  ctx.drawImage(
    model.image.source,
    src.sx,
    src.sy,
    src.sw,
    src.sh,
    L.photo.x,
    L.photo.y,
    L.photo.width,
    L.photo.height,
  )

  drawCornerBrackets(ctx)

  // ── Scrim, so the lockup is legible over any photo ───────────────────────
  drawScrim(ctx, L.scrim, 'rgba(5, 34, 26, 0)', PALETTE['green-900'])

  // ── Lockup bar ───────────────────────────────────────────────────────────
  fillRect(ctx, L.bar, PALETTE['green-900'])
  fillRect(
    ctx,
    { x: L.bar.x, y: L.bar.y, width: L.bar.width, height: L.bar.ruleWidth },
    PALETTE.yellow,
  )

  ctx.textBaseline = 'alphabetic'

  ctx.textAlign = 'left'
  ctx.fillStyle = PALETTE.cream
  ctx.font = `${L.eventLine.fontWeight} ${L.eventLine.fontSize}px ${L.eventLine.fontFamily}`
  ctx.letterSpacing = `${L.eventLine.letterSpacing}px`
  ctx.fillText(L.eventLine.text, L.eventLine.x, L.eventLine.baselineY)

  ctx.fillStyle = PALETTE.yellow
  ctx.font = `${L.yearLine.fontWeight} ${L.yearLine.fontSize}px ${L.yearLine.fontFamily}`
  ctx.letterSpacing = `${L.yearLine.letterSpacing}px`
  ctx.fillText(L.yearLine.text, L.yearLine.x, L.yearLine.baselineY)

  ctx.letterSpacing = '0px'
  ctx.textAlign = 'right'
  ctx.fillStyle = PALETTE.pink
  ctx.font = `${L.tag.fontWeight} ${L.tag.fontSize}px ${L.tag.fontFamily}`
  // Pink on green-900 measures 4.50:1 — AA-large only, which this 52px display
  // face satisfies. It would fail as body text (DESIGN_SYSTEM §3.3).
  ctx.fillText(L.tag.text, L.tag.rightX, L.tag.baselineY)
  ctx.textAlign = 'left'

  // ── Sun mark ─────────────────────────────────────────────────────────────
  drawSunMark(
    ctx,
    L.sun.centreX,
    L.sun.centreY,
    L.sun.radius,
    L.sun.rayLength,
    L.sun.rayCount,
    PALETTE.yellow,
    PALETTE.ink,
    L.sun.strokeWidth,
  )

  // ── Keyline last, so nothing paints over it ──────────────────────────────
  strokeInset(ctx, { x: 0, y: 0, ...L.canvas }, L.keyline.width, PALETTE.ink)
}
