'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { InlineError } from '@/components/ui/InlineError'
import { StatusMessage } from '@/components/ui/StatusMessage'
import { UploadDropzone } from '@/features/upload/components/UploadDropzone'
import { ReplacePhotoButton } from '@/features/upload/components/ReplacePhotoButton'
import { DESIGN } from '@/features/render/types'
import { useEditorController } from '../use-editor-controller'
import { isEditing, type PreparationStage } from '../editor-state'
import { PreviewCanvas } from './PreviewCanvas'

/**
 * Routes editor phase → UI. One responsibility: deciding what is on screen.
 * It holds no pipeline logic and no editor state of its own.
 *
 * There is no crop step (D-9). Upload lands the user directly on a finished,
 * automatically framed result — the task brief is explicit that users should
 * not be assumed to crop first, and a required crop editor is a wall between
 * a phone user and their download.
 */

const STAGE_COPY: Record<PreparationStage, string> = {
  validating: 'Checking your photo…',
  decoding: 'Reading your photo…',
  normalizing: 'Framing your photo…',
  'preparing-assets': 'Almost there…',
}

export function EditorShell() {
  const editor = useEditorController()
  const { state } = editor

  const editing = isEditing(state) ? state : null
  const format = editing?.format ?? null
  const image = editing?.image ?? null
  const crop = editing?.crop ?? null

  /**
   * Referential stability matters: PreviewCanvas re-renders on model identity,
   * so a fresh object literal every render would repaint the canvas on
   * unrelated state changes such as the export flag toggling.
   */
  const model = useMemo(
    () => (format && image && crop ? { format, image, crop } : null),
    [format, image, crop],
  )

  if (state.phase === 'idle') {
    return <UploadDropzone onFile={editor.selectFile} />
  }

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

  if (!editing || !model) return null

  const { width, height } = DESIGN[editing.format]

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="mb-3 text-xs font-bold tracking-[0.18em] text-yellow uppercase">
          Your graphic · {width}×{height}
        </h2>
        {/* The result is the whole screen. Nothing stands between arriving and
            downloading. */}
        <PreviewCanvas
          model={model}
          assets={editing.assets}
          className="w-full border-2 border-ink"
        />
      </div>

      {editing.quality === 'soft' ? (
        <p className="border-l-[3px] border-yellow bg-green-900 px-4 py-3 text-sm text-cream-dim">
          This photo is on the small side, so your graphic may look slightly soft. A
          larger photo will look sharper.
        </p>
      ) : null}

      {editing.exportError ? <InlineError error={editing.exportError} /> : null}

      <div className="flex flex-wrap gap-3">
        <Button onClick={editor.download} disabled={editing.isExporting}>
          {editing.isExporting ? 'Generating…' : 'Download PNG'}
        </Button>
        <ReplacePhotoButton onFile={editor.selectFile} disabled={editing.isExporting} />
        <Button
          variant="secondary"
          onClick={editor.startOver}
          disabled={editing.isExporting}
        >
          Start over
        </Button>
      </div>
    </div>
  )
}
