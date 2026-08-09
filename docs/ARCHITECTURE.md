# ARCHITECTURE — GoaByte Builder Studio

**Version:** v0.1 · 7 August 2026
**Owner:** Aditya · **Implements:** `PRD.md` v0.2 (§13 decisions D-1 … D-8 are binding here)
**Status:** For review. Sections marked **PROVISIONAL** are gated on Day-0 spikes (`PRD.md` §11.1).

---

## 1. What this document is for

Two audiences, both real.

**The team.** Nitin and Aditya work in parallel from Day 1. That is only possible if the boundary between the React application and the image engine is defined before either side starts. §5 is that boundary. It is the most load-bearing section here.

**A reviewer.** Someone from HH Goa opening this repository has a few minutes. They should be able to read §2 and §3, open two files, and understand how the whole thing works. Architecture that needs a guided tour has failed at its job.

Everything below is in service of one property: **a stranger's photo becomes a correct PNG on a stranger's phone, the first time.** Where a decision does not serve that, it is over-engineering and should be challenged in review.

---

## 2. System overview

The application is a **fully client-side image compositor** delivered as a static Next.js site. There is no server component in the data path. No user content crosses the network (`NFR-037`, D-8).

```
┌──────────────────────────────── BROWSER ────────────────────────────────┐
│                                                                          │
│   File                                                                   │
│     │                                                                    │
│     ▼                                                                    │
│  ┌────────────────┐   validate → decode → orient → downscale → flatten   │
│  │  DECODE        │   ───────────────────────────────────────────────►   │
│  │  PIPELINE      │                                    NormalizedImage   │
│  └────────────────┘                                     (one, canonical) │
│                                                              │           │
│                                                              ▼           │
│  ┌────────────────┐        ┌─────────────────────────────────────────┐   │
│  │  EDITOR STATE  │◄──────►│  crop · format · fields · variant       │   │
│  │  (useReducer,  │        └─────────────────────────────────────────┘   │
│  │   discriminated│                          │                           │
│  │   union)       │                          ▼                           │
│  └────────────────┘                    RenderModel                       │
│           │                                  │                           │
│           │                    ┌─────────────┴─────────────┐             │
│           │                    ▼                           ▼             │
│           │            ┌──────────────┐            ┌──────────────┐      │
│           │            │  PREVIEW     │            │  EXPORT      │      │
│           │            │  scale ≈0.45 │            │  scale 1.0   │      │
│           │            │  onscreen    │            │  offscreen   │      │
│           │            └──────┬───────┘            └──────┬───────┘      │
│           │                   │                           │              │
│           │                   └────────┬──────────────────┘              │
│           │                            ▼                                 │
│           │                  ┌───────────────────┐                       │
│           │                  │  ONE RENDERER     │  ← D-2                │
│           │                  │  renderTemplate() │                       │
│           │                  │  pure, sync       │                       │
│           │                  └───────────────────┘                       │
│           │                            │                                 │
│           ▼                            ▼                                 │
│      React UI                     PNG Blob ──► download                  │
│                                            └──► Web Share / X intent     │
└──────────────────────────────────────────────────────────────────────────┘

        Network boundary: static assets in, nothing out.
```

Three structural commitments follow from this diagram, and everything else is detail:

1. **One canonical image.** The decode pipeline produces exactly one `NormalizedImage` per upload. Nothing downstream re-reads the original file, re-applies orientation, or holds a second full-resolution decode. This is what makes iOS survivable (`R1`, `NFR-007`).
2. **One renderer, two scales.** Preview and export call the identical function. Divergence is not a bug we test for; it is a state the architecture cannot represent (D-2).
3. **One direction of dependency.** `app/ → features/ → lib/`. Never backwards. §4.

---

## 3. Repository structure

Deviations from the structure proposed in `CLAUDE_MASTER_PROMPT.md` §6 are marked **[Δ]** and justified. The master prompt's instruction "do not create folders that are not used" is honoured — nothing below is speculative.

