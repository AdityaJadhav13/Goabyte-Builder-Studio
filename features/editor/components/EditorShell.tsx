'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { FormatShowcase } from '@/components/layout/FormatShowcase'
import { Hero } from '@/components/layout/Hero'
import { HeroPoster } from '@/components/layout/HeroPoster'
import { InlineError } from '@/components/ui/InlineError'
import { StatusMessage } from '@/components/ui/StatusMessage'
import { UploadDropzone } from '@/features/upload/components/UploadDropzone'
import { useEditorController } from '../use-editor-controller'
import { isEditing, type PreparationStage } from '../editor-state'

/**
 * Routes editor phase → UI. One responsibility: deciding what is on screen.
 * It holds no pipeline logic and no editor state of its own.
 *
 * There is no crop step (D-9). Upload lands the user directly on a finished,
 * automatically framed result.
 *
 * The workspace is a separate chunk so the landing view does not carry the
 * render layer (NFR-002). It is PREFETCHED as soon as a file is chosen, which
 * means the download overlaps decoding and the user never sees a second
 * loading state.
 */
const loadWorkspace = () => import('./EditorWorkspace').then((m) => m.EditorWorkspace)

const EditorWorkspace = dynamic(loadWorkspace, { ssr: false })

const STAGE_COPY: Record<PreparationStage, string> = {
  validating: 'Checking your photo…',
  decoding: 'Reading your photo…',
  normalizing: 'Framing your photo…',
  'preparing-assets': 'Almost there…',
}

export function EditorShell() {
  const editor = useEditorController()
  const { state } = editor

  const preparing = state.phase === 'preparing'
  const editingNow = isEditing(state)

  // Fetch the workspace chunk while the photo is still decoding, so it is
  // already resident by the time the editing phase renders.
  useEffect(() => {
    if (preparing) void loadWorkspace()
  }, [preparing])

  return (
    <div className="space-y-8">
      {/* Idle is the only state that earns the poster. Placing it BESIDE the
          copy rather than under it matters on desktop: stacked, it filled the
          viewport and pushed the upload control — the actual thing we want
          people to reach — below the fold. */}
      {state.phase === 'idle' ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center">
          <Hero compact={false} />
          <HeroPoster />
        </div>
      ) : (
        <Hero compact={preparing || editingNow} />
      )}

      {preparing ? (
        <div className="flex min-h-[220px] flex-col justify-center gap-4 border-2 border-cream-dim/25 px-6 py-10">
          <StatusMessage>{STAGE_COPY[state.stage]}</StatusMessage>
          <p className="truncate text-xs text-cream-dim/60">{state.fileName}</p>
        </div>
      ) : null}

      {state.phase === 'error' ? (
        <div className="space-y-4">
          <InlineError error={state.error} />
          <UploadDropzone onFile={editor.selectFile} label="Try another photo" />
        </div>
      ) : null}

      {editingNow ? <EditorWorkspace state={state} editor={editor} /> : null}

      {state.phase === 'idle' ? (
        <div className="space-y-6">
          <FormatShowcase />
          <UploadDropzone onFile={editor.selectFile} />
        </div>
      ) : null}
    </div>
  )
}
