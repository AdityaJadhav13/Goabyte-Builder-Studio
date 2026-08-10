'use client'

import { useId, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { ACCEPTED_FILE_TYPES } from '../accept'
import { MAX_FILE_BYTES } from '../validate-file'

/**
 * File selection: picker plus desktop drag-and-drop.
 *
 * Built on a real `<label>` wrapping a real `<input type="file">`, so keyboard
 * and screen-reader support come from the platform rather than from a div with
 * hand-rolled key handlers (NFR-015, FR-002).
 */

export function UploadDropzone({
  onFile,
  disabled,
  label = 'Choose a photo',
}: {
  readonly onFile: (file: File) => void
  readonly disabled?: boolean
  /** After a rejection, "Try another photo" is the honest instruction. */
  readonly label?: string
}) {
  const inputId = useId()
  const [isDragActive, setDragActive] = useState(false)
  const dragDepth = useRef(0)

  function handleDrop(event: React.DragEvent) {
    event.preventDefault()
    dragDepth.current = 0
    setDragActive(false)
    if (disabled) return

    // Multi-file drop: use the first image rather than erroring. FR-007's
    // sibling case — do the obvious thing instead of scolding the user.
    const file = Array.from(event.dataTransfer.files).find((f) =>
      f.type.startsWith('image/'),
    )
    if (file) onFile(file)
  }

  return (
    <label
      htmlFor={inputId}
      onDragEnter={(e) => {
        e.preventDefault()
        // Depth counting: dragging over a child fires dragleave on the parent,
        // which would otherwise flicker the active state off and on.
        dragDepth.current += 1
        if (!disabled) setDragActive(true)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        dragDepth.current -= 1
        if (dragDepth.current <= 0) setDragActive(false)
      }}
      onDrop={handleDrop}
      className={cn(
        'flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3',
        'border-[3px] border-dashed px-6 py-10 text-center transition-colors',
        'focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-yellow',
        isDragActive
          ? 'border-solid border-yellow bg-green-700'
          : 'border-cream-dim/40 bg-green-700/60 hover:border-yellow/70',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <span className="text-lg font-bold text-cream">
        {isDragActive ? 'Drop it' : label}
      </span>
      <span className="max-w-sm text-sm leading-relaxed text-balance text-cream-dim">
        Choose a real selfie. It is framed automatically — no cropping needed. Post it
        with <span className="font-bold text-yellow">#FrameInGoa</span>.
      </span>
      <span className="text-xs text-cream-dim/70">
        JPG, PNG, WebP or HEIC · up to {Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB
      </span>

      <input
        id={inputId}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          // A cancelled picker fires no change event at all, so there is
          // nothing to guard — but re-selecting the SAME file does need the
          // reset below, or the second change never fires (FR-007).
          if (file) onFile(file)
          event.target.value = ''
        }}
      />
    </label>
  )
}
