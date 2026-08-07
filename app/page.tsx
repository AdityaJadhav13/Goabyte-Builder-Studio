import { EditorShell } from '@/features/editor/components/EditorShell'

/**
 * Minimal functional host for Slice 1.
 *
 * The production landing page is Slice 2, driven by Lavitra's approved design
 * system. This is deliberately plain: enough structure to exercise the
 * pipeline, no branding decisions made ahead of design.
 */
export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="mb-10">
        <p className="font-mono text-xs tracking-[0.18em] text-yellow uppercase">
          GoaByte · Hacker House Goa 2026
        </p>
        <h1 className="mt-3 text-4xl leading-[0.95] font-bold text-cream sm:text-5xl">
          Builder Studio
        </h1>
        <p className="mt-3 text-lg text-cream-dim">
          Create your Hacker House Goa 2026 identity.
        </p>
      </header>

      <EditorShell />

      <footer className="mt-16 border-t border-cream-dim/15 pt-6">
        <p className="text-xs leading-relaxed text-cream-dim/60">
          Slice 1 — pipeline verification. The graphic is a placeholder; branding lands in
          Slice 2. An independent project by team GoaByte, not an official Hacker House
          Goa product.
        </p>
      </footer>
    </main>
  )
}
