'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { Panel } from '@/components/layout/Panel'
import { Button } from '@/components/ui/Button'
import { FormatSelector } from '@/components/ui/FormatSelector'
import { InlineError } from '@/components/ui/InlineError'
import { ReplacePhotoButton } from '@/features/upload/components/ReplacePhotoButton'
import { aspectOf, DESIGN, PREVIEW_MAX_WIDTH_PX } from '@/features/render/types'
import type { OutputFormat } from '@/features/render/types'
import {
  DEFAULT_FRAME_CONTROLS,
  effectiveResolution,
  frameFromControls,
  type FrameControls,
} from '@/lib/image/crop-geometry'
import { canExport, type EditingState } from '../editor-state'
import type { EditorController } from '../use-editor-controller'
import { PhotoPositionControls } from './PhotoPositionControls'
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
  onReturnHome,
}: {
  readonly state: EditingState
  readonly editor: EditorController
  readonly onReturnHome?: () => void
}) {
  const { format, image, fields } = state
  const crop = state.crops[format]
  const [adjustments, setAdjustments] = useState<Record<OutputFormat, FrameControls>>({
    pfp: DEFAULT_FRAME_CONTROLS,
    'builder-card': DEFAULT_FRAME_CONTROLS,
  })

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
  const quality = effectiveResolution(crop, image, DESIGN[format].width)

  const setPhotoAdjustment = (next: FrameControls) => {
    setAdjustments((current) => ({ ...current, [format]: next }))
    editor.setCrop(
      format,
      frameFromControls(image.width, image.height, aspectOf(format), next),
    )
  }

  // A screen-reader user cannot see the canvas, so the label has to carry what
  // is actually on it — not just its dimensions (FR-041).
  const description =
    isCard && fields.name.trim()
      ? `Builder ID card for ${fields.name.trim()}${fields.role.trim() ? `, ${fields.role.trim()}` : ''}`
      : 'Hacker House Goa 2026 profile picture frame around your photo'

  return (
    /* Wrapped in a panel: every label, warning and helper line here would
       otherwise sit on the illustration, where measured contrast bottoms out
       at 1.84:1. */
    <Panel className="editor-studio">
      <div className="editor-studio-orb editor-studio-orb--one" aria-hidden="true" />
      <div className="editor-studio-orb editor-studio-orb--two" aria-hidden="true" />

      <div className="editor-format-deck">
        <div className="editor-format-intro">
          <p className="editor-section-kicker">Creative control room</p>
          <h1>Make it unmistakably yours.</h1>
          <p>Frame it, personalise it and export a post-ready GoaByte graphic.</p>
        </div>
        <FormatSelector
          value={format}
          onChange={editor.setFormat}
          disabled={state.isExporting}
        />
      </div>

      {/* Source order is deliberate. On MOBILE the preview comes first: the
          result is the product, and burying it under a form, three buttons and
          a share panel means a phone user scrolls past everything to see what
          they made. On desktop there is room for both, so the controls move
          left and the preview right. */}
      <div className="editor-workspace-grid">
        <aside className="editor-control-rail" data-format={format}>
          <div className="editor-rail-heading">
            <span>01</span>
            <div>
              <p className="editor-section-kicker">Tune the composition</p>
              <h2>Photo controls</h2>
            </div>
          </div>

          <PhotoPositionControls
            value={adjustments[format]}
            onChange={setPhotoAdjustment}
            disabled={state.isExporting}
          />

          {isCard ? (
            <section className="editor-details-card">
              <div className="editor-details-heading">
                <div>
                  <p className="editor-section-kicker">Identity layer</p>
                  <h3>Builder details</h3>
                </div>
                <span>Included in ID</span>
              </div>
              <BuilderFieldsForm
                fields={fields}
                onChange={editor.setFields}
                disabled={state.isExporting}
              />
            </section>
          ) : (
            <div className="editor-format-tip">
              <span aria-hidden="true">✦</span>
              <p>
                Profile mode keeps the energy focused on your photo. Switch to Builder ID
                to add your name, role and scannable studio QR.
              </p>
            </div>
          )}

          {state.exportError ? <InlineError error={state.exportError} /> : null}

          <div className="editor-action-card">
            <p className="editor-section-kicker">Ready when you are</p>
            {/*
              Sits ABOVE the button it explains, inside the same card. As a
              trailing sibling it was clipped by the rail's height constraint on
              desktop, leaving Download disabled with the reason cut off
              mid-sentence — an unexplained disabled action.
            */}
            {!ready ? (
              <p className="editor-required-message text-sm text-cream-dim/70">
                Add your name and what you build to generate your Builder ID.
              </p>
            ) : null}
            <div className="editor-action-row">
              <Button
                className="editor-download-button"
                onClick={editor.download}
                disabled={state.isExporting || !ready}
              >
                {state.isExporting ? 'Generating…' : 'Download PNG'}
                <span aria-hidden="true">↓</span>
              </Button>
              <ReplacePhotoButton
                onFile={editor.selectFile}
                disabled={state.isExporting}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  editor.startOver()
                  onReturnHome?.()
                }}
                disabled={state.isExporting}
              >
                Start over
              </Button>
            </div>
          </div>

          {state.exported ? <SharePanel exported={state.exported} /> : null}
        </aside>

        <section className="editor-preview-stage">
          {/* The primary label on the screen: the result outranks the
              controls, so it gets cream and size rather than the same yellow
              micro-caps everything else uses. */}
          <div className="editor-preview-heading">
            <div>
              <p className="editor-section-kicker">Live canvas</p>
              <h2>Your graphic</h2>
            </div>
            <div className="editor-preview-badges">
              <span>
                {width}×{height}
              </span>
              <span>PNG</span>
            </div>
          </div>

          <div className="editor-preview-viewport">
            <span className="editor-preview-coordinate editor-preview-coordinate--top">
              GOA / 26
            </span>
            <span className="editor-preview-coordinate editor-preview-coordinate--side">
              LIVE OUTPUT
            </span>
            <div
              style={{ maxWidth: PREVIEW_MAX_WIDTH_PX[format] }}
              className="editor-preview-canvas-wrap"
              data-format={format}
            >
              <PreviewCanvas
                model={model}
                assets={state.assets}
                description={description}
                className="editor-preview-canvas"
              />
            </div>
          </div>

          <div className="editor-preview-meta">
            <span>
              <i aria-hidden="true" /> Preview matches download
            </span>
            <span>Processed on this device</span>
          </div>

          {state.quality === 'soft' || quality === 'soft' ? (
            <p className="editor-quality-warning">
              This photo is on the small side, so your graphic may look slightly soft. A
              larger photo or less zoom will look sharper.
            </p>
          ) : null}
        </section>
      </div>
    </Panel>
  )
}
