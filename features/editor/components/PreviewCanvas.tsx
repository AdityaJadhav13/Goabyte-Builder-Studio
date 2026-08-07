'use client'

import { useEffect, useRef } from 'react'
import { renderTemplate } from '@/features/render/render-template'
import {
  DESIGN,
  PREVIEW_DPR_CAP,
  type RenderAssets,
  type RenderModel,
} from '@/features/render/types'

/**
 * The React binding for the renderer.
 *
 * Calls the SAME synchronous function the export path calls, differing only by
 * scale — which is why preview/export divergence is not something we test for
 * (D-2, NFR-036).
 *
 * Nothing here awaits. `assets` is already-prepared proof from the controller;
 * holding it is the precondition for rendering at all.
 */
export function PreviewCanvas({
  model,
  assets,
  description,
  className,
}: {
  readonly model: RenderModel
  readonly assets: RenderAssets
  /** What is actually on the canvas, for people who cannot see it. */
  readonly description?: string
  readonly className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)

  const { width: designWidth, height: designHeight } = DESIGN[model.format]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Coalesce into one frame: crop changes arrive faster than the display
    // refreshes, and rendering per event would waste work with no visible gain.
    cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      const cssWidth = canvas.clientWidth
      if (cssWidth === 0) return

      // DPR capped at 2 (FR-039). A DPR-3 phone rendering a full-width preview
      // would otherwise allocate over twice the area for a perceptually
      // identical result — on the device with the least memory to spare.
      const dpr = Math.min(window.devicePixelRatio || 1, PREVIEW_DPR_CAP)
      const backingWidth = Math.round(cssWidth * dpr)
      const scale = backingWidth / designWidth

      const backingHeight = Math.round(designHeight * scale)
      if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
        canvas.width = backingWidth
        canvas.height = backingHeight
      }

      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return

      renderTemplate({ ctx, scale }, model, assets)
    })

    return () => cancelAnimationFrame(frameRef.current)
  }, [model, assets, designWidth, designHeight])

  return (
    <canvas
      ref={canvasRef}
      // The accessibility cost of a canvas preview (D-2), paid explicitly
      // rather than ignored: the graphic is announced as an image with a
      // meaningful description (FR-041).
      role="img"
      aria-label={
        description
          ? `${description}. Preview at ${designWidth}×${designHeight}.`
          : `Preview of your ${designWidth}×${designHeight} Hacker House Goa graphic`
      }
      style={{ aspectRatio: `${designWidth} / ${designHeight}` }}
      className={className}
    />
  )
}
