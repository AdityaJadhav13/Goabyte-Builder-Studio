'use client'

import { useState, useCallback } from 'react'
import { Hero } from '@/components/layout/Hero'
import { LandingForm } from '@/components/layout/LandingForm'
import { AboutUs } from '@/components/layout/AboutUs'
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

  const handleReturnHome = useCallback(() => {
    setPendingSubmit(null)
    setEditorMode(false)
  }, [])

  /* Once in editor mode, show the full editor workspace. */
  if (editorMode) {
    return (
      <div className="editor-app-shell">
        <header className="editor-app-header">
          <div className="editor-app-header-inner">
            <div className="editor-app-brand">
              <span className="editor-app-brand-mark">G</span>
              <div className="min-w-0">
                <p className="editor-app-brand-name">GoaByte</p>
                <p className="editor-app-brand-product">Builder Studio</p>
              </div>
            </div>

            <p className="editor-app-privacy">
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

        <main className="editor-app-main">
          <EditorShell
            initialFile={pendingSubmit?.file}
            onReturnHome={handleReturnHome}
            initialFields={
              pendingSubmit
                ? { name: pendingSubmit.name, role: pendingSubmit.role }
                : undefined
            }
          />
        </main>

        <footer className="editor-app-footer">
          <div className="editor-app-footer-inner">
            <p>
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
        <a href="#about-us" className="landing-footer-link">
          About us
          <span aria-hidden="true">↓</span>
        </a>
      </footer>

      <AboutUs />
    </div>
  )
}
