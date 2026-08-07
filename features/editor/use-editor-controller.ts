'use client'

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { prepareRenderAssets } from '@/features/render/assets'
import { aspectOf, DESIGN, type OutputFormat } from '@/features/render/types'
import { exportPng } from '@/features/export/export-png'
import { saveBlob } from '@/features/export/download'
import { validateDecodedImage } from '@/features/upload/validate-decoded-image'
import { validateRawFile } from '@/features/upload/validate-file'
import { appError, isAppError, type AppError } from '@/lib/errors/app-error'
import { decodeImage } from '@/lib/image/decode'
import { normalizeImage } from '@/lib/image/normalize'
import { autoFrame, effectiveResolution } from '@/lib/image/crop-geometry'
import type { NormalizedImage } from '@/lib/image/normalized-image'
import { ResourceSlot } from '@/lib/resource/resource-slot'
import { editorReducer } from './editor-machine'
import { IDLE_STATE, isEditing, type EditorState } from './editor-state'

/**
 * Orchestration and resource lifecycle.
 *
 * The reducer describes state; this owns the effects. Specifically it owns the
 * one `NormalizedImage` that exists at a time, via a ResourceSlot:
 *
 *   creates  — normalizeImage(), inside runPipeline
 *   owns     — the ResourceSlot in `slotRef`, one per mounted editor
 *   replaces — slot.adopt(next), which releases the previous exactly once
 *   disposes — start-over, pipeline failure, and unmount (safety net)
 *
 * ARCHITECTURE §8.
 */

const DEFAULT_FORMAT: OutputFormat = 'pfp'

export interface EditorController {
  readonly state: EditorState
  selectFile(file: File): void
  download(): void
  startOver(): void
}

export function useEditorController(): EditorController {
  const [state, dispatch] = useReducer(editorReducer, IDLE_STATE)

  const slotRef = useRef<ResourceSlot<NormalizedImage> | null>(null)
  if (slotRef.current === null) slotRef.current = new ResourceSlot<NormalizedImage>()

  /**
   * Monotonic token identifying the newest pipeline run. A superseded run
   * releases its own result rather than adopting it, so selecting a second
   * file mid-decode can never leak the first or publish a stale image.
   */
  const runIdRef = useRef(0)

  // Safety net only. Explicit disposal on start-over and on failure is the
  // actual mechanism; this catches navigation away mid-flight.
  useEffect(() => {
    const slot = slotRef.current
    return () => slot?.dispose()
  }, [])

  const failPipeline = useCallback((error: AppError) => {
    slotRef.current?.adopt(null)
    dispatch({ type: 'preparation-failed', error })
  }, [])

  const selectFile = useCallback(
    (file: File) => {
      const runId = ++runIdRef.current
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

          // Automatic framing (D-9). Deterministic, so the preview the user
          // sees is exactly what downloads.
          const crop = autoFrame(image.width, image.height, aspectOf(DEFAULT_FORMAT))
          const quality = effectiveResolution(crop, image, DESIGN[DEFAULT_FORMAT].width)

          // adopt() and dispatch() run in the same synchronous block. React
          // batches synchronous updates, so no render can observe the window
          // where the previous image is released but state still points at it.
          slotRef.current?.adopt(image)
          dispatch({
            type: 'image-ready',
            image,
            assets,
            format: DEFAULT_FORMAT,
            crop,
            quality: decodedResult.value.quality === 'soft' ? 'soft' : quality,
          })
        } catch (cause) {
          if (isStale()) return
          failPipeline(isAppError(cause) ? cause : appError('DECODE_FAILED', { cause }))
        }
      })()
    },
    [failPipeline],
  )

  const download = useCallback(() => {
    if (!isEditing(state) || state.isExporting) return
    const model = { format: state.format, image: state.image, crop: state.crop }

    dispatch({ type: 'export-started' })
    void (async () => {
      try {
        const result = await exportPng(model)
        saveBlob(result.blob, result.fileName)
        dispatch({ type: 'export-settled' })
      } catch (cause) {
        dispatch({
          type: 'export-failed',
          error: isAppError(cause) ? cause : appError('EXPORT_FAILED', { cause }),
        })
      }
    })()
  }, [state])

  const startOver = useCallback(() => {
    // Invalidate any in-flight run so its result is released, not adopted.
    runIdRef.current++
    slotRef.current?.adopt(null)
    dispatch({ type: 'start-over' })
  }, [])

  return useMemo(
    () => ({ state, selectFile, download, startOver }),
    [state, selectFile, download, startOver],
  )
}
