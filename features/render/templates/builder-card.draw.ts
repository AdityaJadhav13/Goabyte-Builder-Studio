import { PALETTE } from '@/lib/brand/palette'
import {
  drawChip,
  drawSunMark,
  fillRect,
  strokeInset,
} from '@/lib/canvas/draw-primitives'
import { drawFittedText, fitText } from '@/lib/canvas/fit-text'
import { coverFit } from '@/lib/canvas/cover-fit'
import { cropToSourceRect } from '@/lib/image/crop-geometry'
import type { RenderModel, RenderTarget } from '../types'
import { CARD_LAYOUT as L } from './builder-card.layout'

/**
 * Production Builder ID card.
 *
 * Drawing only — coordinates, type sizes, floors and line budgets all come
 * from `builder-card.layout.ts`.
 *
 * Deterministic and synchronous, with no external side effects. Same contract
 * as every other `*.draw.ts`, enforced by ESLint.
 */
export function drawBuilderCard(target: RenderTarget, model: RenderModel): void {
  const { ctx } = target
  const fields = model.fields

  fillRect(ctx, { x: 0, y: 0, ...L.canvas }, PALETTE['green-800'])

  // ── Eyebrow ──────────────────────────────────────────────────────────────
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.fillStyle = PALETTE.yellow
  ctx.font = `${L.eyebrow.fontWeight} ${L.eyebrow.fontSize}px ${L.eyebrow.fontFamily}`
  ctx.letterSpacing = `${L.eyebrow.letterSpacing}px`
  ctx.fillText(L.eyebrow.text, L.eyebrow.x, L.eyebrow.baselineY)
  ctx.letterSpacing = '0px'

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

  // ── Photo well ───────────────────────────────────────────────────────────
  const framed = cropToSourceRect(model.crop, model.image)
  // Safety net against distortion: the automatic frame already matches the
  // well's aspect, but a rounding difference must never stretch a face.
  const safe = coverFit(
    { width: framed.sw, height: framed.sh },
    { width: L.photo.width, height: L.photo.height },
  )
  ctx.drawImage(
    model.image.source,
    framed.sx + safe.sx,
    framed.sy + safe.sy,
    safe.sw,
    safe.sh,
    L.photo.x,
    L.photo.y,
    L.photo.width,
    L.photo.height,
  )
  strokeInset(ctx, L.photo, L.photo.borderWidth, PALETTE.ink)

  // ── Name ─────────────────────────────────────────────────────────────────
  const name = fitText(ctx, {
    text: fields?.name ?? '',
    fontFamily: L.name.fontFamily,
    fontWeight: L.name.fontWeight,
    fontSize: L.name.fontSize,
    minFontSize: L.name.minFontSize,
    maxWidth: L.name.maxWidth,
    maxLines: L.name.maxLines,
    lineHeight: L.name.lineHeight,
  })
  ctx.fillStyle = PALETTE.cream
  drawFittedText(ctx, name, L.name.x, L.name.topY)

  // ── Role (optional) ──────────────────────────────────────────────────────
  const roleText = fields?.role?.trim() ?? ''
  const hasRole = roleText.length > 0

  const role = fitText(ctx, {
    text: roleText,
    fontFamily: L.role.fontFamily,
    fontWeight: L.role.fontWeight,
    fontSize: L.role.fontSize,
    minFontSize: L.role.minFontSize,
    maxWidth: L.role.maxWidth,
    maxLines: L.role.maxLines,
    lineHeight: L.role.lineHeight,
  })
  if (hasRole) {
    ctx.fillStyle = PALETTE['cream-dim']
    drawFittedText(ctx, role, L.role.x, L.role.topY)
  }

  // Everything below an absent block moves up to close the gap.
  const roleShift = hasRole ? 0 : L.roleReflow

  // ── Builder title chip, or reflow without it ─────────────────────────────
  const title = fields?.title?.trim()
  const hasTitle = Boolean(title)

  if (hasTitle) {
    const chipText = fitText(ctx, {
      text: title!,
      fontFamily: L.titleChip.fontFamily,
      fontWeight: L.titleChip.fontWeight,
      fontSize: L.titleChip.fontSize,
      minFontSize: L.titleChip.minFontSize,
      maxWidth: L.titleChip.maxWidth,
      maxLines: L.titleChip.maxLines,
      lineHeight: L.titleChip.lineHeight,
      letterSpacing: L.titleChip.letterSpacing,
    })

    drawChip(
      ctx,
      {
        x: L.titleChip.x,
        y: L.titleChip.topY - roleShift,
        width: chipText.width + L.titleChip.paddingX * 2,
        height: L.titleChip.height,
      },
      L.titleChip.radius,
      PALETTE.pink,
      PALETTE.ink,
      L.titleChip.borderWidth,
    )

    // INK on pink — 5.04:1. `cream` here would be 3.27:1 and fail AA.
    ctx.fillStyle = PALETTE.ink
    ctx.font = `${L.titleChip.fontWeight} ${chipText.fontSize}px ${L.titleChip.fontFamily}`
    ctx.letterSpacing = `${L.titleChip.letterSpacing}px`
    ctx.fillText(
      chipText.lines[0] ?? '',
      L.titleChip.x + L.titleChip.paddingX,
      L.titleChip.topY - roleShift + L.titleChip.height * 0.68,
    )
    ctx.letterSpacing = '0px'
  }

  // Footer closes up over every absent block, not just the chip.
  const shift = roleShift + (hasTitle ? 0 : L.titleChipReflow)

  // ── Footer ───────────────────────────────────────────────────────────────
  fillRect(
    ctx,
    {
      x: L.margin,
      y: L.footer.ruleY - shift,
      width: L.canvas.width - L.margin * 2,
      height: L.footer.ruleWidth,
    },
    PALETTE['green-600'],
  )

  ctx.fillStyle = PALETTE['cream-dim']
  ctx.font = `${L.footer.fontWeight} ${L.footer.fontSize}px ${L.footer.fontFamily}`
  ctx.letterSpacing = `${L.footer.letterSpacing}px`
  ctx.fillText(L.footer.text, L.footer.x, L.footer.baselineY - shift)
  ctx.letterSpacing = '0px'

  ctx.textAlign = 'right'
  ctx.fillStyle = PALETTE.yellow
  ctx.font = `${L.tag.fontWeight} ${L.tag.fontSize}px ${L.tag.fontFamily}`
  ctx.fillText(L.tag.text, L.tag.rightX, L.tag.baselineY - shift)
  ctx.textAlign = 'left'

  // ── Keyline ──────────────────────────────────────────────────────────────
  strokeInset(ctx, { x: 0, y: 0, ...L.canvas }, 16, PALETTE.ink)
}
