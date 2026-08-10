'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import type { CardSide, RenderAssets, RenderModel } from '@/features/render/types'
import { PreviewCanvas } from './PreviewCanvas'

export function BuilderCardFlipPreview({
  model,
  assets,
  side,
  onSideChange,
}: {
  readonly model: RenderModel
  readonly assets: RenderAssets
  readonly side: CardSide
  readonly onSideChange: (side: CardSide) => void
}) {
  const frontModel = useMemo<RenderModel>(
    () => ({ ...model, cardSide: 'front' }),
    [model],
  )
  const backModel = useMemo<RenderModel>(() => ({ ...model, cardSide: 'back' }), [model])
  const isBack = side === 'back'
  const name = model.fields?.name.trim() || 'this builder'
  const role = model.fields?.role.trim() || 'builder'
  const team = model.fields?.team.trim() || 'their team'
  const title = model.fields?.title?.trim() || 'Builder'

  return (
    <div className="builder-card-flip-shell" data-card-side={side}>
      <div className="builder-card-perspective">
        <div
          className="builder-card-flipper"
          data-card-side={side}
          data-flipped={isBack ? 'true' : 'false'}
        >
          <div
            className="builder-card-face builder-card-face--front"
            data-card-face="front"
            aria-hidden={isBack}
          >
            <PreviewCanvas
              model={frontModel}
              assets={assets}
              description={`Builder ID front preview for ${name}, ${role}, team ${team}`}
              className="editor-preview-canvas"
            />
          </div>

          <div
            className="builder-card-face builder-card-face--back"
            data-card-face="back"
            aria-hidden={!isBack}
          >
            <PreviewCanvas
              model={backModel}
              assets={assets}
              description={`Builder ID back preview for ${name}, ${title}, with an original crew-builder mascot and Hacker House Goa 2026 branding`}
              className="editor-preview-canvas"
            />
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {isBack ? 'Builder ID back side shown.' : 'Builder ID front side shown.'}
      </p>

      <Button
        className="builder-card-flip-button"
        variant="secondary"
        aria-pressed={isBack}
        onClick={() => onSideChange(isBack ? 'front' : 'back')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path d="M4 7h11a5 5 0 0 1 5 5v1" />
          <path d="m17 10 3 3 3-3M20 17H9a5 5 0 0 1-5-5v-1" />
          <path d="m7 14-3-3-3 3" />
        </svg>
        {isBack ? 'Flip to Front' : 'Flip to Back'}
      </Button>
    </div>
  )
}
