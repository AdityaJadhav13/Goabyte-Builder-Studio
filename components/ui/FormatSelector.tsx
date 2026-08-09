'use client'

import { useId } from 'react'
import {
  DESIGN,
  FORMAT_LABEL,
  OUTPUT_FORMATS,
  type OutputFormat,
} from '@/features/render/types'

function FormatIcon({ format }: { readonly format: OutputFormat }) {
  if (format === 'builder-card') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path d="M7 4h10l2 3v14H5V7l2-3Zm2 0h6v3H9V4Z" />
        <path d="M8 12h4m-4 4h8" />
      </svg>
    )
  }
  if (format === 'crew') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="10" r="2.5" />
        <path d="M3 20c0-4 2.4-6 6-6s6 2 6 6m0-5c3.7 0 6 1.7 6 5" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <circle cx="12" cy="9" r="4" />
      <path d="M5 21c0-4.5 2.8-7 7-7s7 2.5 7 7M4 4h4m8 0h4" />
    </svg>
  )
}

/**
 * Segmented control for the output format.
 *
 * Built on native radio inputs rather than Radix ToggleGroup. ADR-6 reserves
 * Radix for cases where correct keyboard and ARIA semantics are hard to get
 * right — a radiogroup is not one of them. The platform already gives arrow-key
 * navigation, roving focus, and correct announcement for free, and this saves a
 * dependency on a bundle with a 120 kB budget.
 */
export function FormatSelector({
  value,
  onChange,
  disabled,
}: {
  readonly value: OutputFormat
  readonly onChange: (format: OutputFormat) => void
  readonly disabled?: boolean
}) {
  const groupName = useId()

  return (
    <fieldset disabled={disabled} className="format-selector">
      <legend>Choose your format</legend>
      <p className="format-selector-helper">Switch anytime</p>
      <div role="radiogroup" className="format-selector-track">
        {OUTPUT_FORMATS.map((format) => {
          const checked = value === format
          const { width, height } = DESIGN[format]
          return (
            <label
              key={format}
              className="format-selector-option"
              data-format={format}
              data-selected={checked ? 'true' : 'false'}
            >
              <input
                type="radio"
                name={groupName}
                value={format}
                checked={checked}
                onChange={() => onChange(format)}
                aria-label={FORMAT_LABEL[format]}
                className="sr-only"
              />
              <span className="format-selector-label">
                <FormatIcon format={format} />
                {FORMAT_LABEL[format]}
              </span>
              <span className="format-selector-size">
                {width}×{height} PNG
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
