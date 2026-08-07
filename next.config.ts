import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // An unrelated package.json in the developer's home directory was being
  // inferred as the workspace root, which produces wrong file tracing. Pin the
  // root to this repository.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),

  // The application is a fully client-side image compositor. No user content is
  // ever processed on a server or passed through a remote optimizer, so the
  // built-in image optimizer is disabled outright rather than left available.
  // See PRD NFR-037 and ARCHITECTURE §18 — this is one of the mechanisms that
  // makes "your photo never leaves your device" structurally true.
  images: {
    unoptimized: true,
  },

  eslint: {
    // Linting runs as its own CI gate (`pnpm lint`); running it again inside
    // `next build` doubles build time without adding signal.
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
