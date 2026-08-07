import { EditorShell } from '@/features/editor/components/EditorShell'

/**
 * Landing page and editor host.
 *
 * A visitor must understand what this is in under five seconds and reach the
 * upload control without scrolling on a 375px screen (J1, NFR-009). Everything
 * here is in service of that: one headline, one sentence, one control.
 */
export default function Home() {
  return (
    <div className="min-h-dvh">
      {/* Ruled band, poster masthead. Ink keylines rather than shadows. */}
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
        <EditorShell />
      </main>

      <footer className="mt-8 border-t border-cream-dim/15">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <p className="max-w-2xl text-xs leading-relaxed text-cream-dim/60">
            An independent project by team GoaByte. Not an official Hacker House Goa
            product — the visual language is original work inspired by the event, and no
            organiser logos, wordmarks or artwork are used.
          </p>
        </div>
      </footer>
    </div>
  )
}
