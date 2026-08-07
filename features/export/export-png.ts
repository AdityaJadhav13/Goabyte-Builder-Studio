import { prepareRenderAssets } from '@/features/render/assets'
import { renderTemplate } from '@/features/render/render-template'
import { DESIGN, type ExportResult, type RenderModel } from '@/features/render/types'
import { createSurface, releaseSurface, toPngBlob } from '@/lib/canvas/surface'
import { appError, isAppError } from '@/lib/errors/app-error'
import { buildFileName } from './file-name'

/**
 * Render at full resolution and produce a real PNG.
 *
 * The shape of this function is the architecture in miniature: awaits above
 * the boundary, a synchronous deterministic render below it.
 *
 * PRD FR-042, FR-045, NFR-031.
 */
export async function exportPng(
  model: RenderModel,
  subject?: string | null,
): Promise<ExportResult> {
  const started = performance.now()

  // ── async preparation: the only awaits in the render path ───────────────
  const assets = await prepareRenderAssets(model.format)

  // ── synchronous render ──────────────────────────────────────────────────
  const { width, height } = DESIGN[model.format]
  const surface = createSurface(width, height)

  try {
    renderTemplate({ ctx: surface.ctx, scale: 1 }, model, assets)

    const blob = await toPngBlob(surface.canvas)
    return {
      blob,
      width,
      height,
      fileName: buildFileName(model.format, subject),
      durationMs: performance.now() - started,
    }
  } catch (cause) {
    throw isAppError(cause) ? cause : appError('RENDER_FAILED', { cause })
  } finally {
    // Export surfaces are ~4.6 MB of RGBA each. Releasing eagerly rather than
    // waiting for GC is what makes repeated exports safe on mobile (S0-12).
    releaseSurface(surface.canvas)
  }
}
