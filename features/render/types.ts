import type { CropRect } from '@/lib/image/crop-geometry'
import type { NormalizedImage } from '@/lib/image/normalized-image'

/**
 * The shared vocabulary between the React application and the image engine.
 * ARCHITECTURE §5 — this is the integration contract.
 */

export type OutputFormat = 'pfp' | 'builder-card'

export const OUTPUT_FORMATS: readonly OutputFormat[] = ['pfp', 'builder-card']

export const FORMAT_LABEL: Record<OutputFormat, string> = {
  pfp: 'Profile picture',
  'builder-card': 'Builder ID',
}

export interface OutputSize {
  readonly width: number
  readonly height: number
}

/**
 * Export dimensions in design units. The ONLY place these numbers exist —
 * filenames, previews, quality warnings and tests all read them from here so
 * they cannot disagree (ADR-7).
 *
 * The card is 1080×1350 (4:5) per D-4. Critical content stays inside a
 * conservative central safe region justified by overlays, reposts, embeds and
 * thumbnails rather than by any single platform's current crop behaviour.
 */
export const DESIGN: Record<OutputFormat, OutputSize> = {
  pfp: { width: 1080, height: 1080 },
  'builder-card': { width: 1080, height: 1350 },
}

/**
 * Aspect of the PHOTO AREA, which is not the aspect of the output. The PFP is
 * a full-bleed square; the card's photo well is 5:4 inside a 4:5 canvas.
 * Automatic framing needs the photo aspect, never the canvas aspect.
 */
export const PHOTO_ASPECT: Record<OutputFormat, number> = {
  pfp: 1,
  'builder-card': 952 / 760,
}

export const aspectOf = (format: OutputFormat): number => PHOTO_ASPECT[format]

/** Preview backing stores are capped at 2× regardless of device DPR (FR-039). */
export const PREVIEW_DPR_CAP = 2

/**
 * Widest the preview is allowed to render on a large screen, per format.
 *
 * Uncapped, the 4:5 card rendered ~800px tall on desktop, dominating the
 * viewport and leaving the control column floating above 500px of dead space.
 * Capping by format keeps both columns in the same visual register.
 */
export const PREVIEW_MAX_WIDTH_PX: Record<OutputFormat, number> = {
  pfp: 520,
  'builder-card': 430,
}

export interface BuilderFields {
  readonly name: string
  readonly role: string
  /** null ⇒ omit the chip and reflow; never render an empty chip (FR-033). */
  readonly title: string | null
}

export interface RenderModel {
  readonly format: OutputFormat
  readonly image: NormalizedImage
  readonly crop: CropRect
  /** Required for 'builder-card', ignored by 'pfp'. */
  readonly fields: BuilderFields | null
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
