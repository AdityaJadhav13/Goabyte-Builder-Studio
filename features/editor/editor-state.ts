import type { ImageQuality } from '@/features/upload/validate-decoded-image'
import type {
  BuilderFields,
  CrewFields,
  CrewMember,
  OutputFormat,
  PfpFrameId,
  RenderAssets,
} from '@/features/render/types'
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
  readonly pfpFrame: PfpFrameId
  /**
   * Starts from the automatic subject-biased frame and can be adjusted by the
   * user. Keyed by format because the PFP and card use different photo wells —
   * switching formats must not reuse the other's frame (FR-019).
   */
  readonly crops: Readonly<Record<OutputFormat, CropRect>>
  readonly quality: ImageQuality
  readonly fields: BuilderFields
  readonly crew: CrewFields
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
      readonly pfpFrame: PfpFrameId
      readonly crew: CrewFields
    }
  | { readonly type: 'format-changed'; readonly format: OutputFormat }
  | { readonly type: 'pfp-frame-changed'; readonly frame: PfpFrameId }
  | {
      readonly type: 'crop-changed'
      readonly format: OutputFormat
      readonly crop: CropRect
    }
  | { readonly type: 'fields-changed'; readonly fields: Partial<BuilderFields> }
  | {
      readonly type: 'crew-fields-changed'
      readonly fields: Partial<Pick<CrewFields, 'teamName' | 'projectUrl'>>
    }
  | { readonly type: 'crew-member-added'; readonly member: CrewMember }
  | {
      readonly type: 'crew-member-changed'
      readonly id: string
      readonly fields: Partial<Pick<CrewMember, 'name' | 'role'>>
    }
  | { readonly type: 'crew-member-removed'; readonly id: string }
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

/**
 * The PFP needs nothing. The card needs a name, stack/role and team.
 *
 * Role is required rather than optional because an empty one left the layout
 * with a visible hole: closing the gap pushed the footer 180px off the bottom
 * edge, and growing the photo to absorb it would have changed the well's
 * aspect and invalidated the frame computed for it. A Builder ID without
 * "what you build" is half a card in any case.
 */
export const canExport = (state: EditingState): boolean => {
  switch (state.format) {
    case 'pfp':
      return true
    case 'builder-card':
      return (
        state.fields.name.trim().length > 0 &&
        state.fields.role.trim().length > 0 &&
        state.fields.team.trim().length > 0
      )
    case 'crew':
      return (
        state.fields.name.trim().length > 0 &&
        state.fields.role.trim().length > 0 &&
        (state.crew.teamName.trim().length > 0 || state.fields.team.trim().length > 0)
      )
  }
}
