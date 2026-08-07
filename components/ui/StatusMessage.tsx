/**
 * Announces async progress to screen readers and sighted users alike
 * (NFR-018).
 *
 * `aria-live="polite"` rather than `assertive`: these are progress updates, not
 * emergencies, and interrupting the user mid-sentence for "Normalizing…" would
 * be worse than waiting for a pause.
 */
export function StatusMessage({ children }: { readonly children: React.ReactNode }) {
  return (
    <p
      aria-live="polite"
      aria-busy="true"
      className="flex items-center gap-3 text-sm text-cream-dim"
    >
      <span
        aria-hidden
        className="size-4 shrink-0 animate-spin rounded-full border-2 border-cream-dim/30 border-t-yellow"
      />
      {children}
    </p>
  )
}
