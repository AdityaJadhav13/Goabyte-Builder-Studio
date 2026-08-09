import { PALETTE } from '@/lib/brand/palette'
import {
  drawChip,
  drawCircle,
  drawSunMark,
  fillRect,
  roundedRectPath,
  strokeInset,
} from '@/lib/canvas/draw-primitives'
import {
  drawHalftone,
  drawPalm,
  drawSparkle,
  drawWaveLines,
} from '@/lib/canvas/poster-motifs'
import { drawFittedText, fitText } from '@/lib/canvas/fit-text'
import { drawQrCode } from '@/lib/canvas/draw-qr-code'
import { coverFit } from '@/lib/canvas/cover-fit'
import { cropToSourceRect } from '@/lib/image/crop-geometry'
import { BUILDER_STUDIO_QR } from '@/lib/qr/qr-matrix'
import type { RenderModel, RenderTarget } from '../types'
import { CARD_LAYOUT as L } from './builder-card.layout'

/**
 * GoaByte's original Builder ID: a tropical editorial poster rather than a
 * conventional dashboard card. It stays deterministic and entirely on-device.
 */
export function drawBuilderCard(target: RenderTarget, model: RenderModel): void {
  const { ctx } = target
  const fields = model.fields

  fillRect(ctx, { x: 0, y: 0, ...L.canvas }, PALETTE['green-900'])
  fillRect(ctx, L.accentRail, PALETTE.pink)
  fillRect(ctx, L.accentBlock, PALETTE.yellow)

  drawHalftone(
    ctx,
    L.halftone.x,
    L.halftone.y,
    L.halftone.columns,
    L.halftone.rows,
    L.halftone.gap,
    L.halftone.radius,
    PALETTE['green-600'],
  )

  // Layered print keylines create the electric poster silhouette without a
  // blurred effect that could disappear when the PNG is scaled down.
  ctx.save()
  ctx.globalAlpha = 0.2
  strokeInset(ctx, { x: 0, y: 0, ...L.canvas }, L.frame.glowWidth, PALETTE.yellow)
  ctx.restore()
  strokeInset(ctx, { x: 0, y: 0, ...L.canvas }, L.frame.outerWidth, PALETTE.ink)
  strokeInset(
    ctx,
    {
      x: L.frame.innerInset,
      y: L.frame.innerInset,
      width: L.canvas.width - L.frame.innerInset * 2,
      height: L.canvas.height - L.frame.innerInset * 2,
    },
    L.frame.innerWidth,
    PALETTE.yellow,
  )

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'

  ctx.fillStyle = PALETTE.yellow
  ctx.font = `${L.eyebrow.fontWeight} ${L.eyebrow.fontSize}px ${L.eyebrow.fontFamily}`
  ctx.letterSpacing = `${L.eyebrow.letterSpacing}px`
  ctx.fillText(L.eyebrow.text, L.eyebrow.x, L.eyebrow.baselineY)

  ctx.font = `${L.brand.fontWeight} ${L.brand.fontSize}px ${L.brand.fontFamily}`
  ctx.letterSpacing = `${L.brand.letterSpacing}px`
  ctx.lineWidth = L.brand.strokeWidth
  ctx.strokeStyle = PALETTE.ink
  ctx.fillStyle = PALETTE.cream
  ctx.strokeText(L.brand.text, L.brand.x, L.brand.baselineY)
  ctx.fillText(L.brand.text, L.brand.x, L.brand.baselineY)

  ctx.textAlign = 'right'
  ctx.font = `${L.brandAccent.fontWeight} ${L.brandAccent.fontSize}px ${L.brandAccent.fontFamily}`
  ctx.letterSpacing = `${L.brandAccent.letterSpacing}px`
  ctx.fillStyle = PALETTE.pink
  ctx.fillText(L.brandAccent.text, L.brandAccent.rightX, L.brandAccent.baselineY)
  ctx.textAlign = 'left'
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

  // ── Portrait photo ───────────────────────────────────────────────────────
  fillRect(
    ctx,
    {
      x: L.photo.x + L.photoShadow.offsetX,
      y: L.photo.y + L.photoShadow.offsetY,
      width: L.photo.width,
      height: L.photo.height,
    },
    PALETTE.pink,
  )

  const framed = cropToSourceRect(model.crop, model.image)
  const safe = coverFit(
    { width: framed.sw, height: framed.sh },
    { width: L.photo.width, height: L.photo.height },
  )

  ctx.save()
  roundedRectPath(ctx, L.photo, L.photo.radius)
  ctx.clip()
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

  ctx.globalAlpha = 0.9
  fillRect(
    ctx,
    {
      x: L.photo.x,
      y: L.photo.y + L.photo.height - L.photoCaptionBar.height,
      width: L.photo.width,
      height: L.photoCaptionBar.height,
    },
    PALETTE['green-900'],
  )
  ctx.restore()

  roundedRectPath(ctx, L.photo, L.photo.radius)
  ctx.strokeStyle = PALETTE.yellow
  ctx.lineWidth = L.photo.borderWidth
  ctx.stroke()

  ctx.fillStyle = PALETTE.yellow
  ctx.font = `${L.photoCaption.fontWeight} ${L.photoCaption.fontSize}px ${L.photoCaption.fontFamily}`
  ctx.letterSpacing = `${L.photoCaption.letterSpacing}px`
  ctx.fillText(L.photoCaption.text, L.photoCaption.x, L.photoCaption.baselineY)
  ctx.letterSpacing = '0px'

  // ── Identity panel ───────────────────────────────────────────────────────
  drawChip(
    ctx,
    L.identityPanel,
    L.identityPanel.radius,
    PALETTE.cream,
    PALETTE.ink,
    L.identityPanel.borderWidth,
  )
  drawCircle(
    ctx,
    L.identityDot.centreX,
    L.identityDot.centreY,
    L.identityDot.radius,
    PALETTE.pink,
    PALETTE.ink,
    L.identityDot.strokeWidth,
  )

  ctx.fillStyle = PALETTE.pink
  ctx.font = `${L.identityLabel.fontWeight} ${L.identityLabel.fontSize}px ${L.identityLabel.fontFamily}`
  ctx.letterSpacing = `${L.identityLabel.letterSpacing}px`
  ctx.fillText(L.identityLabel.text, L.identityLabel.x, L.identityLabel.baselineY)
  ctx.letterSpacing = '0px'

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
  ctx.fillStyle = PALETTE.ink
  drawFittedText(ctx, name, L.name.x, L.name.topY)

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
    ctx.fillStyle = PALETTE['green-600']
    ctx.font = `${L.roleLabel.fontWeight} ${L.roleLabel.fontSize}px ${L.roleLabel.fontFamily}`
    ctx.letterSpacing = `${L.roleLabel.letterSpacing}px`
    ctx.fillText(L.roleLabel.text, L.roleLabel.x, L.roleLabel.baselineY)
    ctx.letterSpacing = '0px'

    ctx.fillStyle = PALETTE['green-900']
    drawFittedText(ctx, role, L.role.x, L.role.topY)
  }

  const roleShift = hasRole ? 0 : L.roleReflow
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

  ctx.fillStyle = PALETTE['green-700']
  ctx.font = `${L.privacy.fontWeight} ${L.privacy.fontSize}px ${L.privacy.fontFamily}`
  ctx.letterSpacing = `${L.privacy.letterSpacing}px`
  ctx.fillText(L.privacy.text, L.privacy.x, L.privacy.baselineY - roleShift)
  ctx.letterSpacing = '0px'

  const shift = roleShift + (hasTitle ? 0 : L.titleChipReflow)

  // ── Tropical poster footer ───────────────────────────────────────────────
  fillRect(
    ctx,
    {
      x: L.margin,
      y: L.footer.ruleY - shift,
      width: L.canvas.width - L.margin * 2,
      height: L.footer.ruleWidth,
    },
    PALETTE.yellow,
  )

  ctx.font = `${L.slogan.fontWeight} ${L.slogan.fontSize}px ${L.slogan.fontFamily}`
  ctx.fillStyle = PALETTE.cream
  ctx.fillText(L.slogan.first, L.slogan.x, L.slogan.firstBaselineY - shift)
  ctx.fillStyle = PALETTE.pink
  ctx.fillText(L.slogan.second, L.slogan.x, L.slogan.secondBaselineY - shift)
  ctx.fillStyle = PALETTE.yellow
  ctx.fillText(L.slogan.third, L.slogan.x, L.slogan.thirdBaselineY - shift)

  drawWaveLines(
    ctx,
    L.waves.x,
    L.waves.y - shift,
    L.waves.width,
    L.waves.rows,
    L.waves.rowGap,
    L.waves.amplitude,
    L.waves.segments,
    PALETTE['green-600'],
    L.waves.lineWidth,
  )
  drawPalm(
    ctx,
    L.palm.baseX,
    L.palm.baseY - shift,
    L.palm.height,
    L.palm.lean,
    PALETTE.yellow,
    L.palm.lineWidth,
  )

  for (const sparkle of L.sparkles) {
    drawSparkle(ctx, sparkle.x, sparkle.y - shift, sparkle.radius, PALETTE.pink)
  }

  // A real, scannable QR—not a decorative imitation. Its matrix is generated
  // once at module load, then painted synchronously into preview and export.
  fillRect(ctx, { ...L.qrShadow, y: L.qrShadow.y - shift }, PALETTE.pink)
  drawQrCode(ctx, BUILDER_STUDIO_QR, {
    x: L.qr.x,
    y: L.qr.y - shift,
    size: L.qr.size,
    quietModules: L.qr.quietModules,
    foreground: PALETTE['green-900'],
    background: PALETTE.cream,
    border: PALETTE.yellow,
    borderWidth: L.qr.borderWidth,
  })

  ctx.fillStyle = PALETTE.yellow
  ctx.font = `${L.qrLabel.fontWeight} ${L.qrLabel.fontSize}px ${L.qrLabel.fontFamily}`
  ctx.letterSpacing = `${L.qrLabel.letterSpacing}px`
  ctx.fillText(L.qrLabel.text, L.qrLabel.x, L.qrLabel.baselineY - shift)
  ctx.letterSpacing = '0px'

  ctx.fillStyle = PALETTE['cream-dim']
  ctx.font = `${L.footer.fontWeight} ${L.footer.fontSize}px ${L.footer.fontFamily}`
  ctx.letterSpacing = `${L.footer.letterSpacing}px`
  ctx.fillText(L.footer.text, L.footer.x, L.footer.baselineY - shift)

  ctx.textAlign = 'right'
  ctx.fillStyle = PALETTE.yellow
  ctx.font = `${L.tag.fontWeight} ${L.tag.fontSize}px ${L.tag.fontFamily}`
  ctx.letterSpacing = `${L.tag.letterSpacing}px`
  ctx.fillText(L.tag.text, L.tag.rightX, L.tag.baselineY - shift)
  ctx.textAlign = 'left'
  ctx.letterSpacing = '0px'
}
