import { describe, expect, it } from 'vitest'
import { editorReducer } from '@/features/editor/editor-machine'
import {
  IDLE_STATE,
  isBusy,
  type EditingState,
  type EditorState,
} from '@/features/editor/editor-state'
import { appError } from '@/lib/errors/app-error'
import { createNormalizedImage } from '@/lib/image/normalized-image'
import type { RenderAssets } from '@/features/render/types'

/**
 * The reducer is pure, so it tests in plain Node with no DOM, no fakes and no
 * act(). That is the payoff of keeping disposal in the controller.
 */

const ASSETS: RenderAssets = { fonts: 'ready', art: new Map() }

let disposals = 0
const image = () =>
  createNormalizedImage({
    source: {} as CanvasImageSource,
    width: 2400,
    height: 2400,
    provenance: {
      originalWidth: 2400,
      originalHeight: 2400,
      mimeType: 'image/jpeg',
      byteSize: 1,
      heicConverted: false,
      downscaled: false,
    },
    dispose: () => {
      disposals++
    },
  })

const editing = (overrides: Partial<EditingState> = {}): EditorState => ({
  phase: 'editing',
  image: image(),
  assets: ASSETS,
  format: 'pfp',
  crop: { x: 0, y: 0, width: 1, height: 1 },
  quality: 'ok',
  isExporting: false,
  exportError: null,
  ...overrides,
})

describe('reducer purity', () => {
  it('never disposes a resource — that is the controller̓s job', () => {
    disposals = 0
    const state = editing()

    editorReducer(state, { type: 'start-over' })
    editorReducer(state, { type: 'file-selected', fileName: 'new.jpg' })
    editorReducer(state, {
      type: 'preparation-failed',
      error: appError('DECODE_FAILED'),
    })

    expect(disposals).toBe(0)
  })

  it('does not mutate the state it is given', () => {
    const state = editing()
    const snapshot = { ...state }
    editorReducer(state, { type: 'export-started' })
    expect(state).toEqual(snapshot)
  })

  it('is deterministic — same input, same output', () => {
    const state = editing()
    const action = { type: 'export-started' as const }
    expect(editorReducer(state, action)).toEqual(editorReducer(state, action))
  })
})

describe('preparation flow', () => {
  it('enters preparing from idle', () => {
    const next = editorReducer(IDLE_STATE, { type: 'file-selected', fileName: 'a.jpg' })
    expect(next).toEqual({ phase: 'preparing', stage: 'validating', fileName: 'a.jpg' })
  })

  it('allows a new file from any phase, including mid-preparation', () => {
    for (const state of [
      IDLE_STATE,
      editing(),
      { phase: 'error' as const, error: appError('DECODE_FAILED'), fileName: 'x' },
    ]) {
      expect(
        editorReducer(state, { type: 'file-selected', fileName: 'b.jpg' }).phase,
      ).toBe('preparing')
    }
  })

  it('advances stages while preparing', () => {
    const preparing = editorReducer(IDLE_STATE, {
      type: 'file-selected',
      fileName: 'a.jpg',
    })
    const next = editorReducer(preparing, { type: 'stage-changed', stage: 'normalizing' })
    expect(next).toMatchObject({ phase: 'preparing', stage: 'normalizing' })
  })

  it('ignores a stage change that arrives after the phase moved on', () => {
    const state = editing()
    expect(editorReducer(state, { type: 'stage-changed', stage: 'decoding' })).toBe(state)
  })

  it('keeps the filename on failure so the error can reference it', () => {
    const preparing = editorReducer(IDLE_STATE, {
      type: 'file-selected',
      fileName: 'a.jpg',
    })
    const failed = editorReducer(preparing, {
      type: 'preparation-failed',
      error: appError('HEIC_UNSUPPORTED'),
    })
    expect(failed).toMatchObject({ phase: 'error', fileName: 'a.jpg' })
  })
})

describe('framing', () => {
  it('clamps the automatic frame on the way into state — FR-020', () => {
    // There is no crop action any more (D-9); image-ready is the single entry
    // point for a frame, so it is the only place clamping has to hold.
    const next = editorReducer(IDLE_STATE, {
      type: 'image-ready',
      image: image(),
      assets: ASSETS,
      format: 'pfp',
      crop: { x: 5, y: -3, width: 2, height: 2 },
      quality: 'ok',
    })
    expect(next).toMatchObject({ crop: { x: 0, y: 0, width: 1, height: 1 } })
  })
})

describe('export', () => {
  it('ignores a second export while one is in flight — FR-047', () => {
    const exporting = editorReducer(editing(), { type: 'export-started' })
    expect(editorReducer(exporting, { type: 'export-started' })).toBe(exporting)
  })

  it('surfaces a failure inline and KEEPS the loaded image', () => {
    // A transient export failure must not throw away a good upload.
    const exporting = editorReducer(editing(), { type: 'export-started' })
    const failed = editorReducer(exporting, {
      type: 'export-failed',
      error: appError('EXPORT_FAILED'),
    })

    expect(failed.phase).toBe('editing')
    expect(failed).toMatchObject({
      isExporting: false,
      exportError: { code: 'EXPORT_FAILED' },
    })
  })

  it('clears a previous error when a new export starts', () => {
    const failed = editorReducer(editorReducer(editing(), { type: 'export-started' }), {
      type: 'export-failed',
      error: appError('EXPORT_FAILED'),
    })
    expect(editorReducer(failed, { type: 'export-started' })).toMatchObject({
      exportError: null,
    })
  })
})

describe('start over', () => {
  it('returns to idle from every phase', () => {
    for (const state of [
      IDLE_STATE,
      editing(),
      { phase: 'error' as const, error: appError('DECODE_FAILED'), fileName: null },
    ]) {
      expect(editorReducer(state, { type: 'start-over' })).toEqual(IDLE_STATE)
    }
  })
})

describe('isBusy', () => {
  it('is true while preparing and while exporting, false otherwise', () => {
    expect(isBusy(IDLE_STATE)).toBe(false)
    expect(isBusy({ phase: 'preparing', stage: 'decoding', fileName: 'a' })).toBe(true)
    expect(isBusy(editing())).toBe(false)
    expect(isBusy(editing({ isExporting: true }))).toBe(true)
  })
})
