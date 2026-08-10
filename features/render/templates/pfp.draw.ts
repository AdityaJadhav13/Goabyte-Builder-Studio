import { frameById, type PfpFrameDefinition } from '@/features/render/frame-catalog'
import { PALETTE } from '@/lib/brand/palette'
import { fillRect, roundedRectPath } from '@/lib/canvas/draw-primitives'
import { fitText } from '@/lib/canvas/fit-text'
import { cropToSourceRect } from '@/lib/image/crop-geometry'
import type { RenderAssets, RenderModel, RenderTarget } from '../types'
import { PFP_LAYOUT as L } from './pfp.layout'

function drawPlate(
  ctx: CanvasRenderingContext2D,
  assets: RenderAssets,
  frame: PfpFrameDefinition,
): void {
  const plate = assets.art.get(frame.platePath)
  if (plate) {
    ctx.drawImage(plate, 0, 0, L.canvas.width, L.canvas.height)
    return
  }

  // Recording tests and a failed-asset fallback still get an opaque export.
  fillRect(ctx, { x: 0, y: 0, ...L.canvas }, PALETTE['green-900'])
}

function drawPlaqueText(ctx: CanvasRenderingContext2D, frame: PfpFrameDefinition): void {
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = frame.ink

  const title = fitText(ctx, {
    text: L.topTitle.text,
    fontFamily: L.topTitle.fontFamily,
    fontWeight: L.topTitle.fontWeight,
    fontSize: L.topTitle.fontSize,
    minFontSize: L.topTitle.minFontSize,
    maxWidth: frame.headerMaxWidth,
    maxLines: L.topTitle.maxLines,
    lineHeight: L.topTitle.lineHeight,
    letterSpacing: L.topTitle.letterSpacing,
  })
  ctx.fillText(
    title.lines[0] ?? L.topTitle.text,
    L.topTitle.centreX,
    frame.headerBaselineY,
  )

  ctx.font = `${L.topKicker.fontWeight} ${L.topKicker.fontSize}px ${L.topKicker.fontFamily}`
  ctx.letterSpacing = `${L.topKicker.letterSpacing}px`
  ctx.fillText(L.topKicker.text, L.topKicker.centreX, frame.headerBaselineY + 36)

  ctx.fillStyle = frame.accent
  ctx.font = `${L.tag.fontWeight} ${frame.id === 'heritage' ? 20 : 23}px ${L.tag.fontFamily}`
  ctx.letterSpacing = `${L.tag.letterSpacing}px`
  ctx.fillText(
    frame.id === 'heritage'
      ? `${L.topTitle.text} · ${L.tag.text}`
      : `${L.topTitle.text} · #FrameInGoa`,
    L.tag.centreX,
    frame.footerBaselineY,
  )
  ctx.letterSpacing = '0px'
  ctx.textAlign = 'left'
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  model: RenderModel,
  frame: PfpFrameDefinition,
): void {
  const src = cropToSourceRect(model.crop, model.image)
  const aperture = frame.aperture

  ctx.save()
  if (aperture.shape === 'circle') {
    ctx.beginPath()
    ctx.arc(aperture.centreX, aperture.centreY, aperture.radius, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(
      model.image.source,
      src.sx,
      src.sy,
      src.sw,
      src.sh,
      aperture.centreX - aperture.radius,
      aperture.centreY - aperture.radius,
      aperture.radius * 2,
      aperture.radius * 2,
    )
  } else {
    roundedRectPath(ctx, aperture, aperture.radius)
    ctx.clip()
    ctx.drawImage(
      model.image.source,
      src.sx,
      src.sy,
      src.sw,
      src.sh,
      aperture.x,
      aperture.y,
      aperture.width,
      aperture.height,
    )
  }
  ctx.restore()

  if (aperture.shape === 'circle') {
    ctx.beginPath()
    ctx.arc(aperture.centreX, aperture.centreY, aperture.radius, 0, Math.PI * 2)
  } else {
    roundedRectPath(ctx, aperture, aperture.radius)
  }
  ctx.strokeStyle = frame.id === 'heritage' ? '#6c391c' : frame.accent
  ctx.lineWidth = aperture.borderWidth
  ctx.stroke()
}

/** Vintage Goa portal PFP: generated illustration + deterministic photo/text. */
export function drawPfp(
  target: RenderTarget,
  model: RenderModel,
  assets: RenderAssets,
): void {
  const { ctx } = target
  const frame = frameById(model.pfpFrame)

  fillRect(ctx, { x: 0, y: 0, ...L.canvas }, PALETTE['green-900'])
  drawPlate(ctx, assets, frame)
  drawPhoto(ctx, model, frame)
  drawPlaqueText(ctx, frame)
}
