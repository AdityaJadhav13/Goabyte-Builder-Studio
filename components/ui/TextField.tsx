'use client'

import { useId } from 'react'
import { cn } from '@/lib/cn'

/**
 * Labelled text input with accessible error wiring.
 *
 * The error is joined to the input by `aria-describedby` and flagged by
 * `aria-invalid`, so it is announced rather than merely visible. Colour is
 * never the only signal: the message carries a glyph and the border thickens
 * (NFR-019).
 */
export function TextField({
  label,
  hint,
  error,
  value,
  onChange,
  maxLength,
  placeholder,
  disabled,
  action,
}: {
  readonly label: string
  readonly hint?: string
  readonly error?: string | undefined
  readonly value: string
  readonly onChange: (value: string) => void
  readonly maxLength?: number
  readonly placeholder?: string
  readonly disabled?: boolean
  readonly action?: React.ReactNode
}) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-bold text-cream">
          {label}
        </label>
        {action}
      </div>

      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(error && errorId, hint && hintId) || undefined}
        // 16px minimum: anything smaller makes iOS Safari zoom the viewport on
        // focus, which reads as a layout bug (NFR-011).
        className={cn(
          'w-full border-2 bg-cream px-3.5 py-3 text-base text-ink placeholder:text-ink/35',
          'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-yellow',
          'disabled:opacity-50',
          error ? 'border-pink-dim border-l-[6px]' : 'border-ink',
        )}
      />

      {error ? (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-sm text-pink">
          <span aria-hidden>⚠</span>
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-cream-dim/70">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
