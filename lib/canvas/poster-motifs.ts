/**
 * Deterministic, code-drawn poster motifs shared by both export templates.
 * They keep the PNG self-contained: no remote assets, randomness or async work.
 */

export function drawSparkle(
  ctx: CanvasRenderingContext2D,
  centreX: number,
  centreY: number,
  radius: number,
  color: string,
): void {
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(centreX, centreY - radius)
  ctx.lineTo(centreX + radius * 0.2, centreY - radius * 0.2)
  ctx.lineTo(centreX + radius, centreY)
  ctx.lineTo(centreX + radius * 0.2, centreY + radius * 0.2)
  ctx.lineTo(centreX, centreY + radius)
  ctx.lineTo(centreX - radius * 0.2, centreY + radius * 0.2)
  ctx.lineTo(centreX - radius, centreY)
  ctx.lineTo(centreX - radius * 0.2, centreY - radius * 0.2)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export function drawHalftone(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  columns: number,
  rows: number,
  gap: number,
  radius: number,
  color: string,
): void {
  ctx.save()
  ctx.fillStyle = color
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      ctx.beginPath()
      ctx.arc(originX + column * gap, originY + row * gap, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

export function drawWaveLines(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  width: number,
  rows: number,
  rowGap: number,
  amplitude: number,
  segments: number,
  color: string,
  lineWidth: number,
): void {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'

  for (let row = 0; row < rows; row += 1) {
    ctx.beginPath()
    for (let segment = 0; segment <= segments; segment += 1) {
      const progress = segment / segments
      const x = originX + progress * width
      const y = originY + row * rowGap + Math.sin(progress * Math.PI * 4) * amplitude
      if (segment === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.restore()
}

export function drawPalm(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  height: number,
  lean: number,
  color: string,
  lineWidth: number,
): void {
  const crownX = baseX + lean
  const crownY = baseY - height

  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.moveTo(baseX, baseY)
  ctx.bezierCurveTo(
    baseX + lean * 0.2,
    baseY - height * 0.32,
    crownX - lean * 0.25,
    crownY + height * 0.22,
    crownX,
    crownY,
  )
  ctx.stroke()

  const fronds = [
    { dx: -0.55, dy: 0.04 },
    { dx: -0.42, dy: -0.22 },
    { dx: -0.12, dy: -0.4 },
    { dx: 0.24, dy: -0.33 },
    { dx: 0.48, dy: -0.12 },
    { dx: 0.56, dy: 0.14 },
  ]

  for (const frond of fronds) {
    const tipX = crownX + frond.dx * height
    const tipY = crownY + frond.dy * height
    ctx.beginPath()
    ctx.moveTo(crownX, crownY)
    ctx.quadraticCurveTo(
      crownX + frond.dx * height * 0.5,
      crownY + frond.dy * height * 0.12,
      tipX,
      tipY,
    )
    ctx.stroke()
  }

  ctx.restore()
}
