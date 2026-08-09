/**
 * The illustration as a full-page backdrop.
 *
 * Text NEVER sits on it. Measured: the brightest 2% of the artwork — the cream
 * margin, the sand, the horizon glow — is 1.05:1 against cream type. Making it
 * a readable text surface needs a 61% ink overlay, which would flatten the very
 * thing worth showing.
 *
 * So content floats on opaque panels above it instead. The art supplies depth
 * and atmosphere; the panels supply contrast. Both jobs done properly, neither
 * compromised for the other.
 *
 * Fixed rather than scrolling: a parallax-free static backdrop reads as a
 * printed backdrop rather than a long page, and avoids repainting the image on
 * every scroll frame.
 */
export function AppBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <picture>
        <source media="(min-width: 640px)" srcSet="/brand/hero-wide.webp" />
        <img
          src="/brand/hero-narrow.webp"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover object-center"
        />
      </picture>

      {/* Atmosphere — very dark overlay matching the reference night scene.
          The illustration is barely visible, providing depth only. */}
      <div className="absolute inset-0 bg-green-900/75" />

      {/* Vignette: near-opaque edges, cinematic focus on center. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_15%,var(--color-ink)_100%)] opacity-95" />
    </div>
  )
}