```text
goabyte-builder-studio/
├─ app/
│  ├─ layout.tsx                    # fonts, metadata, OG, error boundary
│  ├─ page.tsx                      # landing + editor host (thin)
│  ├─ globals.css                   # Tailwind v4 @theme — SOLE token source
│  ├─ opengraph-image.png           # static, hand-designed (S1-6)
│  └─ icon.svg / apple-icon.png
│
├─ features/
│  ├─ editor/
│  │  ├─ EditorProvider.tsx         # useReducer + context, the only shared state
│  │  ├─ editor-machine.ts          # pure reducer — no React import
│  │  ├─ editor-state.ts            # discriminated union + guards
│  │  └─ components/                # EditorShell, FormatSelector, Toolbar…
│  ├─ upload/
│  │  ├─ components/UploadDropzone.tsx
│  │  ├─ validate-file.ts           # magic-byte sniffing, size/dimension gates
│  │  └─ use-upload.ts
│  ├─ render/                       # [Δ] merged from features/pfp + features/builder-card
│  │  ├─ render-template.ts         # single entry point — pure, synchronous
│  │  ├─ templates/
│  │  │  ├─ pfp.layout.ts           # layout CONFIG only, zero drawing code
│  │  │  ├─ pfp.draw.ts
│  │  │  ├─ builder-card.layout.ts
│  │  │  └─ builder-card.draw.ts
│  │  ├─ assets.ts                  # preload + cache frame art as ImageBitmap
│  │  ├─ fonts.ts                   # explicit document.fonts.load() per face
│  │  └─ types.ts                   # RenderModel, RenderTarget, LayoutSpec
│  ├─ export/
│  │  ├─ export-png.ts              # offscreen render → Blob
│  │  ├─ file-name.ts               # sanitise + slug
│  │  └─ download.ts                # platform-aware save ladder
│  ├─ share/
│  │  ├─ share-copy.ts              # caption variants — #FrameInGoa enforced
│  │  ├─ share-to-x.ts              # Web Share → intent fallback ladder
│  │  └─ components/SharePanel.tsx
│  └─ builder-title/
│     └─ suggest-title.ts           # deterministic, seeded from name
│
├─ lib/
│  ├─ image/
│  │  ├─ decode.ts                  # native-first, HEIC fallback  [PROVISIONAL]
│  │  ├─ normalize.ts               # orient → downscale → flatten (synchronous)
│  │  ├─ normalized-image.ts        # the canonical type + release()
│  │  └─ crop-geometry.ts           # automatic framing + renderer positioning
│  ├─ canvas/
│  │  ├─ cover-fit.ts               # aspect-preserving fill maths
│  │  ├─ fit-text.ts                # auto-shrink, wrap, grapheme-safe ellipsis
│  │  ├─ draw-primitives.ts         # rounded rect, inset border, texture
│  │  └─ recording-context.ts       # test double — see §16.2
│  ├─ browser/
│  │  └─ capabilities.ts            # feature detection, never UA sniffing
│  ├─ brand/
│  │  └─ palette.ts                 # TS mirror of @theme, parity-tested §15
│  └─ errors/
│     └─ app-error.ts               # error taxonomy §13
│
├─ components/ui/                   # buttons, inputs, toast — hand-styled
├─ public/{fonts,frames,textures}/
├─ tests/{unit,e2e}/
└─ docs/
```

**[Δ] Why `features/render/` instead of `features/pfp/` + `features/builder-card/`.**
Both templates need identical cover-fit maths, identical text auto-fitting, identical asset and font handling. Split across two feature folders, that logic gets copied — and then the copies drift, and the two output formats develop different bugs. Merging them means one renderer, one set of primitives, and per-format _configuration_ rather than per-format _code_.
_Alternative:_ keep them separate with a shared `lib/render-common`. _Rejected_ — the shared module ends up containing everything meaningful and the two feature folders become empty shells holding a config file each. _Trade-off:_ `features/render/` is the largest module in the repo and needs internal discipline (layout config strictly separate from draw code, enforced by the file naming above). _Future implication:_ adding a third output format is a new `.layout.ts` + `.draw.ts` pair and one union member. That is the right cost curve.

**[Δ] `crop-utils` moved to `lib/image/crop-geometry.ts`.** It is pure maths with no React dependency and it is the highest-value unit-test target in the codebase (`FR-019`, `FR-020`). It does not belong in a folder whose other contents are components.

**[Δ] `styles/tokens.css` deleted; `app/api/share/` and `app/generated/[id]/` never created.** Tailwind v4 is CSS-first — a second token file guarantees drift (§15). The two server routes are cut by PRD §2.3.

---

## 4. Layering and dependency rules

```
app/         React pages, routing, metadata          may import: features, components, lib
features/    Feature logic + feature components      may import: features (siblings), components, lib
components/  Presentational primitives               may import: lib
lib/         Pure logic. NO React. NO DOM globals    may import: lib
```

Three hard rules, enforced not merely documented:

- **R-1** `lib/` never imports React and never reads `window` at module scope. It is testable in a plain Node environment.
- **R-2** `features/render/**/*.draw.ts` and `*.layout.ts` never import React and never read editor state. A renderer receives a `RenderModel` and nothing else. This is what keeps preview and export honest.
- **R-3** Nothing imports from `app/`.

Enforced in `eslint.config.mjs` via `no-restricted-imports` zones. A violation fails CI. Stating a layering rule without a linter is a wish, not an architecture.

---

## 5. The integration contract

**This section is the interface between Aditya and Nitin. It is published before implementation and changes only by agreement.** Nitin builds against these types; Aditya implements behind them. Neither side reaches into the other's internals.

