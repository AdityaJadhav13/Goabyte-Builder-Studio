import { PALETTE } from '@/lib/brand/palette'
import { cropToSourceRect } from '@/lib/image/crop-geometry'
import type { RenderModel, RenderTarget } from '../types'
import { PLACEHOLDER_LAYOUT as L } from './placeholder.layout'

/**
 * Slice 1 placeholder. Drawing only — every coordinate comes from the layout
 * config, so this file contains no magic numbers.
 *
 * DELIBERATELY PLAIN. Its job is to prove framing, scale independence and crop
 * correctness, not to look like a product. Branding is Slice 2.
 *
 * Deterministic and synchronous, with no external side effects: it mutates the
 * supplied CanvasRenderingContext2D and nothing else. No network, no asset
 * loading, no dynamic import, no application state, no clock, no randomness,
 * no storage, no async. Enforced by ESLint over `*.draw.ts`.
 */
export function drawPlaceholder(target: RenderTarget, model: RenderModel): void {
  const { ctx } = target

  // Opaque base. Also guarantees the export has no transparent regions
  // (NFR-034) even if the photo somehow fails to cover the canvas.
  ctx.fillStyle = PALETTE['green-900']
  ctx.fillRect(0, 0, L.canvas.width, L.canvas.height)

  // ── Photo, cover-fit from the normalized crop ────────────────────────────
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

  // ── Bottom lockup bar ────────────────────────────────────────────────────
  ctx.fillStyle = PALETTE['green-800']
  ctx.fillRect(L.bar.x, L.bar.y, L.bar.width, L.bar.height)

  ctx.fillStyle = PALETTE.ink
  ctx.fillRect(L.bar.x, L.bar.y, L.bar.width, L.bar.ruleWidth)

  ctx.fillStyle = PALETTE.yellow
  ctx.font = `600 ${L.label.fontSize}px ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.letterSpacing = `${L.label.letterSpacing}px`
  ctx.fillText(L.label.text, L.label.x, L.label.baselineY)
  ctx.letterSpacing = '0px'

  // ── Corner mark ──────────────────────────────────────────────────────────
  ctx.beginPath()
  ctx.arc(L.cornerMark.centreX, L.cornerMark.centreY, L.cornerMark.radius, 0, Math.PI * 2)
  ctx.fillStyle = PALETTE.yellow
  ctx.fill()
  ctx.lineWidth = L.cornerMark.strokeWidth
  ctx.strokeStyle = PALETTE.ink
  ctx.stroke()

  // ── Keyline, drawn last so nothing paints over it ────────────────────────
  // strokeRect centres the stroke on the path, so inset by half the width to
  // keep the whole line inside the canvas.
  const inset = L.keyline.width / 2
  ctx.lineWidth = L.keyline.width
  ctx.strokeStyle = PALETTE.ink
  ctx.strokeRect(
    inset,
    inset,
    L.canvas.width - L.keyline.width,
    L.canvas.height - L.keyline.width,
  )
}
