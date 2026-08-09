'use client'

import { useCallback, useMemo, useReducer, useRef } from 'react'
import { prepareRenderAssets } from '@/features/render/assets'
import {
  aspectOf,
  DESIGN,
  OUTPUT_FORMATS,
  type BuilderFields,
  type OutputFormat,
} from '@/features/render/types'
import { saveBlob } from '@/features/export/download'
import { validateDecodedImage } from '@/features/upload/validate-decoded-image'
import { validateRawFile } from '@/features/upload/validate-file'
import { appError, isAppError, type AppError } from '@/lib/errors/app-error'
import { decodeImage } from '@/lib/image/decode'
import { normalizeImage } from '@/lib/image/normalize'
import { autoFrame, effectiveResolution, type CropRect } from '@/lib/image/crop-geometry'
import type { NormalizedImage } from '@/lib/image/normalized-image'
import { type Releasable } from '@/lib/resource/resource-slot'
import { useResourceSlot } from './use-resource-slot'
import { editorReducer } from './editor-machine'
import {
  IDLE_STATE,
  isEditing,
  type EditorState,
  type ExportedGraphic,
} from './editor-state'

/**
 * Orchestration and resource lifecycle.
 *
 * The reducer describes state; this owns the effects. It owns TWO replaceable
 * resources, each in its own slot:
 *
 *   image  — the NormalizedImage. created by normalizeImage(), replaced on a
 *            new upload, disposed on start-over, failure and unmount.
 *   export — the object URL of the last exported PNG, needed by the share
 *            panel. Replaced on every successful export, dropped whenever the
 *            graphic it represents becomes stale (format or field change).
 *
 * Both follow the same discipline: adopt() releases the previous exactly once,
 * dispose() is idempotent, unmount is a safety net rather than the mechanism.
 *
 * ARCHITECTURE §8.
 */

const DEFAULT_FORMAT: OutputFormat = 'pfp'

const EMPTY_FIELDS: BuilderFields = { name: '', role: '', title: null }

/**
 * Floor on how long the preparing phase stays visible.
 *
 * A fast decode fired four stage messages in under 100ms, which reads as a
 * glitch rather than as speed — the eye registers flicker, not performance.
 * Holding the state briefly makes the same work feel deliberate. Applied only
 * to the SUCCESS path: an error should surface the instant it is known.
 */
const MIN_PREPARING_MS = 420

const settleAfter = (startedAt: number): Promise<void> => {
  const remaining = MIN_PREPARING_MS - (performance.now() - startedAt)
  return remaining > 0 ? new Promise((r) => setTimeout(r, remaining)) : Promise.resolve()
}

/** Wraps an exported PNG's object URL so a ResourceSlot can own it. */
function ownedExport(exported: ExportedGraphic): ExportedGraphic & Releasable {
  let released = false
  return {
    ...exported,
    release() {
      if (released) return
      released = true
      URL.revokeObjectURL(exported.objectUrl)
    },
  }
}

function framesFor(image: NormalizedImage): Record<OutputFormat, CropRect> {
  // One frame per format: the PFP frames a square, the card a 5:4 well.
  return Object.fromEntries(
    OUTPUT_FORMATS.map((format) => [
      format,
      autoFrame(image.width, image.height, aspectOf(format)),
    ]),
  ) as Record<OutputFormat, CropRect>
}

export interface EditorController {
  readonly state: EditorState
  selectFile(file: File): void
  setFormat(format: OutputFormat): void
  setCrop(format: OutputFormat, crop: CropRect): void
  setFields(fields: Partial<BuilderFields>): void
  download(): void
  startOver(): void
}

