import { drawBuilderCard } from './templates/builder-card.draw'
import { drawPfp } from './templates/pfp.draw'
import type { RenderAssets, RenderModel, RenderTarget } from './types'

/**
 * THE renderer. One entry point, used by both preview and export.
 *
 * Deterministic and synchronous, with no external side effects: it mutates
 * only the supplied rendering target. It must not perform network calls, load
 * assets, import libraries dynamically, touch application state, read the
 * clock or any randomness, write storage, or do asynchronous work.
 *
 * `assets` is required — not because Slice 1's placeholder reads it, but
 * because accepting it makes it impossible to call the renderer without having
 * first awaited prepareRenderAssets(). The dependency is enforced by the
 * signature rather than by a comment.
 *
 * Preview and export differ ONLY by `target.scale`, which is why divergence
 * (PRD R2) is not a bug we test for but a state this design cannot represent.
 *
 * D-2, ADR-4. PRD FR-038, NFR-036.
 */
export function renderTemplate(
  target: RenderTarget,
  model: RenderModel,
  assets: RenderAssets,
): void {
  void assets

  const { ctx, scale } = target

  ctx.save()
  // The single transform. Every drawing call below is in design units.
  ctx.setTransform(scale, 0, 0, scale, 0, 0)

  switch (model.format) {
    case 'pfp':
      drawPfp(target, model)
      break
    case 'builder-card':
      drawBuilderCard(target, model)
      break
    // No default: `OutputFormat` is a closed union, so adding a format makes
    // this switch non-exhaustive and fails typecheck here — which is exactly
    // the reminder we want.
  }

  ctx.restore()
}