```ts
// ─── lib/image/normalized-image.ts ────────────────────────────────────────
/**
 * The single canonical decoded image for one upload.
 * Upright, downscaled, opaque. Nothing downstream re-reads the source File.
 */
export interface NormalizedImage {
  /** Drawable source for the renderer. One resource, one owner. */
  readonly source: CanvasImageSource
  readonly width: number // ≤ WORKING_MAX_EDGE (2400)
  readonly height: number
  readonly provenance: {
    readonly originalWidth: number
    readonly originalHeight: number
    readonly mimeType: string
    readonly byteSize: number
    readonly heicConverted: boolean
    readonly downscaled: boolean
  }
  /** Idempotent. Closes the bitmap and revokes any object URL. FR-015. */
  release(): void
}

// ─── lib/image/crop-geometry.ts ───────────────────────────────────────────
/**
 * Crop rectangle in NORMALIZED coordinates (0..1) relative to NormalizedImage.
 * Normalized, not pixels: resolution-independent, so it survives a change to
 * WORKING_MAX_EDGE and cannot silently mean different things at two scales.
 */
export interface CropRect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

// ─── features/render/types.ts ─────────────────────────────────────────────
export type OutputFormat = 'pfp' | 'builder-card' | 'crew'
export type PfpFrameId = 'heritage' | 'postcard' | 'midnight'

export interface BuilderFields {
  readonly name: string
  readonly role: string
  readonly team: string
  readonly title: string | null // null ⇒ omit from layout, reflow. FR-033
}

export interface CrewFields {
  readonly teamName: string
  readonly projectUrl: string // encoded into the Crew QR
  readonly members: readonly CrewMember[] // 0–3 extras; main photo is leader
}

export interface RenderModel {
  readonly format: OutputFormat
  readonly image: NormalizedImage
  readonly crop: CropRect
  readonly fields: BuilderFields | null // null for 'pfp'
  readonly pfpFrame: PfpFrameId
  readonly crew: CrewFields | null // non-null only for 'crew'
}

export interface RenderTarget {
  readonly ctx: CanvasRenderingContext2D
  /** Design units → device pixels. Preview ≈0.45, export exactly 1.0. */
  readonly scale: number
}

/**
 * Everything the renderer needs, already resolved. Produced by the ONLY
 * async step in the render path.
 */
export interface RenderAssets {
  readonly fonts: 'ready' // branded proof, not a boolean
  readonly art: ReadonlyMap<string, ImageBitmap>
}

/**
 * THE asset-preparation boundary. All asynchrony in rendering lives here and
 * nowhere else: font faces, decorative art decode, template-specific assets.
 * Idempotent and cached — cheap to call before every render.
 */
export async function prepareRenderAssets(format: OutputFormat): Promise<RenderAssets>

/**
 * THE renderer. Pure and SYNCHRONOUS by contract (ADR-4).
 *
 * It must not: fetch, dynamically import, decode files, load fonts, touch the
 * network, read application state, or await anything. A renderer that can
 * await is a renderer that can race, and a racing renderer composes a frame
 * from two different models — which is exactly how preview and export diverge.
 *
 * Enforced by ESLint (`no-restricted-syntax` on AwaitExpression, async
 * functions, ImportExpression and fetch) over `*.draw.ts` and `*.layout.ts`.
 * Violating the contract fails CI rather than review.
 */
export function renderTemplate(
  target: RenderTarget,
  model: RenderModel,
  assets: RenderAssets,
): void

// ─── features/export/export-png.ts ────────────────────────────────────────
export interface ExportResult {
  readonly blob: Blob
  readonly width: number
  readonly height: number
  readonly fileName: string
  readonly durationMs: number
}
export function exportPng(model: RenderModel): Promise<ExportResult>
```

**Design-space constants** (`features/render/types.ts`) — the only place these numbers exist:

```ts
export const DESIGN = {
  pfp: { width: 1080, height: 1080 }, // FR-021
  'builder-card': { width: 1080, height: 1350 }, // FR-025, D-4
  crew: { width: 2048, height: 1362 },
} as const

export const WORKING_MAX_EDGE = 2400 // FR-012
export const MAX_FILE_BYTES = 32 * 1024 * 1024 // FR-004 — first filter only, see FR-061
export const MIN_SOURCE_EDGE = 256 // FR-005
export const SOFT_WARN_EDGE = 512 // FR-006
export const PREVIEW_DPR_CAP = 2 // FR-039
```

---

## 6. The design-space coordinate system

**All layout is authored in design units.** The PFP design space is 1080×1080, the Builder ID is 1080×1350, and the Crew Frame is a true 2048×1362 landscape canvas. Layout configs contain design units and nothing else — no device pixels, no CSS pixels, no percentages of a container.

The renderer applies exactly one transform at entry:

```ts
ctx.setTransform(scale, 0, 0, scale, 0, 0)
// every subsequent drawing call is in design units
```

Preview and export therefore differ by a single scalar. There is no second layout implementation, no responsive logic inside the renderer, and no place for a rounding difference to accumulate into a visible divergence. `NFR-036` is satisfied structurally rather than by testing.

Scale is computed once per surface:

| Surface | Backing store                         | `scale`                               |
| ------- | ------------------------------------- | ------------------------------------- |
| Preview | `cssWidth × min(devicePixelRatio, 2)` | `backingWidth / DESIGN[format].width` |
| Export  | exactly `DESIGN[format]`              | `1.0`                                 |

Capping DPR at 2 (`FR-039`) matters on mobile: a DPR-3 phone rendering a full-width preview would otherwise allocate a backing store more than twice the area needed for a perceptually identical result, on the device with the least memory to spare.

**Magic numbers are prohibited in draw code** (master prompt §5.7). Every coordinate lives in a `*.layout.ts` config as a named field. A reviewer changing the badge inset edits one line in a config, never hunts through drawing calls.

---

## 7. Decode pipeline — `lib/image/`

**PROVISIONAL** — the ordering below is the hypothesis SPIKE-1 tests (`PRD.md` §11.1, D-7).

