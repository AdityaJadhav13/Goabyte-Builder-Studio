import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Builder Studio by GoaByte — Hacker House Goa 2026',
  description:
    'Create your Hacker House Goa 2026 identity. Upload a photo, get a branded PFP or Builder ID card. No login. Your photo never leaves your device.',
  applicationName: 'Builder Studio',
  authors: [{ name: 'GoaByte' }],
  openGraph: {
    title: 'Builder Studio by GoaByte',
    description: 'Create your Hacker House Goa 2026 identity.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Builder Studio by GoaByte',
    description: 'Create your Hacker House Goa 2026 identity.',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a3527',
  width: 'device-width',
  initialScale: 1,
  // Deliberately NOT maximum-scale=1: locking pinch-zoom breaks the page for
  // low-vision users, and there is no gesture surface that needs protecting
  // from it (NFR-014).
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* The masthead uses the display face immediately, so preloading it
            removes a visible swap on first paint (NFR-008). The text face is
            not preloaded — it is needed slightly later and competing for
            bandwidth on 4G would hurt LCP more than it helps. */}
        <link
          rel="preload"
          href="/fonts/hhg-display-400.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* The hero poster is the LCP candidate. Preloading the variant the
            viewport will actually use avoids waiting for CSS and layout to
            discover it — and avoids fetching both. */}
        <link
          rel="preload"
          as="image"
          href="/brand/hero-narrow.webp"
          media="(max-width: 639px)"
        />
        <link
          rel="preload"
          as="image"
          href="/brand/hero-wide.webp"
          media="(min-width: 640px)"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
