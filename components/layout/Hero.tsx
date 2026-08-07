import { cn } from '@/lib/cn'

/**
 * The pitch.
 *
 * It collapses once a photo exists. Marketing copy has done its job the
 * instant someone commits a photo, and on a 390px phone leaving it expanded
 * pushed the graphic below the fold — the user scrolled past the argument to
 * reach the product.
 */
export function Hero({ compact }: { readonly compact: boolean }) {
  return (
    <div className="motion-reduce:transition-none">
      <h1
        className={cn(
          'font-display text-cream transition-[font-size,line-height] duration-300 ease-out motion-reduce:transition-none',
          compact ? 'text-3xl leading-tight' : 'text-5xl leading-[0.92] sm:text-7xl',
        )}
      >
        Builder Studio
      </h1>

      {/* The tagline is the brand line and stays in both states. The practical
          detail — automatic framing, accepted formats — lives in the dropzone,
          where it is read at the moment it matters and fills space that was
          otherwise empty. Saying it in both places was the redundancy. */}
      <p
        className={cn(
          'text-cream-dim transition-[font-size] duration-300 ease-out motion-reduce:transition-none',
          compact ? 'mt-1 text-sm' : 'mt-4 text-lg text-cream sm:text-xl',
        )}
      >
        Create your Hacker House Goa 2026 identity.
      </p>

      {compact ? null : (
        <p className="mt-5 inline-flex items-center gap-2 border border-green-600 px-3 py-1.5 text-xs text-cream-dim">
          <span aria-hidden>🔒</span>
          Your photo never leaves your device.
        </p>
      )}
    </div>
  )
}