```
File
 │
 ├─ (1) validate-file.ts  ── size gate (FR-004) ─────────► reject: FILE_TOO_LARGE
 │                          magic-byte sniff (FR-003) ───► reject: UNSUPPORTED_TYPE
 │                          zero-byte ─────────────────► reject: EMPTY_FILE
 ▼
 ├─ (2) decode.ts
 │      try  createImageBitmap(file, { imageOrientation: 'from-image' })
 │      ├── success ──────────────────────────────────────────────┐
 │      └── failure && isHeic(file)                                │
 │             └─ await import('heic2any')  ← lazy, FR-010         │
 │                  ├── success → retry decode ────────────────────┤
 │                  └── failure ───────────────────► HEIC_UNSUPPORTED
 │      └── failure && !isHeic  ─────────────────────► DECODE_FAILED
 ▼                                                                 │
 ├─ (3) dimension gate (FR-005, FR-061) ─────────► IMAGE_TOO_SMALL │
 │      Checked HERE, on decoded dimensions — not on file size.    │
 ▼                                                                 │
 ├─ (4) normalize.ts                                               │
 │      orientation already applied by (2), never re-applied  FR-011│
 │      stepwise-halving downscale to ≤2400px longest edge     FR-012│
 │      composite onto opaque background                       FR-013│
 ▼                                                                 │
NormalizedImage ◄──────────────────────────────────────────────────┘
```

**Orientation is applied exactly once, at decode.** `createImageBitmap` is called with `{ imageOrientation: 'from-image' }` explicitly rather than relying on the default, because the default has varied across browsers and versions. The `HTMLImageElement` fallback path relies on the browser's own EXIF handling and then normalizes into a canvas, so both paths converge on the same guarantee: **everything downstream receives upright pixels and no downstream code contains rotation logic.** A second rotation somewhere downstream is the classic way this bug ships (`R2`).

**Downscaling uses stepwise halving**, not a single `drawImage` to the target size. Browser bilinear sampling produces visible aliasing when minifying by more than ~2× in one step; halving repeatedly until within 2× of target, then a final resize, is materially sharper (`NFR-032`) and costs a few milliseconds.

**Flattening onto an opaque background** (`FR-013`) closes the transparent-PNG hole early. A transparent source would otherwise produce a transparent export that looks broken in X's dark mode — a bug that never appears during development on a light background.

**`release()` is called before any new decode begins** (`FR-008`, `FR-015`). Two full-resolution decodes must never be alive at once; that is the specific sequence that kills an iOS tab.

---

## 8. Editor state — `features/editor/`

Plain `useReducer` in a single context provider (locked stack; no Zustand, no Redux). The refinement over the shape sketched in `NITIN.md` §6 is that state is a **discriminated union**, not a flat object with nullable fields.

```ts
export type EditorState =
  | { phase: 'idle' }
  | { phase: 'decoding'; fileName: string }
  | { phase: 'error'; error: AppError; canRetry: boolean }
  | {
      phase: 'editing'
      image: NormalizedImage
      format: OutputFormat
      crops: Record<OutputFormat, CropRect> // per-format, FR-019 / FR-058
      fields: BuilderFields
      variant: string
      quality: 'ok' | 'soft' // FR-062
    }
  | { phase: 'exporting'; previous: Extract<EditorState, { phase: 'editing' }> }
```

_Why._ The flat shape in `NITIN.md` allows `status: 'ready'` alongside `sourceFile: null` — a state that is meaningless but representable, which means every consumer must defensively handle it and one consumer eventually will not. Under the union, `state.image` only exists where an image provably exists. The compiler enforces what would otherwise be a convention.

_Trade-off._ Transitions must reconstruct rather than patch a field, and `exporting` carries `previous` so it can return without re-deriving. Slightly more verbose to write, considerably harder to get wrong.

_Notes._ `crops` is keyed by format so switching PFP ↔ Builder ID preserves both (`FR-058`). Every transition out of a phase holding an image calls `release()` — centralised in the reducer's transition handling, never left to component cleanup, because component cleanup is where leaks hide.

### 8.1 Render readiness is explicit, never implicit

Because the renderer is synchronous (ADR-4), **the frontend owns the question "are we allowed to render yet?"** That question must be answered by a visible state, not by a promise hidden inside a component.

The `decoding` phase above therefore decomposes into named stages:

```ts
type Preparation =
  | { stage: 'validating' }
  | { stage: 'decoding' } // includes HEIC fallback if it fires
  | { stage: 'normalizing' } // orient → downscale → flatten
  | { stage: 'preparing-assets' } // prepareRenderAssets(): fonts + art
```

Each stage is user-visible copy, which is not incidental — `NITIN.md` §4 requires the user never wonder whether the app has frozen, and "Converting your iPhone photo…" is only writable because the stage is modelled.

**A preview component may call `renderTemplate` only when all of the following hold**, and the type system is what establishes them rather than a runtime guard:

| Precondition                             | Established by                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| a normalized image exists                | being in `phase: 'editing'` — `image` does not exist in other phases   |
| the crop is valid                        | `clampCrop` at the boundary; out-of-bounds is unrepresentable (FR-020) |
| the model is complete                    | `RenderModel` requires `fields` for `builder-card`                     |
| fonts for the active template are loaded | holding a `RenderAssets` value (FR-043)                                |
| decorative art is decoded                | same value (FR-044)                                                    |

`RenderAssets.fonts` is typed `'ready'` rather than `boolean` deliberately: a boolean can be `false` and still typecheck at a call site, whereas the only way to obtain this value is to have awaited `prepareRenderAssets`. The proof is carried in the type.

This is the division of labour between Nitin and Aditya: **Nitin waits, Aditya guarantees.** Nitin never awaits inside a render call; he holds the prepared assets and calls a synchronous function. Impossible states stay impossible.

