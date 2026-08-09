'use client'

import { useId } from 'react'
import {
  DESIGN,
  FORMAT_LABEL,
  OUTPUT_FORMATS,
  type OutputFormat,
} from '@/features/render/types'

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
                <i aria-hidden="true" />
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
