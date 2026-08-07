import { clampCrop } from '@/lib/image/crop-geometry'
import { IDLE_STATE, type EditorAction, type EditorState } from './editor-state'

/**
 * The editor reducer. PURE: `(previousState, action) => nextState`.
 *
 * It does NOT call `NormalizedImage.release()`, `ImageBitmap.close()`,
 * `URL.revokeObjectURL()`, or any other side effect. Resource disposal is the
 * job of `use-editor-controller.ts`, which owns a ResourceSlot.
 *
 * That separation is what makes this file testable in plain Node with no DOM
 * and no fakes, and it is why a reducer bug can never leak memory.
 */
export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'file-selected':
      // Deliberately reachable from every phase: choosing a new file while
      // one is loading, or after an error, must always start cleanly. The
      // controller releases the outgoing image; this only describes state.
      return { phase: 'preparing', stage: 'validating', fileName: action.fileName }

    case 'stage-changed':
      if (state.phase !== 'preparing') return state
      return { ...state, stage: action.stage }

    case 'preparation-failed':
      return {
        phase: 'error',
        error: action.error,
        fileName: state.phase === 'preparing' ? state.fileName : null,
      }

    case 'image-ready':
      return {
        phase: 'editing',
        image: action.image,
        assets: action.assets,
        format: action.format,
        crop: clampCrop(action.crop),
        quality: action.quality,
        isExporting: false,
        exportError: null,
      }

    case 'crop-changed':
      if (state.phase !== 'editing') return state
      // Every crop entering state passes through clampCrop, which is how
      // FR-020's "out of bounds is impossible by construction" is delivered.
      return { ...state, crop: clampCrop(action.crop), quality: action.quality }

    case 'export-started':
      // Ignoring the action while an export is in flight is what makes
      // repeated Download taps harmless (FR-047).
      if (state.phase !== 'editing' || state.isExporting) return state
      return { ...state, isExporting: true, exportError: null }

    case 'export-settled':
      if (state.phase !== 'editing') return state
      return { ...state, isExporting: false, exportError: null }

    case 'export-failed':
      if (state.phase !== 'editing') return state
      return { ...state, isExporting: false, exportError: action.error }

    case 'start-over':
      return IDLE_STATE
  }
}