---

## 9. Framing — `lib/image/crop-geometry.ts`

> **D-9a: there is no required crop step.** Framing is automatic and
> deterministic, with optional dependency-free zoom and X/Y controls after the
> finished result appears. `react-easy-crop` remains out of the dependency tree.
>
> `autoFrame` must still be right without input; manual positioning is a rescue
> path, not a gate before download.

**We store normalized 0..1 crop rectangles** (`FR-019`). UI values are converted by a pure function; no component or browser geometry enters renderer state.

_Why:_ pixel coordinates are implicitly relative to whichever image was fed to the cropper. If `WORKING_MAX_EDGE` ever changes, or a code path feeds a different resolution, stored pixel crops silently mean something different — the single most likely source of a "crop is subtly wrong" bug that survives review because it looks nearly right.

Three pure functions, all trivially unit-testable and all covered:

```ts
autoFrame(imageW, imageH, aspect): CropRect           // FR-017 — THE framing
frameFromControls(imageW, imageH, aspect, controls)    // FR-016 — optional adjustment
clampCrop(crop: CropRect): CropRect                  // FR-020 — bounds invariant
cropToSourceRect(crop, image): { sx, sy, sw, sh }    // normalized → drawImage args
effectiveResolution(crop, image, target): 'ok'|'soft' // FR-062
```

**The 42% vertical bias** (`FR-017`, improvement I4) is the highest-leverage line in the codebase. In portrait photographs faces sit above the geometric centre; a true centre crop routinely cuts foreheads. Biasing the frame centre to ~42% of image height produces a good result across ordinary phone photos. It costs nothing and needs no face detection (the `FaceDetector` API is Chromium-flag-only and not a real option).

Under D-9a this constant defines the zero-input result and the exact reset target. It remains the single value most deserving of attention in usability testing.

**`effectiveResolution`** implements D-6: quality is a property of the _crop_, not the source. A 4000px photo cropped to a tight 300px region cannot produce a sharp 1080px export, and the user is told so honestly rather than handed a soft image with no explanation.

---

## 10. Fonts — `features/render/fonts.ts`

Fonts are the second-most-likely cause of preview/export divergence (`R2`), and the failure is silent: the export renders in a fallback face while the preview looks correct.

**Self-hosted `@font-face` with explicit family names**, declared in `globals.css`, `.woff2` in `public/fonts/`. Deliberately _not_ `next/font`.

_Why:_ `next/font` generates a hashed family name exposed as a CSS variable. Canvas needs a literal string in `ctx.font`. Resolving a generated name at runtime to feed the canvas is fragile indirection, and it breaks the moment the build hash changes. An explicit `font-family: 'HHG Display'` is stable, greppable, and identical in CSS and canvas.
_Trade-off:_ we forfeit `next/font`'s automatic preloading and `size-adjust` fallback metrics. Compensated by hand-written `<link rel="preload">` for the two critical faces and an explicit fallback stack. Accepted knowingly.

**Loading is per-face and explicitly awaited** (`FR-043`):

```ts
const REQUIRED_FACES = [
  '700 64px "HHG Display"',
  '400 32px "HHG Text"',
  '600 32px "HHG Text"',
] as const

export async function ensureFontsReady(): Promise<void> {
  await Promise.all(REQUIRED_FACES.map((f) => document.fonts.load(f)))
}
```

`document.fonts.ready` is **not** sufficient and must not be used here. CSS font loading is lazy per face: `ready` resolves once currently-pending loads settle, which includes faces the page has not yet requested. A weight used only by the canvas may not have been requested at all when `ready` resolves. `document.fonts.load(spec)` per face is the only construct that actually guarantees the face is available before `fillText`.

Fonts are open-licence (OFL) per D-1. `ensureFontsReady()` is awaited before the first preview render and again before every export; it is cheap and idempotent after the first call.

---

## 11. Render and export — `features/render/`, `features/export/`

**The renderer is pure and synchronous.** All asynchrony is hoisted out and resolved before it is called:

```ts
// features/export/export-png.ts
export async function exportPng(model: RenderModel): Promise<ExportResult> {
  // ── async preparation: the ONLY awaits in the render path ──────────────
  const assets = await prepareRenderAssets(model.format) // FR-043, FR-044

  // ── synchronous render: deterministic, profileable, testable ───────────
  const { width, height } = DESIGN[model.format]
  const canvas = createCanvas(width, height) // Offscreen where available
  const ctx = canvas.getContext('2d', { alpha: false })!

  renderTemplate({ ctx, scale: 1 }, model, assets)

  const blob = await toBlob(canvas, 'image/png') // FR-042
  return { blob, width, height, fileName: buildFileName(model), durationMs }
}
```

The shape is the point:

```
File → validate → decode/HEIC → normalize → prepareRenderAssets
                                                    ↓
                                          [ async boundary ]
                                                    ↓
                                     renderTemplate()  ← synchronous
                                                    ↓
                                        canvas → preview or PNG
```

Everything above the boundary can await, retry, fail, and report progress. Everything below is a pure function of its inputs. That single line is what buys deterministic rendering, preview/export parity, straightforward profiling (one synchronous span to measure), lightweight recording-context tests, and a clean seam between Nitin's code and Aditya's.

