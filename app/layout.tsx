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
  // Deliberately NOT maximum-scale=1: locking zoom breaks accessibility for
  // low-vision users. The cropper handles its own gesture capture instead
  // (NFR-013, NFR-014).
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
