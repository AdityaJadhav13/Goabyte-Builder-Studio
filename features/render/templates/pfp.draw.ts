import { PALETTE } from '@/lib/brand/palette'
import {
  drawChip,
  drawScrim,
  drawSunMark,
  fillRect,
  strokeInset,
} from '@/lib/canvas/draw-primitives'
import { drawHalftone, drawSparkle, drawWaveLines } from '@/lib/canvas/poster-motifs'
import { cropToSourceRect } from '@/lib/image/crop-geometry'
import type { RenderModel, RenderTarget } from '../types'
import { PFP_LAYOUT as L } from './pfp.layout'

function drawCornerBrackets(ctx: CanvasRenderingContext2D): void {
  const { inset, length, width: lineWidth } = L.corners
  const right = L.canvas.width - inset

  ctx.strokeStyle = PALETTE.cream
  ctx.lineWidth = lineWidth
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
}

/**
 * The square export treats the photo like a music-poster cover: bold frame,
 * clipped ticker and tropical marks, while leaving the face-safe centre clear.
 */
export function drawPfp(target: RenderTarget, model: RenderModel): void {
  const { ctx } = target

  fillRect(ctx, { x: 0, y: 0, ...L.canvas }, PALETTE['green-900'])

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
  drawHalftone(
    ctx,
    L.halftone.x,
    L.halftone.y,
    L.halftone.columns,
    L.halftone.rows,
    L.halftone.gap,
    L.halftone.radius,
    PALETTE.yellow,
  )

  drawChip(ctx, L.ticker, 3, PALETTE.yellow, PALETTE.ink, L.ticker.borderWidth)
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.fillStyle = PALETTE.ink
  ctx.font = `${L.tickerTop.fontWeight} ${L.tickerTop.fontSize}px ${L.tickerTop.fontFamily}`
  ctx.letterSpacing = `${L.tickerTop.letterSpacing}px`
  ctx.fillText(L.tickerTop.text, L.tickerTop.x, L.tickerTop.baselineY)
  ctx.font = `${L.tickerMain.fontWeight} ${L.tickerMain.fontSize}px ${L.tickerMain.fontFamily}`
  ctx.letterSpacing = `${L.tickerMain.letterSpacing}px`
  ctx.fillText(L.tickerMain.text, L.tickerMain.x, L.tickerMain.baselineY)

  drawScrim(ctx, L.scrim, 'rgba(5, 34, 26, 0)', PALETTE['green-900'])
  fillRect(ctx, L.bar, PALETTE['green-900'])
  fillRect(
    ctx,
    { x: L.bar.x, y: L.bar.y, width: L.bar.width, height: L.bar.ruleWidth },
    PALETTE.yellow,
  )

  drawWaveLines(
    ctx,
    L.waves.x,
    L.waves.y,
    L.waves.width,
    L.waves.rows,
    L.waves.rowGap,
    L.waves.amplitude,
    L.waves.segments,
    PALETTE['green-600'],
    L.waves.lineWidth,
  )

  ctx.fillStyle = PALETTE.cream
  ctx.font = `${L.eventLine.fontWeight} ${L.eventLine.fontSize}px ${L.eventLine.fontFamily}`
  ctx.letterSpacing = `${L.eventLine.letterSpacing}px`
  ctx.fillText(L.eventLine.text, L.eventLine.x, L.eventLine.baselineY)

  ctx.textAlign = 'right'
  ctx.fillStyle = PALETTE.yellow
  ctx.font = `${L.tag.fontWeight} ${L.tag.fontSize}px ${L.tag.fontFamily}`
  ctx.letterSpacing = `${L.tag.letterSpacing}px`
  ctx.fillText(L.tag.text, L.tag.rightX, L.tag.baselineY)

  ctx.textAlign = 'left'
  ctx.font = `${L.yearLine.fontWeight} ${L.yearLine.fontSize}px ${L.yearLine.fontFamily}`
  ctx.letterSpacing = `${L.yearLine.letterSpacing}px`
  ctx.lineWidth = L.yearLine.strokeWidth
  ctx.strokeStyle = PALETTE.ink
  ctx.fillStyle = PALETTE.pink
  ctx.strokeText(L.yearLine.text, L.yearLine.x, L.yearLine.baselineY)
  ctx.fillText(L.yearLine.text, L.yearLine.x, L.yearLine.baselineY)

  ctx.fillStyle = PALETTE['cream-dim']
  ctx.font = `${L.microLine.fontWeight} ${L.microLine.fontSize}px ${L.microLine.fontFamily}`
  ctx.letterSpacing = `${L.microLine.letterSpacing}px`
  ctx.fillText(L.microLine.text, L.microLine.x, L.microLine.baselineY)
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

  for (const sparkle of L.sparkles) {
    drawSparkle(ctx, sparkle.x, sparkle.y, sparkle.radius, PALETTE.pink)
  }

  strokeInset(
    ctx,
    {
      x: L.keyline.innerInset,
      y: L.keyline.innerInset,
      width: L.canvas.width - L.keyline.innerInset * 2,
      height: L.canvas.height - L.keyline.innerInset * 2,
    },
    L.keyline.innerWidth,
    PALETTE.yellow,
  )
  strokeInset(ctx, { x: 0, y: 0, ...L.canvas }, L.keyline.width, PALETTE.ink)
}
