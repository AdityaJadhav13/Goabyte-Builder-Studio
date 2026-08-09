import type { QrMatrix } from '@/lib/qr/qr-matrix'
import { fillRect, strokeInset } from './draw-primitives'

export interface QrCodeStyle {
  readonly x: number
  readonly y: number
  /** Must be divisible by module count + the two quiet zones. */
  readonly size: number
  readonly quietModules: number
  readonly foreground: string
  readonly background: string
  readonly border: string
  readonly borderWidth: number
}

/** Paint a crisp QR code with the standards-required quiet zone. */
export function drawQrCode(
  ctx: CanvasRenderingContext2D,
  matrix: QrMatrix,
  style: QrCodeStyle,
): void {
  const count = matrix.length
  const cells = count + style.quietModules * 2
  const cellSize = style.size / cells
  const bounds = { x: style.x, y: style.y, width: style.size, height: style.size }

  fillRect(ctx, bounds, style.background)
  strokeInset(ctx, bounds, style.borderWidth, style.border)

  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (!matrix[row]?.[column]) continue
      fillRect(
        ctx,
        {
          x: style.x + (column + style.quietModules) * cellSize,
          y: style.y + (row + style.quietModules) * cellSize,
          width: cellSize,
          height: cellSize,
        },
        style.foreground,
      )
    }
  }
}
