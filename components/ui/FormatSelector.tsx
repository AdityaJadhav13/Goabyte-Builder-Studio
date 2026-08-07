'use client'

import { useId } from 'react'
import { cn } from '@/lib/cn'
import { FORMAT_LABEL, OUTPUT_FORMATS, type OutputFormat } from '@/features/render/types'

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
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-2 text-xs font-bold tracking-[0.18em] text-yellow uppercase">
        Format
      </legend>
      <div
        role="radiogroup"
        className="inline-flex border-2 border-ink bg-cream p-1 disabled:opacity-40"
      >
        {OUTPUT_FORMATS.map((format) => {
          const checked = value === format
          return (
            <label
              key={format}
              className={cn(
                'cursor-pointer px-4 py-2.5 text-sm font-bold transition-colors',
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
                className="sr-only"
              />
              {FORMAT_LABEL[format]}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
