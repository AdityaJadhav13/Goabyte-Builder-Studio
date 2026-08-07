import type { ImageQuality } from '@/features/upload/validate-decoded-image'
import type { OutputFormat, RenderAssets } from '@/features/render/types'
import type { AppError } from '@/lib/errors/app-error'
import type { CropRect } from '@/lib/image/crop-geometry'
import type { NormalizedImage } from '@/lib/image/normalized-image'

/**
 * Editor state as a discriminated union, so impossible states are
 * unrepresentable rather than merely unlikely.
 *
 * A flat object with nullable fields — `{ image: NormalizedImage | null,
 * status: 'ready' }` — permits `status: 'ready'` alongside `image: null`. That
 * state is meaningless but typechecks, so every consumer has to defend against
 * it and eventually one won't. Here `state.image` only exists where an image
 * provably exists.
 *
 * ARCHITECTURE §8.
 */

/** User-visible preparation stages. Each maps to specific status copy. */
export type PreparationStage =
  'validating' | 'decoding' | 'normalizing' | 'preparing-assets'

export interface EditingState {
  readonly phase: 'editing'
  readonly image: NormalizedImage
  readonly assets: RenderAssets
  readonly format: OutputFormat
  /** Computed automatically at image-ready. Never user-edited (D-9). */
  readonly crop: CropRect
  readonly quality: ImageQuality
  /**
   * Modelled as a flag on `editing` rather than as a separate `exporting`
   * phase (a documented deviation from ARCHITECTURE §8). A distinct phase
   * would have to carry the entire editing state as `previous` for every
   * consumer to unwrap, while removing no real risk: exporting-without-an-image
   * is already unrepresentable because the flag lives inside `editing`.
   */
  readonly isExporting: boolean
  /**
   * A failed export must NOT drop the user into the error phase — that would
   * discard a perfectly good loaded image and force them to upload again over
   * a transient failure. The error is surfaced inline, in place, with retry.
   */
  readonly exportError: AppError | null
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
      readonly crop: CropRect
      readonly quality: ImageQuality
    }
  | { readonly type: 'export-started' }
  | { readonly type: 'export-settled' }
  | { readonly type: 'export-failed'; readonly error: AppError }
  | { readonly type: 'start-over' }

export const IDLE_STATE: EditorState = { phase: 'idle' }

export const isEditing = (state: EditorState): state is EditingState =>
  state.phase === 'editing'

/** True while any long-running work is in flight — drives disabled states. */
export const isBusy = (state: EditorState): boolean =>
  state.phase === 'preparing' || (isEditing(state) && state.isExporting)
