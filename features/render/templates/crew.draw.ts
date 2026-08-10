import { CREW_PLATE_PATH } from '@/features/render/assets'
import { PALETTE } from '@/lib/brand/palette'
import { drawCircle, fillRect, roundedRectPath } from '@/lib/canvas/draw-primitives'
import { drawQrCode } from '@/lib/canvas/draw-qr-code'
import { fitText } from '@/lib/canvas/fit-text'
import { cropToSourceRect } from '@/lib/image/crop-geometry'
import { BUILDER_STUDIO_QR_URL, createQrMatrix, type QrMatrix } from '@/lib/qr/qr-matrix'
import type { CropRect } from '@/lib/image/crop-geometry'
import type { NormalizedImage } from '@/lib/image/normalized-image'
import type { RenderAssets, RenderModel, RenderTarget } from '../types'
import { CREW_LAYOUT as L, CREW_MEMBER_LAYOUTS } from './crew.layout'

const qrCache = new Map<string, QrMatrix>()

function qrFor(value: string): QrMatrix {
  const normalized = value.trim() || BUILDER_STUDIO_QR_URL
  const cached = qrCache.get(normalized)
  if (cached) return cached
  const matrix = createQrMatrix(normalized)
  qrCache.set(normalized, matrix)
  return matrix
}

