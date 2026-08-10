import { BUILDER_PLATE_PATH } from '@/features/render/assets'
import { PALETTE } from '@/lib/brand/palette'
import {
  drawChip,
  drawSunMark,
  fillRect,
  roundedRectPath,
} from '@/lib/canvas/draw-primitives'
import { drawQrCode } from '@/lib/canvas/draw-qr-code'
import { drawFittedText, fitText } from '@/lib/canvas/fit-text'
import { cropToSourceRect } from '@/lib/image/crop-geometry'
import { BUILDER_STUDIO_QR } from '@/lib/qr/qr-matrix'
import type { RenderAssets, RenderModel, RenderTarget } from '../types'
import { drawBuilderCardBack } from './builder-card-back.draw'
import { CARD_LAYOUT as L } from './builder-card.layout'

function drawIdentityRow(
  ctx: CanvasRenderingContext2D,
  row: (typeof L.identity)[keyof typeof L.identity],
  text: string,
): void {
  ctx.fillStyle = '#174b36'
  ctx.font = `${row.label.fontWeight} ${row.label.fontSize}px ${row.label.fontFamily}`
  ctx.letterSpacing = `${row.label.letterSpacing}px`
  ctx.fillText(row.label.text, row.label.x, row.label.baselineY)
  ctx.letterSpacing = '0px'

  const fitted = fitText(ctx, {
    text,
    fontFamily: row.value.fontFamily,
    fontWeight: row.value.fontWeight,
    fontSize: row.value.fontSize,
    minFontSize: row.value.minFontSize,
    maxWidth: row.value.maxWidth,
    maxLines: row.value.maxLines,
    lineHeight: row.value.lineHeight,
  })
  ctx.fillStyle = '#10100f'
  drawFittedText(ctx, fitted, row.value.x, row.value.topY)
}

