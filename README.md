# Builder Studio — by GoaByte

**Create your Hacker House Goa 2026 identity.**

Add a real, current selfie and get a branded PFP, a two-sided Builder ID, or a 1–4 person Crew Frame. Download or share the finished PNG with `#FrameInGoa` — no login, no signup, one pass.

**Your photo never leaves your device.** Decoding, automatic framing, compositing and export all happen in your browser. There is no upload endpoint, no database, and no server in the data path — see [Privacy](#privacy).

> An independent project by team **GoaByte**. Not an official Hacker House Goa product.

---

## Status

**Current build — complete client-side creation flow.** PFP, two-sided Builder ID, Crew Frame, PNG download and capability-based sharing all use the production canvas pipeline.

|            |                                                                               |
| ---------- | ----------------------------------------------------------------------------- |
| Submission | Hacker House Goa 2026 — Open Trial, Frame / ID Card Generator                 |
| Deadline   | 23:59 IST, 13 Aug 2026 · team target 14:00 IST                                |
| Deployment | https://goabyte-builder-studio.vercel.app                                     |
| Spikes     | [/spikes](https://goabyte-builder-studio.vercel.app/spikes) — open on a phone |

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

### What ships

- Every generated format carries the full **HACKER HOUSE GOA 2026** campaign identity and `#FrameInGoa`.
- Builder ID has equal **1080×1350** front and back canvases. The front keeps the photo credential; the personalized reverse adds the builder name, one of 14 canonical titles, and an original crew-builder mascot drawn entirely with Canvas primitives.
- A native button flips the live card with a CSS-only Y-axis transition. Keyboard activation, side-specific preview descriptions, live status and `prefers-reduced-motion` are built in; the control is webpage UI and can never enter an exported image.
- Download and share always prepare the currently visible Builder ID side. Safe filenames identify it as `builder-id-front` or `builder-id-back`.
- The upload and camera flows ask for a real, current selfie. This is honest guidance, not face recognition or an AI-image detector.

## Repository

```text
app/        routes, layout, design tokens (@theme)
features/   editor · upload · builder-title · render · export · share
lib/        pure logic — image/framing, canvas, brand, browser, errors. No React.
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
- no third-party image, framing, or face-detection APIs
- no error-reporting transport that could carry photo or form data
- all fonts and assets are same-origin — which is also what keeps the canvas untainted

`.env.example` is intentionally empty. Anything needing configuration probably needs a network call, and that is what the invariant forbids.

Enumerated in [PRD.md](docs/PRD.md) NFR-037 and [ARCHITECTURE.md](docs/ARCHITECTURE.md) §18.

## Deployment

Vercel, connected to this GitHub repository. Every pull request gets a preview URL — that is how design review and real-device testing happen.

```bash
pnpm verify        # lint + typecheck + test + build — run before every push
vercel             # preview deployment
vercel --prod      # production
```

The application is fully static; there are no runtime environment variables.

**Deployment protection is disabled deliberately.** Vercel enables SSO protection on new projects, which redirects anonymous visitors to a login page. That is fatal for this submission — a judge cannot authenticate into our Vercel account, and PRD success criteria require the URL to work in a fresh incognito session. If a route ever starts returning `302` to `vercel.com/sso-api`, protection has been re-enabled; turn it off under **Project Settings → Deployment Protection**.

Verify anonymous access after any deployment:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://goabyte-builder-studio.vercel.app
# expect 200, never 302
```

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind CSS v4 · React 19 · Canvas 2D · CSS transforms · heic2any (lazy) · Vitest · pnpm · Vercel

## Licence & attribution

Original composition and illustration work. The reverse-side crew-builder mascot is code-drawn and uses no external character asset. Typefaces are SIL Open Font License 1.1; licence text ships in `public/fonts/`. Event branding and supplied hero artwork are used with participant permission (D-1a), while Builder Studio remains an independent GoaByte project. See [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) §1.
