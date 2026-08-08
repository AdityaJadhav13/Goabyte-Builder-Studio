import { cn } from '@/lib/cn'

/**
 * An opaque surface for content sitting over the illustrated backdrop.
 *
 * This is what makes the background safe: every piece of text in the product
 * lives on one of these, at a measured 11.85:1, rather than on artwork that
 * bottoms out at 1.05:1.
 *
 * Ink keyline plus hard offset shadow, no blur — DESIGN_SYSTEM §5. The
 * shadow is what lifts it off the backdrop and gives the page depth.
 */
export function Panel({
  children,
  className,
  tone = 'surface',
}: {
  readonly children: React.ReactNode
  readonly className?: string
  /** `surface` for content, `deep` for nested/inset areas. */
  readonly tone?: 'surface' | 'deep'
}) {
  return (
    <section
      className={cn(
        'border-2 border-ink shadow-ink',
        tone === 'surface' ? 'bg-green-800' : 'bg-green-900',
        className,
      )}
    >
      {children}
    </section>
  )
}