export function useEditorController(): EditorController {
  const [state, dispatch] = useReducer(editorReducer, IDLE_STATE)

  // Resolved at point of USE, never cached across a remount — a disposed slot
  // would otherwise release every image the pipeline handed it, publishing a
  // blank preview. See `reviveSlot`.
  const imageSlot = useResourceSlot<NormalizedImage>()
  const exportSlot = useResourceSlot<ExportedGraphic & Releasable>()

  /**
   * Monotonic token identifying the newest pipeline run. A superseded run
   * releases its own result rather than adopting it, so selecting a second
   * file mid-decode can never leak the first or publish a stale image.
   */
  const runIdRef = useRef(0)

  const failPipeline = useCallback(
    (error: AppError) => {
      imageSlot.get().adopt(null)
      exportSlot.get().adopt(null)
      dispatch({ type: 'preparation-failed', error })
    },
    [imageSlot, exportSlot],
  )

  const selectFile = useCallback(
    (file: File) => {
      const runId = ++runIdRef.current
      const startedAt = performance.now()
      const isStale = () => runId !== runIdRef.current

      dispatch({ type: 'file-selected', fileName: file.name })

      void (async () => {
        try {
          // ── validate raw file: bytes only, no pixel claims ──────────────
          const rawResult = await validateRawFile(file)
          if (isStale()) return
          if (!rawResult.ok) return failPipeline(rawResult.error)

          // ── decode ──────────────────────────────────────────────────────
          dispatch({ type: 'stage-changed', stage: 'decoding' })
          const decoded = await decodeImage(file)
          if (isStale()) {
            decoded.close()
            return
          }

          // ── validate decoded image: now dimensions are real ─────────────
          const decodedResult = validateDecodedImage(decoded.width, decoded.height)
          if (!decodedResult.ok) {
            decoded.close()
            return failPipeline(decodedResult.error)
          }

          // ── normalize ───────────────────────────────────────────────────
          dispatch({ type: 'stage-changed', stage: 'normalizing' })
          let image
          try {
            image = normalizeImage(decoded, file)
          } catch (cause) {
            // normalizeImage closes `decoded` on the success path only, so a
            // failure part-way through (canvas allocation) would otherwise leak
            // a full-resolution decode — the exact thing that kills an iOS tab.
            // close() is idempotent, so this is safe.
            decoded.close()
            throw cause
          }
          if (isStale()) {
            image.release()
            return
          }

          // ── prepare render dependencies ─────────────────────────────────
          dispatch({ type: 'stage-changed', stage: 'preparing-assets' })
          const assets = await prepareRenderAssets(DEFAULT_FORMAT)
          if (isStale()) {
            image.release()
            return
          }

          // Automatic starting frame (D-9a), one per format. Optional user
          // changes stay deterministic, so preview still exactly matches export.
          const crops = framesFor(image)
          const quality = effectiveResolution(
            crops[DEFAULT_FORMAT],
            image,
            DESIGN[DEFAULT_FORMAT].width,
          )

          await settleAfter(startedAt)
          if (isStale()) {
            image.release()
            return
          }

          // adopt() and dispatch() run in the same synchronous block. React
          // batches synchronous updates, so no render can observe the window
          // where the previous image is released but state still points at it.
          // A genuinely unmounted editor must not resurrect a slot nobody
          // will dispose — release and stop instead.
          if (!imageSlot.isLive()) {
            image.release()
            return
          }
          imageSlot.get().adopt(image)
          exportSlot.get().adopt(null)
          dispatch({
            type: 'image-ready',
            image,
            assets,
            format: DEFAULT_FORMAT,
            crops,
            quality: decodedResult.value.quality === 'soft' ? 'soft' : quality,
            fields: EMPTY_FIELDS,
          })
        } catch (cause) {
          if (isStale()) return
          failPipeline(isAppError(cause) ? cause : appError('DECODE_FAILED', { cause }))
        }
      })()
    },
    [failPipeline, imageSlot, exportSlot],
  )

  const setFormat = useCallback(
    (format: OutputFormat) => {
      // The previous export belongs to the old format; release it as the state
      // that referenced it goes away.
      exportSlot.get().adopt(null)
      dispatch({ type: 'format-changed', format })
    },
    [exportSlot],
  )

  const setFields = useCallback(
    (fields: Partial<BuilderFields>) => {
      exportSlot.get().adopt(null)
      dispatch({ type: 'fields-changed', fields })
    },
    [exportSlot],
  )

  const setCrop = useCallback(
    (format: OutputFormat, crop: CropRect) => {
      exportSlot.get().adopt(null)
      dispatch({ type: 'crop-changed', format, crop })
    },
    [exportSlot],
  )

  const download = useCallback(() => {
    if (!isEditing(state) || state.isExporting) return

    const { format, image, fields } = state
    const model = {
      format,
      image,
      crop: state.crops[format],
      fields: format === 'builder-card' ? fields : null,
    }
    // The card is titled by name; the PFP has no name to use.
    const subject = format === 'builder-card' ? fields.name : null

    dispatch({ type: 'export-started' })
    void (async () => {
      try {
        // Dynamically imported so the render layer is not in the landing
        // chunk. This is the ASYNC download path, not the renderer — the
        // renderer itself remains synchronous and import-free (ADR-4).
        const { exportPng } = await import('@/features/export/export-png')
        const result = await exportPng(model, subject)
        const file = new File([result.blob], result.fileName, { type: 'image/png' })
        const exported = ownedExport({
          file,
          objectUrl: URL.createObjectURL(result.blob),
          format,
        })

        exportSlot.get().adopt(exported)
        saveBlob(result.blob, result.fileName)
        dispatch({ type: 'export-settled', exported })
      } catch (cause) {
        dispatch({
          type: 'export-failed',
          error: isAppError(cause) ? cause : appError('EXPORT_FAILED', { cause }),
        })
      }
    })()
  }, [state, exportSlot])

  const startOver = useCallback(() => {
    // Invalidate any in-flight run so its result is released, not adopted.
    runIdRef.current++
    imageSlot.get().adopt(null)
    exportSlot.get().adopt(null)
    dispatch({ type: 'start-over' })
  }, [imageSlot, exportSlot])

  return useMemo(
    () => ({ state, selectFile, setFormat, setCrop, setFields, download, startOver }),
    [state, selectFile, setFormat, setCrop, setFields, download, startOver],
  )
}