/** A real, portrait credential: generated texture plus exact canvas data. */
function drawBuilderCardFront(
  target: RenderTarget,
  model: RenderModel,
  assets: RenderAssets,
): void {
  const { ctx } = target
  const fields = model.fields

  fillRect(ctx, { x: 0, y: 0, ...L.canvas }, PALETTE['green-900'])
  const plate = assets.art.get(BUILDER_PLATE_PATH)
  if (plate) ctx.drawImage(plate, 0, 0, L.canvas.width, L.canvas.height)

  const src = cropToSourceRect(model.crop, model.image)
  ctx.save()
  roundedRectPath(ctx, L.photo, L.photo.radius)
  ctx.clip()
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
  ctx.restore()
  roundedRectPath(ctx, L.photo, L.photo.radius)
  ctx.strokeStyle = '#fff4d6'
  ctx.lineWidth = L.photo.borderWidth
  ctx.stroke()

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#fff4d6'
  ctx.font = `${L.header.fontWeight} ${L.header.fontSize}px ${L.header.fontFamily}`
  ctx.letterSpacing = `${L.header.letterSpacing}px`
  ctx.fillText(L.header.line1, L.header.centreX, L.header.line1Y)
  ctx.fillText(L.header.line2, L.header.centreX, L.header.line2Y)

  ctx.fillStyle = '#f8df00'
  ctx.font = `${L.headerMeta.fontWeight} ${L.headerMeta.fontSize}px ${L.headerMeta.fontFamily}`
  ctx.letterSpacing = `${L.headerMeta.letterSpacing}px`
  ctx.fillText(L.headerMeta.text, L.headerMeta.centreX, L.headerMeta.baselineY)
  ctx.letterSpacing = '0px'

  const rawTitle = fields?.title?.trim() || 'BUILDER'
  const title = fitText(ctx, {
    text: rawTitle.toUpperCase(),
    fontFamily: L.titleChip.fontFamily,
    fontWeight: L.titleChip.fontWeight,
    fontSize: L.titleChip.fontSize,
    minFontSize: L.titleChip.minFontSize,
    maxWidth: L.titleChip.maxWidth - L.titleChip.paddingX * 2,
    maxLines: L.titleChip.maxLines,
    lineHeight: L.titleChip.lineHeight,
    letterSpacing: L.titleChip.letterSpacing,
  })
  const chipWidth = Math.min(L.titleChip.maxWidth, title.width + L.titleChip.paddingX * 2)
  drawChip(
    ctx,
    { x: L.titleChip.x, y: L.titleChip.y, width: chipWidth, height: L.titleChip.height },
    L.titleChip.radius,
    '#f8df00',
    '#10100f',
    L.titleChip.borderWidth,
  )
  ctx.fillStyle = '#10100f'
  ctx.font = `${L.titleChip.fontWeight} ${title.fontSize}px ${L.titleChip.fontFamily}`
  ctx.letterSpacing = `${L.titleChip.letterSpacing}px`
  ctx.fillText(
    title.lines[0] ?? 'BUILDER',
    L.titleChip.x + chipWidth / 2,
    L.titleChip.y + L.titleChip.height * 0.68,
  )
  ctx.letterSpacing = '0px'

  // Guarantee a clean surface for the identity column before any text lands
  // on it — see CARD_LAYOUT.identityPlate.
  roundedRectPath(ctx, L.identityPlate, L.identityPlate.radius)
  ctx.fillStyle = L.identityPlate.fill
  ctx.fill()

  ctx.textAlign = 'left'
  drawIdentityRow(ctx, L.identity.name, fields?.name ?? '')

  // Rule beneath the name: separates the hero line from the meta rows so the
  // plate reads as a hierarchy rather than three equal fields.
  ctx.fillStyle = '#f8df00'
  ctx.fillRect(
    L.identityRule.x,
    L.identityRule.y,
    L.identityRule.width,
    L.identityRule.height,
  )

  drawIdentityRow(ctx, L.identity.role, fields?.role ?? '')
  drawIdentityRow(ctx, L.identity.team, fields?.team ?? '')

  // Monogram in the plate's dead lower-right corner.
  const mark = L.identityMark
  drawSunMark(
    ctx,
    mark.sun.centreX,
    mark.sun.centreY,
    mark.sun.radius,
    mark.sun.rayLength,
    mark.sun.rayCount,
    '#f8df00',
    '#10100f',
    mark.sun.strokeWidth,
  )
  ctx.textAlign = 'center'
  ctx.fillStyle = '#10100f'
  ctx.font = `${mark.caption.fontWeight} ${mark.caption.fontSize}px ${mark.caption.fontFamily}`
  ctx.letterSpacing = `${mark.caption.letterSpacing}px`
  ctx.fillText(mark.caption.text, mark.caption.centreX, mark.caption.baselineY)
  ctx.letterSpacing = '0px'
  ctx.textAlign = 'left'

  drawQrCode(ctx, BUILDER_STUDIO_QR, {
    x: L.qr.x,
    y: L.qr.y,
    size: L.qr.size,
    quietModules: L.qr.quietModules,
    foreground: '#10100f',
    background: '#fff4d6',
    border: '#10100f',
    borderWidth: L.qr.borderWidth,
  })

  ctx.textAlign = 'center'
  ctx.fillStyle = '#174b36'
  ctx.font = `${L.qrLabel.fontWeight} ${L.qrLabel.fontSize}px ${L.qrLabel.fontFamily}`
  ctx.letterSpacing = `${L.qrLabel.letterSpacing}px`
  ctx.fillText(L.qrLabel.text, L.qrLabel.centreX, L.qrLabel.baselineY)
  ctx.font = `${L.date.fontWeight} ${L.date.fontSize}px ${L.date.fontFamily}`
  ctx.letterSpacing = `${L.date.letterSpacing}px`
  ctx.fillText(L.date.text, L.date.centreX, L.date.baselineY)

  // The plate's bottom band carries a pink star that landed across "SHIP".
  // A dark plate behind the ticker keeps the line clean without hiding the
  // decoration either side of it.
  roundedRectPath(ctx, L.footerPlate, L.footerPlate.radius)
  ctx.fillStyle = 'rgba(16, 16, 15, 0.82)'
  ctx.fill()

  ctx.fillStyle = '#fff4d6'
  ctx.font = `${L.footer.fontWeight} ${L.footer.fontSize}px ${L.footer.fontFamily}`
  ctx.letterSpacing = `${L.footer.letterSpacing}px`
  ctx.fillText(L.footer.text, L.footer.centreX, L.footer.baselineY)
  ctx.letterSpacing = '0px'
  ctx.textAlign = 'left'
}

/** Dispatch the two physical faces without duplicating the render pipeline. */
export function drawBuilderCard(
  target: RenderTarget,
  model: RenderModel,
  assets: RenderAssets,
): void {
  if (model.cardSide === 'back') {
    drawBuilderCardBack(target, model, assets)
    return
  }

  drawBuilderCardFront(target, model, assets)
}
