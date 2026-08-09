'use client'

import type { FrameControls } from '@/lib/image/crop-geometry'
import {
  DEFAULT_FRAME_CONTROLS,
  MAX_FRAME_POSITION,
  MAX_FRAME_ZOOM,
  MIN_FRAME_POSITION,
  MIN_FRAME_ZOOM,
  minimumZoomForPosition,
} from '@/lib/image/crop-geometry'

interface SliderProps {
  readonly id: string
  readonly label: string
  readonly value: number
  readonly min: number
  readonly max: number
  readonly step: number
  readonly output: string
  readonly disabled?: boolean
  readonly onChange: (value: number) => void
}

function AdjustmentSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  output,
  disabled,
  onChange,
}: SliderProps) {
  const progress = ((value - min) / (max - min)) * 100

  return (
    <div className="photo-adjustment-row">
      <div className="photo-adjustment-label">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{output}</output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        style={{ '--range-progress': `${progress}%` } as React.CSSProperties}
        className="photo-adjustment-range"
      />
    </div>
  )
}

export function PhotoPositionControls({
  value,
  onChange,
  disabled,
}: {
  readonly value: FrameControls
  readonly onChange: (value: FrameControls) => void
  readonly disabled?: boolean
}) {
  const update = (part: Partial<FrameControls>) => onChange({ ...value, ...part })
  const updatePosition = (
    part: Pick<Partial<FrameControls>, 'positionX' | 'positionY'>,
  ) => {
    const next = { ...value, ...part }
    onChange({
      ...next,
      zoom: Math.max(next.zoom, minimumZoomForPosition(next.positionX, next.positionY)),
    })
  }
  const minimumPositionedZoom = minimumZoomForPosition(value.positionX, value.positionY)
  const isAutomatic =
    value.zoom === DEFAULT_FRAME_CONTROLS.zoom &&
    value.positionX === DEFAULT_FRAME_CONTROLS.positionX &&
    value.positionY === DEFAULT_FRAME_CONTROLS.positionY

  return (
    <section className="photo-adjustment-card" aria-labelledby="photo-adjustment-title">
      <div className="photo-adjustment-heading">
        <div>
          <p className="editor-section-kicker">Frame lab</p>
          <h3 id="photo-adjustment-title">Set your photo</h3>
        </div>
        <span className="photo-adjustment-live">
          <span aria-hidden="true" /> Live preview
        </span>
      </div>

      <p className="photo-adjustment-copy">
        Zoom in, then move the frame until your face and composition sit exactly right.
        Each format remembers its own position.
      </p>

      <div className="photo-adjustment-sliders">
        <AdjustmentSlider
          id="photo-zoom"
          label="Zoom"
          value={value.zoom}
          min={MIN_FRAME_ZOOM}
          max={MAX_FRAME_ZOOM}
          step={0.05}
          output={`${value.zoom.toFixed(2)}×`}
          disabled={disabled}
          onChange={(zoom) => update({ zoom: Math.max(zoom, minimumPositionedZoom) })}
        />
        <AdjustmentSlider
          id="photo-position-x"
          label="Left / right"
          value={value.positionX}
          min={MIN_FRAME_POSITION}
          max={MAX_FRAME_POSITION}
          step={1}
          output={
            value.positionX === 0
              ? 'Auto'
              : `${value.positionX > 0 ? '+' : ''}${value.positionX}`
          }
          disabled={disabled}
          onChange={(positionX) => updatePosition({ positionX })}
        />
        <AdjustmentSlider
          id="photo-position-y"
          label="Up / down"
          value={value.positionY}
          min={MIN_FRAME_POSITION}
          max={MAX_FRAME_POSITION}
          step={1}
          output={
            value.positionY === 0
              ? 'Auto'
              : `${value.positionY > 0 ? '+' : ''}${value.positionY}`
          }
          disabled={disabled}
          onChange={(positionY) => updatePosition({ positionY })}
        />
      </div>

      <div className="photo-adjustment-footer">
        <span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
            <path d="M9 12h6M12 9v6" />
          </svg>
          Edge-safe crop
        </span>
        <button
          type="button"
          disabled={disabled || isAutomatic}
          onClick={() => onChange(DEFAULT_FRAME_CONTROLS)}
        >
          Reset auto frame
        </button>
      </div>
    </section>
  )
}
