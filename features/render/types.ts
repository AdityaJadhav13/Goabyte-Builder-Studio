import type { CropRect } from '@/lib/image/crop-geometry'
import type { NormalizedImage } from '@/lib/image/normalized-image'

/**
 * The shared vocabulary between the React application and the image engine.
 * ARCHITECTURE §5 — this is the integration contract.
 */

/**
 * Slice 1 ships one format. `builder-card` is deliberately ABSENT rather than
 * declared-but-unimplemented: a union member with no template behind it would
 * force a runtime throw that lies about being supported. Adding it in Slice 3
 * is a one-line change, and the exhaustive switch in render-template.ts will
 * then point the compiler at every site that needs updating.
 */
export type OutputFormat = 'pfp'

export interface OutputSize {
  readonly width: number
  readonly height: number
}

/**
 * Export dimensions in design units. The ONLY place these numbers exist —
 * filenames, previews, quality warnings and tests all read them from here so
 * they cannot disagree (ADR-7).
 */
export const DESIGN: Record<OutputFormat, OutputSize> = {
  pfp: { width: 1080, height: 1080 },
}

export const aspectOf = (format: OutputFormat): number =>
  DESIGN[format].width / DESIGN[format].height

/** Preview backing stores are capped at 2× regardless of device DPR (FR-039). */
export const PREVIEW_DPR_CAP = 2

export interface RenderModel {
  readonly format: OutputFormat
  readonly image: NormalizedImage
  readonly crop: CropRect
}

export interface RenderTarget {
  readonly ctx: CanvasRenderingContext2D
  /** Design units → device pixels. Preview ≈0.45, export exactly 1.0. */
  readonly scale: number
}

/**
 * Proof that asynchronous preparation has completed.
 *
 * `fonts` is the literal 'ready' rather than a boolean deliberately: a boolean
 * can be `false` and still typecheck at a call site, whereas the only way to
 * obtain this value is to have awaited prepareRenderAssets(). The guarantee is
 * carried in the type rather than in a runtime check.
 */
export interface RenderAssets {
  readonly fonts: 'ready'
  readonly art: ReadonlyMap<string, ImageBitmap>
}

export interface ExportResult {
  readonly blob: Blob
  readonly width: number
  readonly height: number
  readonly fileName: string
  readonly durationMs: number
}
