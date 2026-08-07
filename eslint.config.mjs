import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'coverage/**'],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // ARCHITECTURE §4 — R-1: lib/ is pure. No React, no framework.
  // Enforced, not documented. A violation fails CI.
  // ───────────────────────────────────────────────────────────────────────────
  {
    files: ['lib/**/*.ts', 'lib/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*', 'next', 'next/*'],
              message:
                'ARCHITECTURE §4 R-1: lib/ must stay pure — no React, no Next. It has to be testable in plain Node.',
            },
            {
              group: ['@/app/*', '@/features/*', '@/components/*'],
              message:
                'ARCHITECTURE §4: dependencies point inward only. lib/ may import lib/ and nothing else.',
            },
          ],
        },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // ARCHITECTURE §4 — R-2: renderers are pure and synchronous (D-2, ADR-4).
  // A renderer that can await is a renderer that can race, and a racing
  // renderer is exactly how preview and export diverge.
  // ───────────────────────────────────────────────────────────────────────────
  {
    files: ['features/render/**/*.draw.ts', 'features/render/**/*.layout.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*', 'next', 'next/*'],
              message:
                'ARCHITECTURE §4 R-2: a renderer receives a RenderModel and nothing else. No React.',
            },
            {
              group: ['@/features/editor/*', '@/app/*'],
              message:
                'ARCHITECTURE §4 R-2: renderers must not read editor state. Pass it through RenderModel.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'AwaitExpression',
          message:
            'ARCHITECTURE ADR-4: the renderer is synchronous by contract. Hoist async work into prepareRenderAssets().',
        },
        {
          selector: 'FunctionDeclaration[async=true]',
          message: 'ARCHITECTURE ADR-4: renderers must be synchronous.',
        },
        {
          selector: 'ArrowFunctionExpression[async=true]',
          message: 'ARCHITECTURE ADR-4: renderers must be synchronous.',
        },
        {
          selector: 'ImportExpression',
          message:
            'ARCHITECTURE ADR-4: no dynamic import inside a renderer. Load it in prepareRenderAssets().',
        },
        {
          selector: "CallExpression[callee.name='fetch']",
          message:
            'ARCHITECTURE ADR-4 / NFR-037: renderers perform no network access. Ever.',
        },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // ARCHITECTURE §4 — R-3: nothing imports from app/.
  // ───────────────────────────────────────────────────────────────────────────
  {
    files: ['features/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*'],
              message: 'ARCHITECTURE §4 R-3: nothing imports from app/.',
            },
          ],
        },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Privacy invariant (NFR-037, D-8). The claim "your photo never leaves your
  // device" is true because no code path can make it false. These packages are
  // the ones that would silently create such a path.
  // ───────────────────────────────────────────────────────────────────────────
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['app/spikes/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/image',
              message:
                'NFR-037: user photos are canvas-only and never go through an image loader. Use a plain <img> for static brand art.',
            },
          ],
          patterns: [
            {
              group: ['@sentry/*', 'cloudinary*', '@vercel/blob'],
              message:
                'NFR-037: no transport may exist that could carry user content. Requires Aditya sign-off and a PRD amendment.',
            },
          ],
        },
      ],
    },
  },
]

export default config
