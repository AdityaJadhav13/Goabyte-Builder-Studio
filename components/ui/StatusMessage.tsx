/**
 * Announces async progress to screen readers and sighted users alike
 * (NFR-018).
 *
 * The spinner is `motion-safe` only. The global reduced-motion rule sets
 * `animation-duration: 0.01ms`, which does not remove a spinner — it FREEZES
 * it, leaving a static partial ring that looks like a rendering bug and
 * conveys nothing. Under reduced motion the changing stage text is the
 * progress signal, which is honest and needs no animation at all.
 *
 * `aria-live="polite"` rather than `assertive`: these are progress updates,
 * not emergencies, and interrupting the user mid-sentence for "Framing your
 * photo…" would be worse than waiting for a pause.
 */
export function StatusMessage({ children }: { readonly children: React.ReactNode }) {
  return (
    <p aria-live="polite" className="flex items-center gap-3 text-sm text-cream-dim">
      <span
        aria-hidden
        className="size-4 shrink-0 rounded-full border-2 border-cream-dim/30 border-t-yellow motion-safe:animate-spin motion-reduce:border-t-cream-dim/30"
      />
      {children}
    </p>
  )
}
