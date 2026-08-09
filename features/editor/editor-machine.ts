import { clampCrop } from '@/lib/image/crop-geometry'
import { IDLE_STATE, type EditorAction, type EditorState } from './editor-state'

/**
 * The editor reducer. PURE: `(previousState, action) => nextState`.
 *
 * It does NOT call `NormalizedImage.release()`, `ImageBitmap.close()`,
 * `URL.revokeObjectURL()`, or any other side effect. Resource disposal is the
 * job of `use-editor-controller.ts`, which owns a ResourceSlot.
 *
 * Every crop entering state passes through clampCrop, including live user
 * adjustments. FR-020's "out of bounds is impossible by construction"
 * therefore holds for both preview and export.
 */
export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'file-selected':
      // Deliberately reachable from every phase: choosing a new file while one
      // is loading, or after an error, must always start cleanly. The
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
        crops: {
          pfp: clampCrop(action.crops.pfp),
          'builder-card': clampCrop(action.crops['builder-card']),
          crew: clampCrop(action.crops.crew),
        },
        pfpFrame: action.pfpFrame,
        quality: action.quality,
        fields: action.fields,
        crew: action.crew,
        isExporting: false,
        exportError: null,
        exported: null,
      }

    case 'format-changed':
      if (state.phase !== 'editing' || state.format === action.format) return state
      // The exported graphic belongs to the previous format, so it is dropped.
      // Keeping it would let the share panel offer a PFP while the preview
      // shows a card. The controller revokes its object URL.
      return { ...state, format: action.format, exported: null, exportError: null }

    case 'pfp-frame-changed':
      if (state.phase !== 'editing' || state.pfpFrame === action.frame) return state
      return { ...state, pfpFrame: action.frame, exported: null, exportError: null }

    case 'crop-changed':
      if (state.phase !== 'editing') return state
      return {
        ...state,
        crops: { ...state.crops, [action.format]: clampCrop(action.crop) },
        exported: null,
        exportError: null,
      }

    case 'fields-changed': {
      if (state.phase !== 'editing') return state
      const fields = { ...state.fields, ...action.fields }
      // Editing a field invalidates any export made before the edit.
      return { ...state, fields, exported: null }
    }

    case 'crew-fields-changed':
      if (state.phase !== 'editing') return state
      return {
        ...state,
        crew: { ...state.crew, ...action.fields },
        exported: null,
        exportError: null,
      }

    case 'crew-member-added':
      if (state.phase !== 'editing' || state.crew.members.length >= 3) return state
      return {
        ...state,
        crew: { ...state.crew, members: [...state.crew.members, action.member] },
        exported: null,
        exportError: null,
      }

    case 'crew-member-changed':
      if (state.phase !== 'editing') return state
      return {
        ...state,
        crew: {
          ...state.crew,
          members: state.crew.members.map((member) =>
            member.id === action.id ? { ...member, ...action.fields } : member,
          ),
        },
        exported: null,
        exportError: null,
      }

    case 'crew-member-removed':
      if (state.phase !== 'editing') return state
      return {
        ...state,
        crew: {
          ...state.crew,
          members: state.crew.members.filter((member) => member.id !== action.id),
        },
        exported: null,
        exportError: null,
      }

    case 'export-started':
      // Ignoring the action while an export is in flight is what makes
      // repeated Download taps harmless (FR-047).
      if (state.phase !== 'editing' || state.isExporting) return state
      return { ...state, isExporting: true, exportError: null }

    case 'export-settled':
      if (state.phase !== 'editing') return state
      return {
        ...state,
        isExporting: false,
        exportError: null,
        exported: action.exported,
      }

    case 'export-failed':
      if (state.phase !== 'editing') return state
      return { ...state, isExporting: false, exportError: action.error }

    case 'start-over':
      return IDLE_STATE
  }
}
