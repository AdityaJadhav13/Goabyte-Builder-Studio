'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { FormatSelector } from '@/components/ui/FormatSelector'
import { InlineError } from '@/components/ui/InlineError'
import { ReplacePhotoButton } from '@/features/upload/components/ReplacePhotoButton'
import { DESIGN } from '@/features/render/types'
import { canExport, type EditingState } from '../editor-state'
import type { EditorController } from '../use-editor-controller'
import { PreviewCanvas } from './PreviewCanvas'

/**
 * Everything the user sees AFTER a photo is loaded.
 *
 * Split from EditorShell so the landing view — the only view most visitors
 * ever see, and the one LCP measures — does not carry the render layer: both
 * templates, the text-fitting engine and the drawing primitives all arrive
 * with this chunk instead (NFR-002).
 *
 * Two further modules load on demand from here:
 *   - the builder-card form (React Hook Form + Zod, ~20 kB) only matters to
 *     users who choose the card
 *   - the share panel only matters after a successful export
 */
const BuilderFieldsForm = dynamic(
  () => import('./BuilderFieldsForm').then((m) => m.BuilderFieldsForm),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse border-2 border-cream-dim/20" />,
  },
)

const SharePanel = dynamic(
  () => import('@/features/share/components/SharePanel').then((m) => m.SharePanel),
  { ssr: false },
)

export function EditorWorkspace({
  state,
  editor,
}: {
  readonly state: EditingState
  readonly editor: EditorController
}) {
  const { format, image, fields } = state
  const crop = state.crops[format]

  /**
   * Referential stability matters: PreviewCanvas repaints on model identity,
   * so a fresh object literal every render would repaint the canvas on
   * unrelated state changes such as the export flag toggling.
   */
  const model = useMemo(
    () => ({
      format,
      image,
      crop,
      fields: format === 'builder-card' ? fields : null,
    }),
    [format, image, crop, fields],
  )

  const { width, height } = DESIGN[format]
  const isCard = format === 'builder-card'
  const ready = canExport(state)

  return (
    <div className="space-y-8">
      <FormatSelector
        value={format}
        onChange={editor.setFormat}
        disabled={state.isExporting}
      />

      {/* Source order is deliberate. On MOBILE the preview comes first: the
          result is the product, and burying it under a form, three buttons and
          a share panel means a phone user scrolls past everything to see what
          they made. On desktop there is room for both, so the controls move
          left and the preview right. */}
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
        <div className="order-2 space-y-6 lg:order-1">
          {isCard ? (
            <BuilderFieldsForm
              fields={fields}
              onChange={editor.setFields}
              disabled={state.isExporting}
            />
          ) : (
            <p className="border-l-2 border-green-600 py-1 pl-4 text-sm leading-relaxed text-cream-dim">
              Framed automatically — no cropping needed. Switch to Builder ID to add your
              name and what you build.
            </p>
          )}

          {state.exportError ? <InlineError error={state.exportError} /> : null}

          <div className="flex flex-wrap gap-3">
            <Button onClick={editor.download} disabled={state.isExporting || !ready}>
              {state.isExporting ? 'Generating…' : 'Download PNG'}
            </Button>
            <ReplacePhotoButton onFile={editor.selectFile} disabled={state.isExporting} />
            <Button
              variant="secondary"
              onClick={editor.startOver}
              disabled={state.isExporting}
            >
              Start over
            </Button>
          </div>

          {!ready ? (
            <p className="text-sm text-cream-dim/70">
              Add your name to generate your Builder ID.
            </p>
          ) : null}

          {state.exported ? <SharePanel exported={state.exported} /> : null}
        </div>

        <div className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-6">
          <h2 className="text-xs font-bold tracking-[0.18em] text-yellow uppercase">
            Your graphic · {width}×{height}
          </h2>
          <PreviewCanvas
            model={model}
            assets={state.assets}
            className="w-full border-2 border-ink shadow-ink"
          />

          {state.quality === 'soft' ? (
            <p className="border-l-[3px] border-yellow bg-green-900 px-4 py-3 text-sm text-cream-dim">
              This photo is on the small side, so your graphic may look slightly soft. A
              larger photo will look sharper.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
