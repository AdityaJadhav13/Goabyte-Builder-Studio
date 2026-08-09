'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { FormatSelector } from '@/components/ui/FormatSelector'
import { InlineError } from '@/components/ui/InlineError'
import { saveBlob } from '@/features/export/download'
import {
  aspectOf,
  DESIGN,
  OUTPUT_FORMATS,
  PREVIEW_MAX_WIDTH_PX,
  type OutputFormat,
} from '@/features/render/types'
import { ReplacePhotoButton } from '@/features/upload/components/ReplacePhotoButton'
import {
  DEFAULT_FRAME_CONTROLS,
  effectiveResolution,
  frameFromControls,
  type FrameControls,
} from '@/lib/image/crop-geometry'
import { canExport, type EditingState } from '../editor-state'
import type { EditorController } from '../use-editor-controller'
import { usePreparedGraphic } from '../use-prepared-graphic'
import { CrewFieldsPanel } from './CrewFieldsPanel'
import { FrameSelector } from './FrameSelector'
import { PhotoPositionControls } from './PhotoPositionControls'
import { PreviewCanvas } from './PreviewCanvas'

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

const initialAdjustments = (): Record<OutputFormat, FrameControls> =>
  Object.fromEntries(
    OUTPUT_FORMATS.map((format) => [format, DEFAULT_FRAME_CONTROLS]),
  ) as Record<OutputFormat, FrameControls>

export function EditorWorkspace({
  state,
  editor,
  onReturnHome,
}: {
  readonly state: EditingState
  readonly editor: EditorController
  readonly onReturnHome?: () => void
}) {
  const { format, image, fields, crew, pfpFrame } = state
  const crop = state.crops[format]
  const [adjustments, setAdjustments] = useState(initialAdjustments)

  const model = useMemo(
    () => ({
      format,
      image,
      crop,
      fields: format === 'pfp' ? null : fields,
      pfpFrame,
      crew: format === 'crew' ? crew : null,
    }),
    [format, image, crop, fields, pfpFrame, crew],
  )

  const { width, height } = DESIGN[format]
  const isBuilder = format === 'builder-card'
  const isCrew = format === 'crew'
  const ready = canExport(state)
  const subject = isBuilder ? fields.name : isCrew ? crew.teamName : null
  const prepared = usePreparedGraphic(model, subject, ready)
  const quality = effectiveResolution(crop, image, DESIGN[format].width)

  const setPhotoAdjustment = (next: FrameControls) => {
    setAdjustments((current) => ({ ...current, [format]: next }))
    editor.setCrop(
      format,
      frameFromControls(image.width, image.height, aspectOf(format), next),
    )
  }

  const description = isBuilder
    ? `Builder ID card for ${fields.name.trim() || 'this builder'}${fields.role.trim() ? `, ${fields.role.trim()}` : ''}${fields.team.trim() ? `, team ${fields.team.trim()}` : ''}`
    : isCrew
      ? `Crew frame for ${crew.teamName.trim() || fields.team.trim() || 'this team'} with ${crew.members.length + 1} member${crew.members.length === 0 ? '' : 's'}`
      : `${pfpFrame} Hacker House Goa 2026 profile picture frame around your photo`

  return (
    <section className="editor-studio" aria-label="Creative control room">
      <div className="editor-format-deck">
        <div className="editor-format-intro">
          <p className="editor-section-kicker">Creative control room</p>
          <h1>Make it unmistakably yours.</h1>
          <p>Pick a format, tune the frame and post a Goa-ready graphic.</p>
        </div>
        <FormatSelector
          value={format}
          onChange={editor.setFormat}
          disabled={state.isExporting}
        />
      </div>

      <div className="editor-workspace-grid">
        <aside className="editor-control-rail" data-format={format}>
          <div className="editor-rail-heading">
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                <path d="M4 8V4h4m8 0h4v4m0 8v4h-4M8 20H4v-4M9 12h6m-3-3v6" />
              </svg>
            </span>
            <div>
              <p className="editor-section-kicker">Tune the composition</p>
              <h2>Photo controls</h2>
            </div>
          </div>

          {format === 'pfp' ? (
            <FrameSelector
              value={pfpFrame}
              onChange={editor.setPfpFrame}
              disabled={state.isExporting}
            />
          ) : null}

          <PhotoPositionControls
            value={adjustments[format]}
            onChange={setPhotoAdjustment}
            disabled={state.isExporting}
          />

          {isBuilder || isCrew ? (
            <section className="editor-details-card">
              <div className="editor-details-heading">
                <div>
                  <p className="editor-section-kicker">
                    {isCrew ? 'Crew leader' : 'Identity layer'}
                  </p>
                  <h3>{isCrew ? 'Leader details' : 'Builder details'}</h3>
                </div>
                <span>{isCrew ? 'Member 01' : 'Included in ID'}</span>
              </div>
              <BuilderFieldsForm
                fields={fields}
                onChange={editor.setFields}
                disabled={state.isExporting}
              />
            </section>
          ) : (
            <div className="editor-format-tip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                <path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" />
              </svg>
              <p>
                Pick from three original PFP looks. Switch to Builder ID for a proper
                credential, or Crew Frame for a 1–4 member team poster.
              </p>
            </div>
          )}

          {isCrew ? (
            <CrewFieldsPanel
              fields={fields}
              crew={crew}
              editor={editor}
              disabled={state.isExporting}
            />
          ) : null}

          {state.exportError ? <InlineError error={state.exportError} /> : null}

          <div className="editor-action-card">
            <p className="editor-section-kicker">Ready when you are</p>
            {!ready ? (
              <p className="editor-required-message">
                {isCrew
                  ? 'Add the leader name, role and crew name to prepare this Crew Frame.'
                  : 'Add your name, stack and team to prepare your Builder ID.'}
              </p>
            ) : null}
            <div className="editor-action-row">
              <Button
                className="editor-download-button"
                onClick={() => {
                  if (prepared.graphic) {
                    saveBlob(prepared.graphic.file, prepared.graphic.file.name)
                  }
                }}
                disabled={!prepared.graphic || prepared.status !== 'ready'}
              >
                <span>
                  {prepared.status === 'preparing'
                    ? 'Preparing PNG…'
                    : prepared.graphic
                      ? 'Download PNG'
                      : 'Complete the details'}
                </span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                  <path d="M12 3v12m0 0 5-5m-5 5-5-5M5 21h14" />
                </svg>
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

          <SharePanel
            graphic={prepared.graphic}
            format={format}
            preparation={prepared.status}
            error={prepared.error}
            name={fields.name}
            team={isCrew ? crew.teamName : fields.team}
          />
        </aside>

        <section className="editor-preview-stage">
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
    </section>
  )
}
