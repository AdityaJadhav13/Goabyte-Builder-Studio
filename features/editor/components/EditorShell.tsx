'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { InlineError } from '@/components/ui/InlineError'
import { StatusMessage } from '@/components/ui/StatusMessage'
import { UploadDropzone } from '@/features/upload/components/UploadDropzone'
import { ReplacePhotoButton } from '@/features/upload/components/ReplacePhotoButton'
import { aspectOf, DESIGN } from '@/features/render/types'
import { useEditorController } from '../use-editor-controller'
import { isEditing, type PreparationStage } from '../editor-state'
import { PreviewCanvas } from './PreviewCanvas'

/**
 * Routes editor phase → UI. One responsibility: deciding what is on screen.
 * It holds no pipeline logic and no editor state of its own.
 *
 * The cropper is loaded on demand — react-easy-crop is dead weight on the
 * landing view, which is the only view most visitors ever see (NFR-002).
 */
const CropEditor = dynamic(
  () => import('@/features/crop/components/CropEditor').then((m) => m.CropEditor),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-square w-full animate-pulse border-2 border-ink bg-green-700" />
    ),
  },
)

const STAGE_COPY: Record<PreparationStage, string> = {
  validating: 'Checking your photo…',
  decoding: 'Reading your photo…',
  normalizing: 'Preparing your photo…',
  'preparing-assets': 'Almost there…',
}

export function EditorShell() {
  const editor = useEditorController()
  const { state } = editor

  /**
   * react-easy-crop reads `initialCroppedAreaPercentages` only on mount, so
   * changing state alone would leave its pan/zoom untouched and "Reset crop"
   * would move the preview while the cropper stayed put. Bumping this nonce
   * remounts it. Kept as local view state rather than in the reducer — it is a
   * presentational concern, not editor state.
   */
  const [cropNonce, setCropNonce] = useState(0)

  const editing = isEditing(state) ? state : null
  const format = editing?.format ?? null
  const image = editing?.image ?? null
  const crop = editing?.crop ?? null

  /**
   * Referential stability matters here: PreviewCanvas re-renders on model
   * identity, so a fresh object literal every render would re-render the
   * canvas on unrelated state changes such as the export flag toggling.
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
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-xs font-bold tracking-[0.18em] text-yellow uppercase">
            Adjust
          </h2>
          <CropEditor
            // Remount on a new photo as well as on reset: react-easy-crop
            // otherwise carries the previous pan and zoom onto the new image.
            key={`${editing.image.previewUrl}:${cropNonce}`}
            image={editing.image}
            aspect={aspectOf(editing.format)}
            crop={editing.crop}
            onCropChange={editor.changeCrop}
          />
          <p className="mt-2 text-xs text-cream-dim/70">
            Drag to reposition. Pinch or scroll to zoom.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xs font-bold tracking-[0.18em] text-yellow uppercase">
            Preview · {width}×{height}
          </h2>
          <PreviewCanvas
            model={model}
            assets={editing.assets}
            className="w-full border-2 border-ink"
          />
        </section>
      </div>

      {editing.quality === 'soft' ? (
        <p className="border-l-[3px] border-yellow bg-green-900 px-4 py-3 text-sm text-cream-dim">
          This crop is quite tight — the result may look soft. Zoom out for a sharper
          image.
        </p>
      ) : null}

      {editing.exportError ? <InlineError error={editing.exportError} /> : null}

      <div className="flex flex-wrap gap-3">
        <Button onClick={editor.download} disabled={editing.isExporting}>
          {editing.isExporting ? 'Generating…' : 'Download PNG'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            editor.resetCrop()
            setCropNonce((n) => n + 1)
          }}
          disabled={editing.isExporting}
        >
          Reset crop
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
