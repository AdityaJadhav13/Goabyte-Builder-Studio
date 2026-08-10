import { PALETTE, type PaletteToken } from '@/lib/brand/palette'
import {
  drawChip,
  drawCircle,
  drawSunMark,
  fillRect,
  roundedRectPath,
} from '@/lib/canvas/draw-primitives'
import { drawFittedText, fitText } from '@/lib/canvas/fit-text'
import {
  drawHalftone,
  drawPalm,
  drawSparkle,
  drawWaveLines,
} from '@/lib/canvas/poster-motifs'
import type { RenderAssets, RenderModel, RenderTarget } from '../types'
import { BUILDER_CARD_BACK_LAYOUT as L } from './builder-card-back.layout'
import { mascotThemeFor, type MascotTheme } from './mascot-theme'

interface TextStyle {
  readonly fontFamily: string
  readonly fontWeight: number
  readonly fontSize: number
  readonly letterSpacing: number
  readonly color: PaletteToken
}

interface CentredTextStyle extends TextStyle {
  readonly centreX: number
  readonly baselineY: number
}

const colorOf = (token: PaletteToken): string => PALETTE[token]

function drawCentredText(
  ctx: CanvasRenderingContext2D,
  style: CentredTextStyle,
  text: string,
): void {
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = colorOf(style.color)
  ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`
  ctx.letterSpacing = `${style.letterSpacing}px`
  ctx.fillText(text, style.centreX, style.baselineY)
  ctx.letterSpacing = '0px'
}

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  rect: {
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
  },
  radius: number,
  color: PaletteToken,
): void {
  roundedRectPath(ctx, rect, radius)
  ctx.fillStyle = colorOf(color)
  ctx.fill()
}

function strokeRoundedRect(
  ctx: CanvasRenderingContext2D,
  frame: {
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
    readonly radius: number
    readonly strokeWidth: number
    readonly color: PaletteToken
  },
): void {
  roundedRectPath(ctx, frame, frame.radius)
  ctx.strokeStyle = colorOf(frame.color)
  ctx.lineWidth = frame.strokeWidth
  ctx.stroke()
}

function drawBackground(ctx: CanvasRenderingContext2D): void {
  fillRect(ctx, L.canvasRect, colorOf(L.background.color))
  fillRect(ctx, L.background.cornerBlock, colorOf(L.background.cornerBlock.color))
  fillRect(ctx, L.background.lowerBlock, colorOf(L.background.lowerBlock.color))
  strokeRoundedRect(ctx, L.background.outerKeyline)
  strokeRoundedRect(ctx, L.background.innerKeyline)
}

function drawHeader(ctx: CanvasRenderingContext2D): void {
  fillRect(ctx, L.header.accentBar, colorOf(L.header.accentBar.color))
  fillRect(ctx, L.header.rule, colorOf(L.header.rule.color))

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = colorOf(L.header.eyebrow.color)
  ctx.font = `${L.header.eyebrow.fontWeight} ${L.header.eyebrow.fontSize}px ${L.header.eyebrow.fontFamily}`
  ctx.letterSpacing = `${L.header.eyebrow.letterSpacing}px`
  ctx.fillText(L.header.eyebrow.text, L.header.eyebrow.x, L.header.eyebrow.baselineY)
  ctx.letterSpacing = '0px'

  const event = fitText(ctx, {
    text: L.header.event.text,
    fontFamily: L.header.event.fontFamily,
    fontWeight: L.header.event.fontWeight,
    fontSize: L.header.event.fontSize,
    minFontSize: L.header.event.minFontSize,
    maxWidth: L.header.event.maxWidth,
    maxLines: L.header.event.maxLines,
    lineHeight: L.header.event.lineHeight,
  })
  ctx.fillStyle = colorOf(L.header.event.color)
  ctx.fillText(
    event.lines[0] ?? L.header.event.text,
    L.header.event.x,
    L.header.event.baselineY,
  )

  drawChip(
    ctx,
    L.header.yearChip.rect,
    L.header.yearChip.radius,
    colorOf(L.header.yearChip.fill),
    colorOf(L.header.yearChip.stroke),
    L.header.yearChip.borderWidth,
  )
  drawCentredText(ctx, L.header.yearChip.text, L.header.yearChip.text.value)
}

function drawMotifs(ctx: CanvasRenderingContext2D): void {
  const halftone = L.motifs.halftone
  drawHalftone(
    ctx,
    halftone.originX,
    halftone.originY,
    halftone.columns,
    halftone.rows,
    halftone.gap,
    halftone.radius,
    colorOf(halftone.color),
  )

  const waves = L.motifs.waves
  drawWaveLines(
    ctx,
    waves.originX,
    waves.originY,
    waves.width,
    waves.rows,
    waves.rowGap,
    waves.amplitude,
    waves.segments,
    colorOf(waves.color),
    waves.lineWidth,
  )

  for (const palm of [L.motifs.leftPalm, L.motifs.rightPalm]) {
    drawPalm(
      ctx,
      palm.baseX,
      palm.baseY,
      palm.height,
      palm.lean,
      colorOf(palm.color),
      palm.lineWidth,
    )
  }

  for (const sparkle of L.motifs.sparkles) {
    drawSparkle(
      ctx,
      sparkle.centreX,
      sparkle.centreY,
      sparkle.radius,
      colorOf(sparkle.color),
    )
  }
}

function drawArm(
  ctx: CanvasRenderingContext2D,
  arm: (typeof L.mascot.arms)[number],
): void {
  const style = L.mascot.armStyle
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(arm.start.x, arm.start.y)
  ctx.bezierCurveTo(
    arm.control1.x,
    arm.control1.y,
    arm.control2.x,
    arm.control2.y,
    arm.end.x,
    arm.end.y,
  )
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = colorOf(style.outerColor)
  ctx.lineWidth = style.outerWidth
  ctx.stroke()
  ctx.strokeStyle = colorOf(style.innerColor)
  ctx.lineWidth = style.innerWidth
  ctx.stroke()
  ctx.restore()

  drawCircle(
    ctx,
    arm.glove.centreX,
    arm.glove.centreY,
    arm.glove.radius,
    colorOf(style.gloveFill),
    colorOf(style.gloveStroke),
    style.gloveBorderWidth,
  )
}

function drawCodeMark(ctx: CanvasRenderingContext2D): void {
  const mark = L.mascot.console.codeMark
  ctx.save()
  ctx.strokeStyle = colorOf(mark.color)
  ctx.lineWidth = mark.lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.moveTo(mark.left.start.x, mark.left.start.y)
  ctx.lineTo(mark.left.middle.x, mark.left.middle.y)
  ctx.lineTo(mark.left.end.x, mark.left.end.y)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(mark.slash.start.x, mark.slash.start.y)
  ctx.lineTo(mark.slash.end.x, mark.slash.end.y)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(mark.right.start.x, mark.right.start.y)
  ctx.lineTo(mark.right.middle.x, mark.right.middle.y)
  ctx.lineTo(mark.right.end.x, mark.right.end.y)
  ctx.stroke()
  ctx.restore()
}

/**
 * Original Goa crew-builder astronaut, constructed entirely from Canvas paths.
 * There is no downloaded character art, logo tracing, or third-party avatar.
 */
/**
 * The mascot carries the per-title colourway. Layout stays fixed; only the
 * four themed tokens change, so a Founder and a Protocol Researcher share a
 * silhouette but never a colourway.
 */
function drawMascot(ctx: CanvasRenderingContext2D, theme: MascotTheme): void {
  const mascot = L.mascot

  drawCircle(
    ctx,
    mascot.sunShadow.centreX,
    mascot.sunShadow.centreY,
    mascot.sunShadow.radius,
    colorOf(mascot.sunShadow.color),
  )
  drawSunMark(
    ctx,
    mascot.sun.centreX,
    mascot.sun.centreY,
    mascot.sun.radius,
    mascot.sun.rayLength,
    mascot.sun.rayCount,
    colorOf(theme.halo),
    colorOf(mascot.sun.ink),
    mascot.sun.strokeWidth,
  )

  fillRoundedRect(
    ctx,
    mascot.shadow.leftFoot,
    mascot.shadow.footRadius,
    mascot.shadow.color,
  )
  fillRoundedRect(
    ctx,
    mascot.shadow.rightFoot,
    mascot.shadow.footRadius,
    mascot.shadow.color,
  )
  fillRoundedRect(ctx, mascot.shadow.body, mascot.shadow.bodyRadius, mascot.shadow.color)

  drawChip(
    ctx,
    mascot.backpack.rect,
    mascot.backpack.radius,
    colorOf(mascot.backpack.fill),
    colorOf(mascot.backpack.stroke),
    mascot.backpack.borderWidth,
  )
  ctx.beginPath()
  ctx.moveTo(mascot.backpack.seam.x1, mascot.backpack.seam.y1)
  ctx.lineTo(mascot.backpack.seam.x2, mascot.backpack.seam.y2)
  ctx.strokeStyle = colorOf(mascot.backpack.seam.color)
  ctx.lineWidth = mascot.backpack.seam.lineWidth
  ctx.lineCap = 'round'
  ctx.stroke()

  for (const arm of mascot.arms) drawArm(ctx, arm)

  for (const foot of mascot.feet) {
    drawChip(
      ctx,
      foot,
      mascot.footStyle.radius,
      colorOf(mascot.footStyle.fill),
      colorOf(mascot.footStyle.stroke),
      mascot.footStyle.borderWidth,
    )
  }

  drawChip(
    ctx,
    mascot.body.rect,
    mascot.body.radius,
    colorOf(mascot.body.fill),
    colorOf(mascot.body.stroke),
    mascot.body.borderWidth,
  )
  drawChip(
    ctx,
    mascot.helmetBand.rect,
    mascot.helmetBand.radius,
    colorOf(theme.suit),
    colorOf(mascot.helmetBand.stroke),
    mascot.helmetBand.borderWidth,
  )
  drawChip(
    ctx,
    mascot.visor.rect,
    mascot.visor.radius,
    colorOf(theme.visor),
    colorOf(mascot.visor.stroke),
    mascot.visor.borderWidth,
  )
  fillRoundedRect(
    ctx,
    mascot.visor.highlight.rect,
    mascot.visor.highlight.radius,
    mascot.visor.highlight.color,
  )
  drawCircle(
    ctx,
    mascot.visor.glint.centreX,
    mascot.visor.glint.centreY,
    mascot.visor.glint.radius,
    colorOf(mascot.visor.glint.color),
  )

  drawChip(
    ctx,
    mascot.console.rect,
    mascot.console.radius,
    colorOf(mascot.console.fill),
    colorOf(mascot.console.stroke),
    mascot.console.borderWidth,
  )
  fillRoundedRect(
    ctx,
    mascot.console.screen.rect,
    mascot.console.screen.radius,
    mascot.console.screen.color,
  )
  for (const control of mascot.console.controls) {
    drawCircle(
      ctx,
      control.centreX,
      control.centreY,
      control.radius,
      colorOf(control.color),
    )
  }
  drawCodeMark(ctx)

  drawCircle(
    ctx,
    mascot.patch.centreX,
    mascot.patch.centreY,
    mascot.patch.radius,
    colorOf(mascot.patch.fill),
    colorOf(mascot.patch.stroke),
    mascot.patch.borderWidth,
  )
  drawCentredText(ctx, mascot.patch.text, mascot.patch.text.value)
}

function drawIdentity(ctx: CanvasRenderingContext2D, name: string, title: string): void {
  drawCentredText(ctx, L.identity.label, L.identity.label.text)

  const fittedName = fitText(ctx, {
    text: name,
    fontFamily: L.identity.name.fontFamily,
    fontWeight: L.identity.name.fontWeight,
    fontSize: L.identity.name.fontSize,
    minFontSize: L.identity.name.minFontSize,
    maxWidth: L.identity.name.maxWidth,
    maxLines: L.identity.name.maxLines,
    lineHeight: L.identity.name.lineHeight,
  })
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = colorOf(L.identity.name.color)
  drawFittedText(ctx, fittedName, L.identity.name.centreX, L.identity.name.topY)

  drawChip(
    ctx,
    L.identity.title.box,
    L.identity.title.radius,
    colorOf(L.identity.title.fill),
    colorOf(L.identity.title.stroke),
    L.identity.title.borderWidth,
  )
  const fittedTitle = fitText(ctx, {
    text: title,
    fontFamily: L.identity.title.fontFamily,
    fontWeight: L.identity.title.fontWeight,
    fontSize: L.identity.title.fontSize,
    minFontSize: L.identity.title.minFontSize,
    maxWidth: L.identity.title.maxWidth,
    maxLines: L.identity.title.maxLines,
    lineHeight: L.identity.title.lineHeight,
    letterSpacing: L.identity.title.letterSpacing,
  })
  ctx.fillStyle = colorOf(L.identity.title.color)
  ctx.letterSpacing = `${L.identity.title.letterSpacing}px`
  drawFittedText(ctx, fittedTitle, L.identity.title.centreX, L.identity.title.topY)
  ctx.letterSpacing = '0px'
}

function drawCampaign(ctx: CanvasRenderingContext2D): void {
  fillRect(ctx, L.campaign.divider.left, colorOf(L.campaign.divider.color))
  fillRect(ctx, L.campaign.divider.right, colorOf(L.campaign.divider.color))
  drawCentredText(ctx, L.campaign.buildLine, L.campaign.buildLine.text)
  drawCentredText(ctx, L.campaign.hashtag, L.campaign.hashtag.text)

  drawChip(
    ctx,
    L.footer.plaque,
    L.footer.plaque.radius,
    colorOf(L.footer.plaque.fill),
    colorOf(L.footer.plaque.stroke),
    L.footer.plaque.borderWidth,
  )
  drawCentredText(ctx, L.footer.text, L.footer.text.value)
}

/**
 * Draw the personalized Builder ID reverse at its canonical 1080x1350 size.
 *
 * Asset provenance: the reverse uses only local fonts, shared palette tokens,
 * and original code-drawn geometry. `assets` is accepted to preserve the shared
 * renderer contract; no external, remote, copyrighted, or generated image is
 * consumed by this composition.
 */
export function drawBuilderCardBack(
  target: RenderTarget,
  model: RenderModel,
  assets: RenderAssets,
): void {
  const { ctx } = target
  const name = model.fields?.name.trim().toUpperCase() || L.identity.name.fallback
  const title = model.fields?.title?.trim().toUpperCase() || L.identity.title.fallback

  void assets
  drawBackground(ctx)
  drawHeader(ctx)
  drawMotifs(ctx)
  drawMascot(ctx, mascotThemeFor(model.fields?.title))
  drawIdentity(ctx, name, title)
  drawCampaign(ctx)

  ctx.letterSpacing = '0px'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}
