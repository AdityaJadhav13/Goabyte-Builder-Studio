'use client'

import { useState, useCallback } from 'react'
import { Hero } from '@/components/layout/Hero'
import { LandingForm } from '@/components/layout/LandingForm'
import { EditorShell } from '@/features/editor/components/EditorShell'

/**
 * Landing page — split-screen hero with branding + form card.
 *
 * Replicates the Hacker House ID Card Generator page: left column has the
 * HACKER HOUSE गोवा logo and event info, right column has the builder form.
 * Once the user fills in the form and clicks Continue, the page transitions
 * to the editor workspace.
 *
 * The hero-wide.webp illustration is used as a full-bleed backdrop via
 * AppBackground (rendered in layout.tsx).
 */
export default function Home() {
  const [editorMode, setEditorMode] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState<{
    file: File
    name: string
    role: string
  } | null>(null)

  const handleFormSubmit = useCallback(
    (data: { file: File; name: string; role: string }) => {
      setPendingSubmit(data)
      setEditorMode(true)
    },
    [],
  )

  /* Once in editor mode, show the full editor workspace. */
  if (editorMode) {
    return (
      <div className="min-h-dvh">
        <header className="border-b-2 border-ink bg-green-900">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center border-2 border-yellow bg-green-800 font-display text-lg text-yellow shadow-ink-sm">
                G
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-[0.18em] text-yellow uppercase">
                  GoaByte
                </p>
                <p className="truncate text-xs font-semibold text-cream">
                  Builder Studio
                </p>
              </div>
            </div>

            <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.1em] text-cream-dim/75 uppercase sm:text-[11px]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span className="hidden sm:inline">Private, on-device</span>
              <span className="sm:hidden">Private</span>
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-12">
          <EditorShell
            initialFile={pendingSubmit?.file}
            initialFields={
              pendingSubmit
                ? { name: pendingSubmit.name, role: pendingSubmit.role }
                : undefined
            }
          />
        </main>

        <footer className="mt-8 border-t-2 border-ink bg-green-900">
          <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
            <p className="max-w-3xl text-xs leading-relaxed text-cream-dim/75">
              An independent project by team GoaByte, built for the Hacker House Goa 2026
              open trial. Hacker House Goa artwork is used with permission. Your photo is
              processed entirely in your browser and is never uploaded.
            </p>
          </div>
        </footer>
      </div>
    )
  }

  /* Landing page: split-screen hero. */
  return (
    <div className="landing-wrapper">
      <main className="landing-main">
        <div className="landing-grid">
          {/* Left: branding */}
          <Hero compact={false} />

          {/* Right: form card */}
          <LandingForm onSubmit={handleFormSubmit} />
        </div>
      </main>

      <footer className="landing-footer">
        {/* Was href="#about", which pointed at nothing. A judge who clicks a
            dead link has found a bug before they have used the product. */}
        <a
          href="https://github.com/AdityaJadhav13/Goabyte-Builder-Studio"
          target="_blank"
          rel="noopener noreferrer"
          className="landing-footer-link"
        >
          About this project
        </a>
      </footer>
    </div>
  )
}