function drawMember(
  ctx: CanvasRenderingContext2D,
  image: NormalizedImage,
  crop: CropRect,
  name: string,
  role: string,
  placement: (typeof CREW_MEMBER_LAYOUTS)[number][number],
): void {
  const src = cropToSourceRect(crop, image)
  const { centreX, centreY, radius } = placement

  drawCircle(ctx, centreX + 9, centreY + 12, radius + 13, '#10100f')
  drawCircle(ctx, centreX, centreY, radius + 12, '#f8df00', '#10100f', 7)

  ctx.save()
  ctx.beginPath()
  ctx.arc(centreX, centreY, radius, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(
    image.source,
    src.sx,
    src.sy,
    src.sw,
    src.sh,
    centreX - radius,
    centreY - radius,
    radius * 2,
    radius * 2,
  )
  ctx.restore()

  const nameFit = fitText(ctx, {
    text: name.trim() || 'BUILDER',
    fontFamily: L.memberName.fontFamily,
    fontWeight: L.memberName.fontWeight,
    fontSize: L.memberName.fontSize,
    minFontSize: L.memberName.minFontSize,
    maxWidth: radius * 2.45,
    maxLines: 1,
    lineHeight: L.memberName.lineHeight,
  })
  ctx.textAlign = 'center'
  ctx.fillStyle = '#fff4d6'
  ctx.fillText(nameFit.lines[0] ?? 'BUILDER', centreX, placement.nameY)

  const roleFit = fitText(ctx, {
    text: role.trim().toUpperCase() || 'BUILDER',
    fontFamily: L.memberRole.fontFamily,
    fontWeight: L.memberRole.fontWeight,
    fontSize: L.memberRole.fontSize,
    minFontSize: L.memberRole.minFontSize,
    maxWidth: radius * 2.45,
    maxLines: 1,
    lineHeight: L.memberRole.lineHeight,
    letterSpacing: 2,
  })
  ctx.fillStyle = '#ef2d70'
  ctx.letterSpacing = '2px'
  ctx.fillText(roleFit.lines[0] ?? 'BUILDER', centreX, placement.roleY)
  ctx.letterSpacing = '0px'
}

/** True 2048×1362 1–4 member Crew Frame. */
export function drawCrew(
  target: RenderTarget,
  model: RenderModel,
  assets: RenderAssets,
): void {
  const { ctx } = target
  const crew = model.crew
  const fields = model.fields

  fillRect(ctx, { x: 0, y: 0, ...L.canvas }, PALETTE['green-900'])
  const plate = assets.art.get(CREW_PLATE_PATH)
  if (plate) ctx.drawImage(plate, 0, 0, L.canvas.width, L.canvas.height)

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'center'
  const headerFit = fitText(ctx, {
    text: L.header.text,
    fontFamily: L.header.fontFamily,
    fontWeight: L.header.fontWeight,
    fontSize: L.header.fontSize,
    minFontSize: L.header.minFontSize,
    maxWidth: L.header.maxWidth,
    maxLines: 1,
    lineHeight: L.header.lineHeight,
  })
  ctx.fillStyle = '#10100f'
  ctx.fillText(headerFit.lines[0] ?? L.header.text, L.header.centreX, L.header.baselineY)

  const teamName = crew?.teamName.trim() || fields?.team.trim() || 'GOABYTE CREW'
  const teamFit = fitText(ctx, {
    text: teamName.toUpperCase(),
    fontFamily: L.team.fontFamily,
    fontWeight: L.team.fontWeight,
    fontSize: L.team.fontSize,
    minFontSize: L.team.minFontSize,
    maxWidth: L.team.maxWidth,
    maxLines: 1,
    lineHeight: L.team.lineHeight,
  })
  ctx.fillStyle = '#f8df00'
  ctx.fillText(teamFit.lines[0] ?? teamName, L.team.centreX, L.team.baselineY)

  ctx.fillStyle = '#fff4d6'
  ctx.font = `${L.kicker.fontWeight} ${L.kicker.fontSize}px ${L.kicker.fontFamily}`
  ctx.letterSpacing = `${L.kicker.letterSpacing}px`
  ctx.fillText(L.kicker.text, L.kicker.centreX, L.kicker.baselineY)
  ctx.letterSpacing = '0px'

  const members = [
    {
      image: model.image,
      crop: model.crop,
      name: fields?.name ?? 'Builder',
      role: fields?.role ?? 'Builder',
    },
    ...(crew?.members ?? []),
  ].slice(0, 4)
  const placements = CREW_MEMBER_LAYOUTS[members.length] ?? CREW_MEMBER_LAYOUTS[1]!
  members.forEach((member, index) => {
    const placement = placements[index]
    if (placement)
      drawMember(ctx, member.image, member.crop, member.name, member.role, placement)
  })

  drawQrCode(ctx, qrFor(crew?.projectUrl ?? ''), {
    x: L.qr.x,
    y: L.qr.y,
    size: L.qr.size,
    quietModules: L.qr.quietModules,
    foreground: '#10100f',
    background: '#fff4d6',
    border: '#10100f',
    borderWidth: L.qr.borderWidth,
  })
  ctx.fillStyle = '#10100f'
  ctx.font = `${L.qrLabel.fontWeight} ${L.qrLabel.fontSize}px ${L.qrLabel.fontFamily}`
  ctx.letterSpacing = `${L.qrLabel.letterSpacing}px`
  ctx.fillText(L.qrLabel.text, L.qrLabel.centreX, L.qrLabel.baselineY)

  // Plate first, then the text on top of it — the ticker crosses a starburst
  // and was illegible where they overlapped.
  ctx.font = `${L.footer.fontWeight} ${L.footer.fontSize}px ${L.footer.fontFamily}`
  ctx.letterSpacing = `${L.footer.letterSpacing}px`
  const footerWidth = ctx.measureText(L.footer.text).width
  const plateWidth = footerWidth + L.footerPlate.paddingX * 2
  roundedRectPath(
    ctx,
    {
      x: L.footer.centreX - plateWidth / 2,
      y: L.footer.baselineY - L.footerPlate.height * 0.72,
      width: plateWidth,
      height: L.footerPlate.height,
    },
    L.footerPlate.radius,
  )
  ctx.fillStyle = L.footerPlate.fill
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = '#10100f'
  ctx.stroke()

  ctx.fillStyle = '#10100f'
  ctx.fillText(L.footer.text, L.footer.centreX, L.footer.baselineY)
  ctx.letterSpacing = '0px'
  ctx.textAlign = 'left'
}