A renderer that could `await` could interleave with a state change and produce a frame composed from two different models. Hoisting the asynchrony makes that unrepresentable. It also makes the renderer testable without any async machinery (§16.2).

`{ alpha: false }` gives an opaque backing store — a small compositing win and a second guarantee behind `NFR-034`.

**Assets are preloaded into `ImageBitmap`s once and cached** (`FR-044`). All are same-origin from `public/`, so the canvas is never tainted and `toBlob` cannot throw a security error (`FR-045`). No remote asset is ever drawn — which is also one of the mechanisms `NFR-037` prohibits.

**Text fitting** — `lib/canvas/fit-text.ts` implements `FR-028`/`FR-029`/`FR-030`:

```
measure at design size
  → still overflowing? step font size down toward the configured floor
  → still overflowing at floor? wrap to the configured max line count
  → still overflowing? truncate with ellipsis at a GRAPHEME boundary
```

Grapheme-safe truncation uses `Intl.Segmenter` (Safari 14.1+, Chrome 87+ — within our support matrix). Slicing by UTF-16 code unit splits emoji ZWJ sequences and Devanagari clusters, producing the exact tofu-and-clipping failure `FR-030` forbids. Floors and line limits are per-field values in the layout config, not constants in the fitting code — the algorithm is shared, the policy is per-template.

**Preview** runs the same `renderTemplate` at computed scale, coalesced into `requestAnimationFrame`, debounced ~120 ms on text input (`FR-040`). A render token guards against out-of-order completion so rapid format toggling cannot leave a stale frame (`§8` edge case).

**Download ladder** (`features/export/download.ts`) — **PROVISIONAL, gated on SPIKE-4**:

```
Blob
 ├─ mobile && canShare({files})  → Web Share (§12)
 ├─ <a download> + blob: URL     → normal path, revoke after  (FR-048)
 └─ always                       → result also rendered as a long-pressable <img>
```

The third rung is not a fallback that fires on error — it is **always present**. On iOS, `<a download>` can fail by opening a tab rather than saving, which throws nothing and returns nothing to detect. An always-visible long-press affordance means there is no device on which the user cannot obtain the file (`R6`).

---

## 12. Share — `features/share/`

**PROVISIONAL** — exact receiving-app behaviour remains gated on SPIKE-3's real-device observations (D-7). The browser-facing wording below only states what the browser can prove.

```
ExportResult
 │
 ├─ navigator.canShare?.({ files: [png], text: caption }) === true
 │     ├─ start navigator.share({ files, text }) first, in the click task
 │     ├─ start caption clipboard copy in that same task  (iOS may drop text)  FR-056
 │     ├─ resolved  → "PNG sent to the app you chose" + caption-copy result
 │     └─ dismissed → keep preview, download and copy actions visible
 │
 └─ fallback ladder
       ├─ keep the PNG preview and Download again action visible
       ├─ open about:blank synchronously, detach opener, navigate to x.com/intent/post
       ├─ popup/navigation blocked → show a real <a> + copy-caption  FR-054
       ├─ offer PNG clipboard copy where secure-context support exists
       └─ UI states plainly: "Attach the downloaded PNG before posting."
```

Three rules that are not negotiable:

**Privileged actions start synchronously inside the click handler** (`FR-053`). Safari blocks `window.open` or `navigator.share` after transient user activation is lost. The native branch starts file sharing before awaiting its parallel caption-copy promise. The fallback opens a detectable blank tab first, detaches `opener`, and only then navigates it to X; passing `noopener` directly to `window.open` makes Chromium return `null` even when the tab opened, so that return value cannot distinguish a real block.

**The caption always contains `#FrameInGoa`** (`FR-050`). `share-copy.ts` exports variants through one factory that appends the hashtag, and a unit test iterates every exported variant asserting the literal string. The submission is invalid without it; it gets a test, not a code review.

**We never claim an attachment that did not happen** (`FR-055`, master prompt §10). Each branch above states exactly what occurred. The honest branch is one sentence of UI copy and it is the difference between a product a judge trusts and one they catch lying.

---

## 13. Error taxonomy — `lib/errors/app-error.ts`

Every failure is a typed value, never a bare `throw new Error(string)`. Each code maps to specific user-facing copy and a specific recovery action (`NFR-025`, `FR-049`).

```ts
export type AppErrorCode =
  | 'FILE_TOO_LARGE'
  | 'FILE_EMPTY'
  | 'UNSUPPORTED_TYPE'
  | 'IMAGE_TOO_SMALL'
  | 'DECODE_FAILED'
  | 'HEIC_UNSUPPORTED'
  | 'CANVAS_UNAVAILABLE'
  | 'RENDER_FAILED'
  | 'EXPORT_FAILED'
  | 'SHARE_BLOCKED'
  | 'CLIPBOARD_DENIED'

export interface AppError {
  readonly code: AppErrorCode
  readonly userMessage: string // specific, names the fix. Never "Something went wrong."
  readonly recovery: 'retry' | 'choose-another-file' | 'manual' | 'none'
  readonly cause?: unknown // dev only — NEVER surfaced or transmitted (NFR-037)
}
```

Copy lives beside the code so it can be reviewed as a set — that is how "Your photo is 41 MB. The limit is 32 MB." gets written instead of "Upload failed." Errors carrying `cause` never leave the device; there is no error-reporting transport in the application at all, which is one of the mechanisms `NFR-037` names.

