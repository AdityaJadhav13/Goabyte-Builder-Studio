'use client'

import { PFP_FRAMES } from '@/features/render/frame-catalog'
import type { PfpFrameId } from '@/features/render/types'

export function FrameSelector({
  value,
  onChange,
  disabled,
}: {
  readonly value: PfpFrameId
  readonly onChange: (frame: PfpFrameId) => void
  readonly disabled?: boolean
}) {
  return (
    <fieldset className="frame-selector" disabled={disabled}>
      <div className="frame-selector-heading">
        <div>
          <p className="editor-section-kicker">Frame wardrobe</p>
          <legend>Pick your PFP frame</legend>
        </div>
        <span>{PFP_FRAMES.length} original looks</span>
      </div>
      <div className="frame-selector-grid" role="radiogroup">
        {PFP_FRAMES.map((frame) => {
          const selected = frame.id === value
          return (
            <label key={frame.id} data-selected={selected ? 'true' : 'false'}>
              <input
                className="sr-only"
                type="radio"
                name="pfp-frame"
                value={frame.id}
                checked={selected}
                onChange={() => onChange(frame.id)}
              />
              <span className="frame-selector-thumb">
                {/* Static, same-origin renderer art; no optimizer or remote request. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={frame.platePath} alt="" aria-hidden="true" />
                <i aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                </i>
              </span>
              <strong>{frame.label}</strong>
              <small>{frame.description}</small>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
