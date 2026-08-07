import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Technical spikes — Builder Studio',
  // The harness is a team tool, not part of the product. It stays deployed so
  // it can be opened on real phones via the preview URL, but it must never
  // appear in search results or be mistaken for the submission.
  robots: { index: false, follow: false },
}

export default function SpikeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
