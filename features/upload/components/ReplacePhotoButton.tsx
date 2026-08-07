'use client'

import { useId } from 'react'
import { cn } from '@/lib/cn'
import { ACCEPTED_FILE_TYPES } from '../accept'

/**
 * Choose a different photo without leaving the editor.
 *
 * Styled as a secondary button but built on a real label + input, so keyboard
 * and screen-reader behaviour come from the platform rather than from a click
 * handler on a div.
 *
 * Without this the only route to a different photo is Start over, which throws
 * away the session — a needless step for the common case of "wrong photo".
 */
export function ReplacePhotoButton({
  onFile,
  disabled,
}: {
  readonly onFile: (file: File) => void
  readonly disabled?: boolean
}) {
  const inputId = useId()

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'inline-flex min-h-12 cursor-pointer items-center justify-center border-2 px-5 py-3',
        'border-cream-dim/50 text-base font-bold tracking-[0.02em] text-cream transition-colors',
        'hover:border-yellow hover:text-yellow',
        'focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-yellow',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      Replace photo
      <input
        id={inputId}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile(file)
          // Reset so selecting the SAME file again still fires a change event.
          event.target.value = ''
        }}
      />
    </label>
  )
}
