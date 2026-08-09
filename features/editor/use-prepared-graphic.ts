'use client'

import { useEffect, useRef, useState } from 'react'
import type { RenderModel } from '@/features/render/types'
import type { ExportedGraphic } from './editor-state'

export type PreparationStatus = 'idle' | 'preparing' | 'ready' | 'error'

export interface PreparedGraphicState {
  readonly status: PreparationStatus
  readonly graphic: ExportedGraphic | null
  readonly error: string | null
}

const INITIAL: PreparedGraphicState = { status: 'idle', graphic: null, error: null }

/**
 * Prepare the current PNG in the background so a click can immediately invoke
 * native file sharing. Rendering after the click would lose Safari's transient
 * user activation before `navigator.share()` receives the File.
 */
export function usePreparedGraphic(
  model: RenderModel,
  subject: string | null,
  enabled: boolean,
): PreparedGraphicState {
  const [state, setState] = useState<PreparedGraphicState>(INITIAL)
  const runRef = useRef(0)
  const currentRef = useRef<ExportedGraphic | null>(null)

  useEffect(() => {
    const run = ++runRef.current
    if (currentRef.current) URL.revokeObjectURL(currentRef.current.objectUrl)
    currentRef.current = null

    if (!enabled) {
      setState(INITIAL)
      return
    }

    setState({ status: 'preparing', graphic: null, error: null })
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const { exportPng } = await import('@/features/export/export-png')
          const result = await exportPng(model, subject)
          const file = new File([result.blob], result.fileName, { type: 'image/png' })
          const graphic: ExportedGraphic = {
            file,
            objectUrl: URL.createObjectURL(result.blob),
            format: model.format,
          }

          if (run !== runRef.current) {
            URL.revokeObjectURL(graphic.objectUrl)
            return
          }
          currentRef.current = graphic
          setState({ status: 'ready', graphic, error: null })
        } catch {
          if (run !== runRef.current) return
          setState({
            status: 'error',
            graphic: null,
            error:
              'The share image could not be prepared. Adjust the frame or try again.',
          })
        }
      })()
    }, 260)

    return () => window.clearTimeout(timer)
  }, [model, subject, enabled])

  useEffect(
    () => () => {
      runRef.current++
      if (currentRef.current) URL.revokeObjectURL(currentRef.current.objectUrl)
    },
    [],
  )

  return state
}
