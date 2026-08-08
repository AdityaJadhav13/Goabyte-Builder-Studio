'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { FormatShowcase } from '@/components/layout/FormatShowcase'
import { Hero } from '@/components/layout/Hero'
import { Panel } from '@/components/layout/Panel'
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
      {preparing ? (
        <Panel className="mx-auto flex min-h-[220px] max-w-3xl flex-col justify-center gap-4 px-6 py-10">
          <StatusMessage>{STAGE_COPY[state.stage]}</StatusMessage>
          <p className="truncate text-xs text-cream-dim/60">{state.fileName}</p>
        </Panel>
      ) : null}

      {state.phase === 'error' ? (
        <Panel className="mx-auto max-w-3xl space-y-5 p-6 sm:p-8">
          <InlineError error={state.error} />
          <UploadDropzone onFile={editor.selectFile} label="Try another photo" />
        </Panel>
      ) : null}

      {editingNow ? <EditorWorkspace state={state} editor={editor} /> : null}

      {state.phase === 'idle' ? (
        /* ONE opaque card carrying the entire first step, floating on the
           illustration. The hero lives inside it rather than on the artwork:
           measured directly on the backdrop, the headline was 1.84:1 and the
           tagline 2.97:1. On this panel everything is 11.85:1. The backdrop
           supplies depth; the panel supplies contrast. */
        <Panel className="mx-auto max-w-3xl space-y-7 p-6 sm:p-9">
          <Hero compact={false} />

          <div className="space-y-3 border-t-2 border-green-600 pt-6">
            <h2 className="text-xs font-bold tracking-[0.18em] text-yellow uppercase">
              What you&rsquo;ll get
            </h2>
            <FormatShowcase />
          </div>

          <UploadDropzone onFile={editor.selectFile} />
        </Panel>
      ) : null}
    </div>
  )
}
