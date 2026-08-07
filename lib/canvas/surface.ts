import { appError } from '@/lib/errors/app-error'

/**
 * Canvas allocation and teardown.
 *
 * Deliberately uses HTMLCanvasElement everywhere, including for export.
 * OffscreenCanvas would be the obvious optimisation, but its 2D context is a
 * different type from CanvasRenderingContext2D, which would force either a
 * union throughout the renderer or a cast at the boundary — real complexity in
 * exchange for a saving nobody has measured. Master prompt §12: do not
 * introduce performance complexity before measuring. Revisit if SPIKE-2 shows
 * export blocking the main thread.
 */

export interface Surface {
  readonly canvas: HTMLCanvasElement
  readonly ctx: CanvasRenderingContext2D
}

export function createSurface(width: number, height: number): Surface {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  // `alpha: false` gives an opaque backing store: a small compositing win, and
  // a second guarantee behind NFR-034 (exports are fully opaque).
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw appError('CANVAS_UNAVAILABLE')

  return { canvas, ctx }
}

/**
 * Release a canvas's backing store immediately.
 *
 * Setting the dimensions to zero frees the pixel buffer without waiting for
 * GC. On iOS, where several intermediate surfaces exist during stepwise
 * downscaling, waiting for GC is how a tab gets killed.
 */
export function releaseSurface(canvas: HTMLCanvasElement): void {
  canvas.width = 0
  canvas.height = 0
}

export function toPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      // Safari has historically returned null here rather than throwing.
      if (blob) resolve(blob)
      else reject(appError('EXPORT_FAILED', { cause: 'canvas.toBlob returned null' }))
    }, 'image/png')
  })
}
