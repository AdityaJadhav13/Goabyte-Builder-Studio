/**
 * D0 SHELL ONLY.
 *
 * This is deployment plumbing, not the product. It exists to prove the path
 * local → GitHub → Vercel → working preview URL, and it will be replaced
 * wholesale by the real landing page in Slice 2 (D2).
 *
 * Production feature implementation does not begin until D0 is signed off.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-16">
      <p className="font-mono text-xs tracking-widest text-yellow uppercase">
        GoaByte · Hacker House Goa 2026
      </p>

      <h1 className="mt-4 text-5xl leading-[0.95] font-bold text-cream sm:text-6xl">
        Builder Studio
      </h1>

      <p className="mt-4 max-w-md text-lg text-cream-dim">
        Create your Hacker House Goa 2026 identity.
      </p>

      <div className="mt-10 border-2 border-yellow bg-green-900 p-5">
        <p className="text-sm font-semibold text-yellow">Day 0 — infrastructure shell</p>
        <p className="mt-2 text-sm leading-relaxed text-cream-dim">
          Deployment pipeline verified. The product begins at Slice 1. Technical spikes
          are running at{' '}
          <a className="text-yellow underline underline-offset-2" href="/spikes">
            /spikes
          </a>
          .
        </p>
      </div>

      <p className="mt-10 text-xs leading-relaxed text-cream-dim/70">
        An independent project by team GoaByte. Not an official Hacker House Goa product.
      </p>
    </main>
  )
}
