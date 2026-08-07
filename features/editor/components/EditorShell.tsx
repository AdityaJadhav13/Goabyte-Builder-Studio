'use client'

import dynamic from 'next/dynamic'
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
 * The workspace is loaded on demand. Before a photo exists the landing view
 * needs a dropzone and nothing else, so it should not carry the render layer —
 * both templates, the text-fitting engine and the drawing primitives arrive
 * with the workspace chunk instead. That chunk is fetched while the photo is
 * being decoded, so it costs the user no visible time (NFR-002).
 */
const EditorWorkspace = dynamic(
  () => import('./EditorWorkspace').then((m) => m.EditorWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 animate-pulse border-2 border-cream-dim/20" aria-hidden />
    ),
  },
)

const STAGE_COPY: Record<PreparationStage, string> = {
  validating: 'Checking your photo…',
  decoding: 'Reading your photo…',
  normalizing: 'Framing your photo…',
  'preparing-assets': 'Almost there…',
}

export function EditorShell() {
  const editor = useEditorController()
  const { state } = editor

  if (state.phase === 'preparing') {
    return (
      <div className="flex min-h-[220px] flex-col justify-center gap-4 border-2 border-cream-dim/25 px-6 py-10">
        <StatusMessage>{STAGE_COPY[state.stage]}</StatusMessage>
        <p className="truncate text-xs text-cream-dim/60">{state.fileName}</p>
      </div>
    )
  }

  if (state.phase === 'error') {
    return (
      <div className="space-y-4">
        <InlineError error={state.error} />
        <UploadDropzone onFile={editor.selectFile} />
      </div>
    )
  }

  if (isEditing(state)) {
    return <EditorWorkspace state={state} editor={editor} />
  }

  return <UploadDropzone onFile={editor.selectFile} />
}
