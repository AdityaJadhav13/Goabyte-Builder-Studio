/**
 * The brand illustration, presented as a framed poster rather than a page
 * background.
 *
 * Measured, not assumed: cream text over this artwork ranges from 4.54:1 down
 * to 2.00:1 in its lightest areas — it fails AA as a text surface. Reaching
 * AAA would need a ~40% ink overlay, which would flatten exactly what makes
 * the illustration good. Framing it instead keeps the art at full strength and
 * leaves copy on our solid green, where it already measures 11.85:1.
 *
 * It is also the more distinctive treatment: a screen-printed poster is an
 * object with an edge, which is what the ink keyline and hard offset shadow
 * are describing.
 *
 * Decorative — the surrounding copy carries every piece of meaning, so it is
 * hidden from assistive technology rather than narrated (NFR-019).
 */
export function HeroPoster() {
  return (
    <div
      aria-hidden
      className="overflow-hidden border-2 border-ink bg-green-900 shadow-ink"
    >
      <picture>
        <source
          media="(min-width: 640px)"
          srcSet="/brand/hero-wide.webp"
          width={1600}
          height={686}
        />
        <img
          src="/brand/hero-narrow.webp"
          alt=""
          width={820}
          height={351}
          // The largest element above the fold, so it is the LCP candidate:
          // eager and high-priority, with intrinsic dimensions to reserve its
          // space and keep CLS at zero (NFR-008).
          fetchPriority="high"
          decoding="async"
          className="block aspect-[21/9] w-full object-cover"
        />
      </picture>
    </div>
  )
}
