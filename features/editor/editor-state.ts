import type { ImageQuality } from '@/features/upload/validate-decoded-image'
import type { BuilderFields, OutputFormat, RenderAssets } from '@/features/render/types'
import type { AppError } from '@/lib/errors/app-error'
import type { CropRect } from '@/lib/image/crop-geometry'
import type { NormalizedImage } from '@/lib/image/normalized-image'

/**
 * Editor state as a discriminated union, so impossible states are
 * unrepresentable rather than merely unlikely.
 *
 * ARCHITECTURE §8.
 */

/** User-visible preparation stages. Each maps to specific status copy. */
export type PreparationStage =
  'validating' | 'decoding' | 'normalizing' | 'preparing-assets'

/** The exported PNG, held so it can be shared without re-rendering. */
export interface ExportedGraphic {
  readonly file: File
  readonly objectUrl: string
  readonly format: OutputFormat
}

export interface EditingState {
  readonly phase: 'editing'
  readonly image: NormalizedImage
  readonly assets: RenderAssets
  readonly format: OutputFormat
  /**
   * Computed automatically per format and never user-edited (D-9). Keyed by
   * format because the PFP frames a square and the card frames a 5:4 well —
   * switching formats must not reuse the other's frame (FR-019).
   */
  readonly crops: Readonly<Record<OutputFormat, CropRect>>
  readonly quality: ImageQuality
  readonly fields: BuilderFields
  readonly isExporting: boolean
  /**
   * A failed export must NOT drop the user into the error phase — that would
   * discard a perfectly good loaded image and force them to upload again over
   * a transient failure. The error is surfaced inline, in place, with retry.
   */
  readonly exportError: AppError | null
  /** Present once an export has succeeded; drives the share panel. */
  readonly exported: ExportedGraphic | null
}

export type EditorState =
  | { readonly phase: 'idle' }
  | {
      readonly phase: 'preparing'
      readonly stage: PreparationStage
      readonly fileName: string
    }
  | {
      readonly phase: 'error'
      readonly error: AppError
      readonly fileName: string | null
    }
  | EditingState

export type EditorAction =
  | { readonly type: 'file-selected'; readonly fileName: string }
  | { readonly type: 'stage-changed'; readonly stage: PreparationStage }
  | { readonly type: 'preparation-failed'; readonly error: AppError }
  | {
      readonly type: 'image-ready'
      readonly image: NormalizedImage
      readonly assets: RenderAssets
      readonly format: OutputFormat
      readonly crops: Readonly<Record<OutputFormat, CropRect>>
      readonly quality: ImageQuality
      readonly fields: BuilderFields
    }
  | { readonly type: 'format-changed'; readonly format: OutputFormat }
  | { readonly type: 'fields-changed'; readonly fields: Partial<BuilderFields> }
  | { readonly type: 'export-started' }
  | { readonly type: 'export-settled'; readonly exported: ExportedGraphic }
  | { readonly type: 'export-failed'; readonly error: AppError }
  | { readonly type: 'start-over' }

export const IDLE_STATE: EditorState = { phase: 'idle' }

export const isEditing = (state: EditorState): state is EditingState =>
  state.phase === 'editing'

/** True while any long-running work is in flight — drives disabled states. */
export const isBusy = (state: EditorState): boolean =>
  state.phase === 'preparing' || (isEditing(state) && state.isExporting)

/** The card cannot render without a name; the PFP needs nothing. */
export const canExport = (state: EditingState): boolean =>
  state.format === 'pfp' || state.fields.name.trim().length > 0
