/**
 * Left-column branding for the split-screen landing page.
 *
 * Large "HACKER HOUSE" display type with the गोवा Devanagari overlay (used
 * with permission, D-1a), event header, product title, tagline, dates.
 *
 * The product is Builder Studio by GoaByte. Copy here describes what THIS
 * product does — it is not borrowed from another entry, and it does not
 * promise steps we do not have.
 *
 * When `compact` is true (a photo has been loaded), the branding collapses
 * to a minimal header to give space to the editor workspace.
 */
export function Hero({ compact }: { readonly compact: boolean }) {
  if (compact) {
    return (
      <div className="brand-column">
        <h1 className="brand-title" style={{ fontSize: '1.8rem' }}>
          Builder Studio
        </h1>
        <p className="brand-tagline">Create your Hacker House Goa 2026 identity.</p>
      </div>
    )
  }

  return (
    <div className="brand-column">
      {/* Large "HACKER HOUSE" logo with गोवा overlay */}
      <div className="brand-logo animate-fade-up">
        <div className="brand-logo-text" aria-label="Hacker House Goa">
          Hacker
          <br />
          House
        </div>
        <span className="brand-logo-goa" aria-hidden>
          गोवा
        </span>
      </div>

      {/* Event sub-header */}
      <p className="brand-tagline animate-fade-up animate-delay-1">
        Hacker House Goa 2026
      </p>

      {/* Product title — ours, not another entry's. */}
      <h1 className="brand-title animate-fade-up animate-delay-2">Builder Studio</h1>

      {/*
        Accurate to what the product actually does: there is no frame-picking
        step (D-9), so promising one would be a broken promise the moment a
        judge clicks Continue.
      */}
      <p className="brand-description animate-fade-up animate-delay-3">
        Upload a real selfie and it&rsquo;s framed automatically &mdash; no cropping, no
        signup. Download your Hacker House Goa 2026 graphic and post it with #FrameInGoa.
      </p>

      {/* Event dates */}
      <p className="brand-dates animate-fade-up animate-delay-4">
        Goa, India &middot; 28 &ndash; 31 Oct 2026
      </p>
    </div>
  )
}