A React error boundary wraps the editor and offers in-place recovery without a reload (`NFR-027`).

---

## 14. Browser capability detection — `lib/browser/capabilities.ts`

Feature detection only. **No user-agent sniffing anywhere** (`NFR-028`) — UA strings lie, and a UA-conditioned code path is untestable and rots.

```ts
export const can = {
  offscreenCanvas: () => typeof OffscreenCanvas !== 'undefined',
  createImageBitmap: () => typeof createImageBitmap === 'function',
  shareFiles: (files: File[]) => !!navigator.canShare?.({ files }),
  clipboard: () => !!navigator.clipboard?.writeText,
  segmenter: () => typeof Intl?.Segmenter === 'function',
} as const
```

Each has a defined degraded path (`NFR-030`) — `HTMLCanvasElement` for `OffscreenCanvas`, `HTMLImageElement` decode, intent-only share, a selectable text field for clipboard, code-point slicing for `Segmenter`. Every degradation lands on a working path, never a broken one.

---

## 15. Design tokens — one source, drift made impossible

Tailwind v4 is CSS-first: tokens live in `@theme` in `app/globals.css`. But the canvas renderer needs the same colours as TypeScript strings, and CSS cannot be imported into a `.ts` module.

Rather than accept two hand-maintained lists, `lib/brand/palette.ts` mirrors the values **and a unit test parses `globals.css` and asserts every token matches**:

```ts
// tests/unit/token-parity.test.ts
it('palette.ts matches the @theme block in globals.css', () => {
  expect(parseThemeBlock(readFileSync('app/globals.css', 'utf8'))).toEqual(PALETTE)
})
```

Twenty lines. Turns "remember to update both" into a build failure. `styles/tokens.css` from the master prompt's structure is deliberately not created — a third location would defeat the whole arrangement.

---

## 16. Testing architecture

### 16.1 What is worth testing in six days

**Tested — pure logic, high defect probability, cheap to cover:** file validation and magic-byte sniffing · crop geometry, clamping, smart default, `effectiveResolution` · text fitting including grapheme truncation · filename sanitisation · share-copy hashtag invariant · builder-title determinism · token parity · layout config invariants (safe-region insets, floors below design sizes).

**Not tested — deliberately:** pixel golden-files. High maintenance, brittle across platforms, and forbidden in spirit by D-5 — canvas output is implementation-dependent, so a pixel test would fail for reasons unrelated to our correctness. §16.2 gets the real signal at a fraction of the cost.

**One E2E** (Playwright): upload fixture → crop → PFP → download → assert the file is a valid PNG at 1080×1080. The happy path is the submission; it gets a regression guard.

### 16.2 Testing the renderer without pixels

`lib/canvas/recording-context.ts` provides a `CanvasRenderingContext2D` stand-in that records every call with its arguments and returns plausible `measureText` metrics. Renderer tests then assert **layout decisions** rather than pixels:

```ts
it('keeps card identity content inside the safe region', () => {
  const rec = recordingContext()
  renderTemplate({ ctx: rec.ctx, scale: 1 }, cardModel({ name: 'A'.repeat(32) }), stubAssets)
  for (const call of rec.textCalls())
    expect(call.x).toBeGreaterThanOrEqual(CARD_LAYOUT.safeRegion.left)   // FR-027
})

it('shrinks a long name before wrapping, and never below the floor', () => { … })  // FR-028
```

This is exactly what D-5 asks for — verify layout decisions and rendered content, not file hashes. It runs in Node in milliseconds, needs no `node-canvas` native dependency, and is stable across every platform. It is the single highest-value testing decision in this document.

### 16.3 CI gates

`pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`. All four on every PR (GitHub Actions), plus a Vercel preview deployment. Main is always deployable (`ADITYA.md` §7).

---

## 17. Deployment

Vercel. The application is fully static — no route handlers, no server rendering of user content, no environment variables required at runtime. `.env.example` exists and is empty by design, with a comment explaining that emptiness is the point.

Every PR gets a preview URL, which is how Lavitra performs visual QA and how the team tests on real phones without a local network dance. Production is `main`. Before submission, the release commit is tagged (`ADITYA.md` §10).

Metadata, favicon, and a static hand-designed `opengraph-image.png` (S1-6) are configured in `app/layout.tsx`. There is no dynamic OG route — PRD §2.3 cut it, and D-8 is the reason it stays cut.

---

## 18. How the privacy invariant is actually enforced

`NFR-037` says "photo never leaves your device" is architectural, not marketing. Concretely:

| Mechanism                             | Status                                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Upload endpoint                       | None exists. No route handlers in `app/`.                                                      |
| Server-side rendering of user content | Impossible — renderer requires `CanvasRenderingContext2D`, never runs on server.               |
| `next/image` on user content          | Not used. User photos are canvas-only, never `<img src>` through a loader.                     |
| Third-party image / crop / face APIs  | None. Cropping is `react-easy-crop` (client), fitting is ours.                                 |
| Error reporting (Sentry etc.)         | Not installed. `AppError.cause` has no transport.                                              |
| Analytics carrying field values       | Vercel Analytics only if adopted — page-level, cookieless, no custom events with user content. |
| Fonts / assets from a CDN             | None. All same-origin from `public/` — also what keeps the canvas untainted (FR-045).          |

