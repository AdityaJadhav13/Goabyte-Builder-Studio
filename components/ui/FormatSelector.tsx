'use client'

import { useId } from 'react'
import { cn } from '@/lib/cn'
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
    <fieldset disabled={disabled} className="relative min-w-0 disabled:opacity-40">
      <legend className="mb-3 text-xs font-bold tracking-[0.18em] text-yellow uppercase">
        Choose your format
      </legend>
      <p className="absolute top-0 right-0 text-[10px] font-bold tracking-[0.12em] text-cream-dim/55 uppercase">
        Switch anytime
      </p>
      <div
        role="radiogroup"
        className="grid w-full grid-cols-2 border-2 border-ink bg-cream p-1 shadow-ink-sm sm:max-w-[430px]"
      >
        {OUTPUT_FORMATS.map((format) => {
          const checked = value === format
          const { width, height } = DESIGN[format]
          return (
            <label
              key={format}
              className={cn(
                'flex min-w-0 cursor-pointer flex-col gap-0.5 px-3 py-2.5 text-sm font-bold transition-colors sm:px-4',
                'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-yellow',
                checked ? 'bg-yellow text-ink' : 'text-ink/60 hover:text-ink',
              )}
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
              <span>{FORMAT_LABEL[format]}</span>
              <span
                className={cn(
                  'font-mono text-[10px] font-medium tracking-wide',
                  checked ? 'text-ink/65' : 'text-ink/45',
                )}
              >
                {width}×{height} PNG
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
