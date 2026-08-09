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
            <p className="text-[11px] font-bold tracking-[0.18em] text-yellow uppercase">
              GoaByte
            </p>
            <p className="text-[11px] font-bold tracking-[0.18em] text-cream-dim uppercase">
              Hacker House Goa 2026
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
          <EditorShell
            initialFile={pendingSubmit?.file}
            initialFields={
              pendingSubmit
                ? { name: pendingSubmit.name, role: pendingSubmit.role }
                : undefined
            }
          />
        </main>

        <footer className="mt-10 border-t-2 border-ink bg-green-900">
          <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
            <p className="max-w-2xl text-xs leading-relaxed text-cream-dim/80">
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
      {/* Decorative lightbulb toggle */}
      <div className="lightbulb-toggle" aria-hidden>
        <div className="lightbulb-wire" />
        <span className="lightbulb-icon">💡</span>
      </div>

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