A PR introducing any network call capable of carrying user content requires Aditya's sign-off and an amendment to `NFR-037`. The claim is true because there is no code path that could make it false.

---

## 19. Architecture decision records

Decisions already recorded as D-1 … D-8 in `PRD.md` §13 are binding and not restated. These are the additional decisions this document introduces.

**ADR-1 — Keep PFP, Builder ID and Crew Frame in `features/render/`.** Covered in §3. _Why:_ prevents duplicated cover-fit and text-fitting logic drifting into divergent implementations. _Alternatives:_ separate features with a shared lib (shared module absorbs everything meaningful); full duplication (guaranteed drift). _Trade-off:_ one larger module needing internal discipline, imposed by the layout/draw file split. The shipped Crew Frame validated the extension point: one layout/draw pair plus one closed-union member.

**ADR-2 — Normalized crop coordinates rather than source pixels.** _Why:_ pixel coordinates are implicitly bound to a resolution; changing `WORKING_MAX_EDGE` would silently change what a stored crop means. _Alternative:_ store pixels plus the resolution they refer to — same information, more invariants to maintain by hand. _Trade-off:_ one conversion at `drawImage` time. _Future:_ export presets can change without touching crop logic.

**ADR-3 — Self-hosted `@font-face` instead of `next/font`.** Covered in §10. _Why:_ canvas needs a literal, stable family name. _Trade-off:_ manual preload and fallback metrics. _Future:_ if Next ever exposes resolved family names stably, revisit — until then this is strictly more reliable for a canvas product.

**ADR-4 — Synchronous, pure renderer.** _Why:_ an awaiting renderer can interleave with state changes and compose a frame from two models. _Alternative:_ async renderer with a cancellation token — more code, more states, same outcome. _Trade-off:_ callers must hoist font and asset loading. _Future:_ if rendering ever needs a Web Worker, a synchronous pure function is exactly what transplants cleanly. We are not doing that now — no profiling justifies it (master prompt §12).

**ADR-5 — Recording-context renderer tests over pixel golden-files.** Covered in §16.2. _Why:_ asserts layout decisions, which is what we actually control, and satisfies D-5. _Alternative:_ `node-canvas` golden images — native dependency, platform-dependent output, high maintenance, wrong use of six days. _Trade-off:_ will not catch a purely visual regression; that is Lavitra's visual QA, which is better at it than a machine.

**ADR-6 — Hand-styled UI primitives; Radix/shadcn only where accessibility is genuinely hard.** Taken for Tabs/segmented control, Dialog, and Toast; declined for buttons, inputs, cards. _Why:_ the brand is thick ink outlines and retro poster treatment — shadcn defaults would be overridden almost entirely, leaving dependency weight and no benefit. Where correct keyboard and ARIA semantics are hard to get right under time pressure, Radix earns its place. _Consistent with_ the locked stack's "shadcn/ui where useful."

**ADR-7 — `features/render/` is the only module allowed to know about output dimensions.** `DESIGN` is defined there and imported elsewhere; no component hard-codes 1080. _Why:_ dimensions appear in filenames, previews, quality warnings, and tests — four places that must never disagree.

---

## 20. Provisional items and their gates

Spike numbering is canonical per `PRD.md` §11.1 as amended 7 Aug 2026, and matches `docs/spikes/` and the `/spikes` harness.

| Section                                                             | Provisional on | Harness          | Closes |
| ------------------------------------------------------------------- | -------------- | ---------------- | ------ |
| §7 native-decode-first ordering                                     | SPIKE-1        | `/spikes/heic`   | End D0 |
| §6 DPR cap / §7 2400px working cap validated on device              | SPIKE-2        | `/spikes/canvas` | End D0 |
| §12 Web Share file+text behaviour, UI copy, §11 iOS download ladder | SPIKE-3        | `/spikes/share`  | End D0 |
| §10 per-face font loading, §11 asset preparation                    | SPIKE-4        | `/spikes/fonts`  | End D0 |

Spike results land in `docs/SPIKE_RESULTS.md`; this document is amended the same day. **No implementation depends on a provisional path before its spike closes** — Slice 1 (D1) needs decode and render, both of which have working non-provisional fallbacks.

---

## 21. Ownership

| Area                                                                                       | Owner                       | Contract |
| ------------------------------------------------------------------------------------------ | --------------------------- | -------- |
| `lib/image/`, `lib/canvas/`, `features/render/`, `features/export/`, `features/share/`     | Aditya                      | §5       |
| `app/`, `components/`, `features/{editor,upload,crop}/components`, forms, responsive, a11y | Nitin                       | §5       |
| Layout configs (`*.layout.ts` values), tokens, assets, copy                                | Lavitra → Aditya implements | §6, §15  |
| Spikes, CI, deployment, release                                                            | Aditya                      | §17, §20 |

Nitin builds against §5 from Day 1 without waiting for the engine — a stub `renderTemplate` that draws a placeholder rectangle satisfies the contract and unblocks the entire shell.

---

## 22. Sign-off

| Role                                                              | Owner   | Approved |
| ----------------------------------------------------------------- | ------- | -------- |
| Architecture (final)                                              | Aditya  | ☐        |
| Frontend feasibility — §5 contract is sufficient to build against | Nitin   | ☐        |
| Design feasibility — §6 design-space model works for handoff      | Lavitra | ☐        |

_Next document: `docs/DESIGN_SYSTEM.md`._
