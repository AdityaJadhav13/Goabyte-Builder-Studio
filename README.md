# Builder Studio — by GoaByte

**Create your Hacker House Goa 2026 identity.**

Upload a photo, get a branded PFP frame or a Builder ID card, download it, share it with `#FrameInGoa`. No login, no signup, one pass.

**Your photo never leaves your device.** Decoding, cropping, compositing and export all happen in your browser. There is no upload endpoint, no database, and no server in the data path — see [Privacy](#privacy).

> An independent project by team **GoaByte**. Not an official Hacker House Goa product.

---

## Status

**Day 0 — foundation.** Documentation, architecture, tooling and technical spikes. Product implementation begins at Slice 1.

|            |                                                               |
| ---------- | ------------------------------------------------------------- |
| Submission | Hacker House Goa 2026 — Open Trial, Frame / ID Card Generator |
| Deadline   | 23:59 IST, 13 Aug 2026 · team target 14:00 IST                |
| Live URL   | _pending first production deploy_                             |

## Team

| Name              | Role                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| **Aditya**        | Team lead · architecture · image engine · deployment · release ([docs/ADITYA.md](docs/ADITYA.md)) |
| **Nitin Gupta**   | Frontend engineering ([docs/NITIN.md](docs/NITIN.md))                                             |
| **Lavitra Satam** | Product design · brand · visual QA ([docs/LAVITRA.md](docs/LAVITRA.md))                           |

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

| Script           | Purpose                                        |
| ---------------- | ---------------------------------------------- |
| `pnpm dev`       | Development server                             |
| `pnpm build`     | Production build                               |
| `pnpm lint`      | ESLint, including architectural layering rules |
| `pnpm typecheck` | `tsc --noEmit`, strict mode                    |
| `pnpm test`      | Vitest unit tests                              |
| `pnpm verify`    | All four gates — run before every push         |

Requires Node ≥20.9 and pnpm (`corepack enable`).

## How it works

A fully client-side image compositor. The pipeline has one shape, and it is the reason the product is reliable:

```
File → validate → decode (native, HEIC fallback) → normalize → prepareRenderAssets
                                                                       │
                                                          ── async boundary ──
                                                                       │
                                                          renderTemplate()  ← synchronous
                                                                       │
                                                       canvas → preview  or  PNG export
```

Three commitments follow:

1. **One canonical image.** Decoding produces exactly one `NormalizedImage` — upright, downscaled to ≤2400px, opaque. Nothing downstream re-reads the file or re-applies orientation. This is what keeps iOS Safari from killing the tab.
2. **One renderer, two scales.** Preview and export call the same synchronous function, differing only by a scale factor. "Looks right on screen, exports differently" is not a bug we test for — it is a state the architecture cannot represent.
3. **One direction of dependency.** `app/ → features/ → lib/`, enforced by ESLint rather than by convention.

Full reasoning in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Repository

```text
app/        routes, layout, design tokens (@theme)
features/   editor · upload · crop · render · export · share
lib/        pure logic — image, canvas, brand, browser, errors. No React.
tests/      unit (Vitest) · e2e (Playwright)
docs/       PRD, architecture, design system, spikes
```

## Documentation

| Document                                  | What it settles                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| [PRD.md](docs/PRD.md)                     | Scope, 60+ numbered requirements, acceptance criteria, edge cases, decision log |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)   | System design, type contracts, ADRs                                             |
| [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Brand, tokens, measured contrast, export template specs                         |
| [spikes/](docs/spikes/)                   | Browser questions answered with measurements, not assumptions                   |

## Technical spikes

The hard problems here are browser problems: HEIC decoding, iOS memory ceilings, canvas and font fidelity, share-sheet behaviour, download reliability. Each is settled by evidence from a real device before implementation depends on it.

The harness is deployed at `/spikes` and is intended to be opened **on a phone**, not in a desktop emulator. Results are recorded in [docs/spikes/](docs/spikes/).

```
PRD → Architecture → Contracts → Spikes → Evidence → Decision → Implementation
```

A spike result that contradicts the plan is the spike working correctly.

## Privacy

"Your photo never leaves your device" is an architectural invariant, not a marketing line. It is true because no code path exists that could make it false:

- no upload endpoint — there are no route handlers
- no server-side rendering of user content
- no remote image optimization (`next/image` is banned by lint rule)
- no third-party image, crop, or face-detection APIs
- no error-reporting transport that could carry photo or form data
- all fonts and assets are same-origin — which is also what keeps the canvas untainted

`.env.example` is intentionally empty. Anything needing configuration probably needs a network call, and that is what the invariant forbids.

Enumerated in [PRD.md](docs/PRD.md) NFR-037 and [ARCHITECTURE.md](docs/ARCHITECTURE.md) §18.

## Deployment

Vercel, from `main`. Every pull request gets a preview URL — that is how design review and real-device testing happen.

```bash
pnpm verify        # lint + typecheck + test + build
vercel             # preview deployment
vercel --prod      # production
```

The application is fully static; there are no runtime environment variables.

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind CSS v4 · React 19 · react-easy-crop · heic2any (lazy) · Vitest · pnpm · Vercel

## Licence & attribution

Original design work. Typefaces are SIL Open Font License 1.1; licence text ships in `public/fonts/`. Hacker House Goa branding is referenced visually but not reproduced — no organiser logos, wordmarks, or artwork are used. See [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) §1.
