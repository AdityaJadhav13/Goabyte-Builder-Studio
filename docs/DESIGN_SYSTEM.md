# DESIGN SYSTEM — Builder Studio by GoaByte

**Version:** v0.1 · 7 August 2026
**Owner:** Lavitra (design) · Aditya (token implementation) · Nitin (component implementation)
**Implements:** `PRD.md` v0.2 · Binding decisions D-1 (brand), D-2 (canvas preview), D-4 (card format)
**Token source of truth:** `app/globals.css` `@theme` block. Nothing else. See `ARCHITECTURE.md` §15.

---

## 1. Brand position

**Builder Studio is an independent project by team GoaByte. It is not an official Hacker House Goa product and must never imply that it is.** (D-1, amended by D-1a)

> **Update, 8 Aug 2026 — permission granted (D-1a).** Hacker House Goa branding and artwork are explicitly available for participant use. Organiser artwork may now be used; the constraints below on _impersonation_ still hold in full. Using their art does not make us official, and the footer states plainly what this is.

That constraint shapes the whole system:

- hhgoa.com is **visual reference only**. Visual access is not a licence.
- We do not reuse their fonts, logo, wordmark, illustrations, or artwork.
- Organizer-supplied assets are used **only** where explicitly made available for participant use.
- Everything here is original work using open-licensed (OFL) typefaces.
- A quiet attribution line appears in the footer: _"An independent project by team GoaByte. Not an official Hacker House Goa product."_

**On the exported graphics specifically:** the output celebrates the event without impersonating its organisers. It reads as _"I am building for Hacker House Goa 2026"_ — a participant's statement — not as an official credential. This is a design requirement, not just a legal one: a fake-official badge is worse product design _and_ worse ethics than an honest participant badge, and a judge will spot the difference immediately.

## 2. Visual direction

**Goa retro-editorial poster.** Deep tropical green as the dominant surface, cream paper cards floating on it, thick ink keylines, hard offset shadows instead of soft blur, bold editorial serif headlines against wide-tracked condensed labels, and restrained tropical motifs used as punctuation rather than wallpaper.

The feeling to aim for is a **well-printed event poster**, not a web app. Structure over ornament. Where a decision is ambiguous, choose the one that looks printed.

### Explicitly rejected

| Rejected                    | Why it would hurt us                                                |
| --------------------------- | ------------------------------------------------------------------- |
| Generic SaaS dashboard      | The brief calls it out by name. Instantly reads as a template.      |
| Blue/purple AI gradients    | The single most common visual cliché in AI-adjacent submissions.    |
| Crypto neon, dark cyberpunk | Wrong event, wrong region, wrong feeling.                           |
| Glassmorphism everywhere    | Dates the work and fights the print aesthetic.                      |
| Soft blurred drop shadows   | Reads as Material Design. We use **hard offset shadows**.           |
| Pill-shaped everything      | Bootstrap tell. Radii stay tight (≤8px).                            |
| Stock tropical photography  | Illustration and colour carry the Goa reference, not stock imagery. |

## 3. Colour

### 3.1 Tokens

Defined once in `app/globals.css`. Mirrored in `lib/brand/palette.ts` for the canvas renderer, with `tests/unit/token-parity.test.ts` failing the build if they drift.

| Token        | Hex       | Role                                                             |
| ------------ | --------- | ---------------------------------------------------------------- |
| `ink`        | `#14110e` | Warm black. Keylines, body text on light surfaces, hard shadows. |
| `cream`      | `#f7efe1` | Paper. Card surfaces, primary text on green.                     |
| `cream-dim`  | `#eadfcb` | Secondary text on green, muted paper.                            |
| `sand`       | `#e8d9bc` | Tertiary paper, texture base.                                    |
| `green-900`  | `#05221a` | Deepest surface, insets, footer bars.                            |
| `green-800`  | `#0a3527` | **Primary brand surface.** Page background.                      |
| `green-700`  | `#0f4a35` | Raised green surfaces.                                           |
| `green-600`  | `#16674a` | Borders and dividers on green.                                   |
| `yellow`     | `#f9c22e` | **Primary emphasis.** CTAs, focus rings, highlights.             |
| `yellow-dim` | `#e0a91b` | Pressed CTA, secondary emphasis.                                 |
| `pink`       | `#ef3e76` | **Display accent only.** See §3.3.                               |
| `pink-dim`   | `#d22a60` | Error accent on light surfaces.                                  |

### 3.2 Measured contrast

Computed, not estimated. Verified on every test run by `tests/unit/token-parity.test.ts`.

| Foreground   | Background    | Ratio     | Verdict     |
| ------------ | ------------- | --------- | ----------- |
| ink          | cream         | **16.47** | AAA         |
| ink          | sand          | 13.51     | AAA         |
| ink          | yellow        | 11.45     | AAA         |
| cream        | green-900     | 14.71     | AAA         |
| cream        | green-800     | 11.85     | AAA         |
| cream        | green-700     | 8.96      | AAA         |
| cream        | green-600     | 5.98      | AA          |
| yellow       | green-900     | 10.23     | AAA         |
| yellow       | green-800     | 8.24      | AAA         |
| yellow       | green-700     | 6.23      | AA          |
| cream-dim    | green-800     | 10.26     | AAA         |
| yellow-dim   | green-800     | 6.36      | AA          |
| ink          | pink          | 5.04      | AA          |
| **pink**     | **green-900** | **4.50**  | AA-large ⚠️ |
| **yellow**   | **green-600** | **4.16**  | AA-large ⚠️ |
| **pink-dim** | **cream**     | **4.34**  | AA-large ⚠️ |
| **pink**     | **green-800** | **3.62**  | AA-large ⚠️ |
| **cream**    | **pink**      | **3.27**  | AA-large ⚠️ |

### 3.3 The pink rule

NFR-014 predicted that a Goa-poster palette would fail contrast somewhere. It does, and this is where.

> **Pink is a display colour. It is never used for body text.**
>
> - ❌ `pink` text on any green — 3.62:1, fails AA.
> - ❌ `cream` text on a `pink` surface — 3.27:1, fails AA.
> - ✅ `ink` text on a `pink` surface — 5.04:1, passes.
> - ✅ `pink` at ≥24px, or ≥19px bold, on `green-900` — passes AA-large.
>
> **Pink surfaces carry ink text. Always.**

Pink's job is shape and energy: chips, rules, corner marks, underlines, the sun motif, oversized display numerals. Not paragraphs.

The same restriction applies to `yellow` on `green-600` — a pairing that looks fine and measures 4.16. Body text on `green-600` must be `cream`.

### 3.4 Error colour

Because `pink-dim` on `cream` is only 4.34:1, error **text** is `ink`. Pink appears as a 3px left rule and the icon. This satisfies NFR-014 and also NFR-019's requirement that errors are indicated by more than colour alone — the rule, the icon, and the text are three independent signals.

## 4. Typography

### 4.1 Families

Two families, three faces. Both SIL Open Font License 1.1 (D-1), self-hosted from `public/fonts/`.

| Role      | Family               | Faces    | Why                                                                                                                                           |
| --------- | -------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Display   | **Instrument Serif** | 400      | High-contrast editorial serif. Carries the poster/magazine feeling at large sizes without looking like a wedding invitation.                  |
| Text / UI | **Archivo**          | 500, 700 | Grotesque with tight, even colour. Wide-tracked uppercase 700 gives the condensed-label poster voice; 500 is a workhorse for body and inputs. |

**Three faces total, deliberately.** Every face is a canvas font-loading obligation (FR-043) and a bundle cost. `REQUIRED_FACES` in `features/render/fonts.ts` must list exactly these:

```
'400 64px "HHG Display"'
'500 32px "HHG Text"'
'700 32px "HHG Text"'
```

Instrument Serif ships Regular only, which is why display weight is 400 — a high-contrast serif at 88px does not need bold, and faking one with `ctx.strokeText` would look wrong.

Self-hosted with explicit `@font-face` family names (`HHG Display`, `HHG Text`), **not** `next/font` — ADR-3. Canvas needs a stable literal family string.

**Licence files ship alongside the fonts** in `public/fonts/OFL.txt`. A repository that uses OFL fonts without the licence is a small, avoidable professionalism failure that a careful reviewer will notice.

### 4.2 Scale — UI

| Token        | Size / line-height                   | Face        | Use                    |
| ------------ | ------------------------------------ | ----------- | ---------------------- |
| `display-xl` | 56 / 0.95                            | Display 400 | Landing h1 (mobile 40) |
| `display-lg` | 40 / 1.0                             | Display 400 | Section headings       |
| `label`      | 12 / 1.2, tracking 0.18em, uppercase | Text 700    | Eyebrows, chips, meta  |
| `body-lg`    | 18 / 1.5                             | Text 500    | Lead paragraph         |
| `body`       | 16 / 1.5                             | Text 500    | Default                |
| `body-sm`    | 14 / 1.45                            | Text 500    | Helper, captions       |
| `button`     | 16 / 1, tracking 0.02em              | Text 700    | All buttons            |

Minimum on-screen text size is **14px**. Nothing smaller ships (NFR-014, Lavitra §9).

### 4.3 Scale — export templates

These are **design-space units** (§6), not CSS pixels, and they become values in `*.layout.ts`.

| Element            | Face        | Design size         | Floor | Max lines |
| ------------------ | ----------- | ------------------- | ----- | --------- |
| Card name          | Display 400 | 88                  | 56    | 2         |
| Card role          | Text 500    | 34                  | 26    | 2         |
| Card builder title | Text 700    | 26                  | 22    | 1         |
| Event lockup       | Text 700    | 24, tracking 0.18em | —     | 1         |
| PFP lockup         | Text 700    | 40, tracking 0.16em | —     | 1         |

Floors are the point at which `fit-text.ts` stops shrinking and starts wrapping, then truncating (FR-028, FR-029). They are set where the type stops being comfortably readable on a phone screen — below 56 the card name starts competing with the role for hierarchy, and below 26 the role becomes hard to read at timeline scale.

## 5. Space, shape, depth

**Spacing scale** (4px base): `4, 8, 12, 16, 24, 32, 48, 64, 96`. Nothing off-scale.

**Radii:** `none 0` · `sm 2` · `md 4` · `lg 8`. Nothing larger, nothing pill-shaped. Print does not have rounded corners.

**Borders:** `hair 1px` · `ink 2px` (default) · `bold 3px` (dropzone, active states). Ink borders are the defining structural motif — they do the work that shadows do in a typical SaaS UI.

**Shadows:** hard offset only.

```css
shadow-ink-sm  →  2px 2px 0 0 ink
shadow-ink     →  4px 4px 0 0 ink
```

No blur radius, ever. A blurred shadow anywhere in this product is a bug.

**Motion:** 120–200ms, `ease-out`. Buttons translate 2px toward their shadow on press. Everything disabled under `prefers-reduced-motion` (NFR-020).

## 6. Export template specifications

Both templates are authored in **design units** — 1080 wide. The renderer applies one transform; preview and export differ only by scale (D-2, `ARCHITECTURE.md` §6). Every number below becomes a named field in a `*.layout.ts` config. **No magic numbers in draw code.**

### 6.1 PFP — 1080 × 1080 (FR-021)

```
┌──────────────────────────────────────────┐ ← 20px ink keyline, full bleed
│  ╭────────────────────────────────╮ ☀   │   sun mark: r=60 @ (960,120), yellow
│  │                                │      │
│  │        PHOTO (full bleed)      │      │
│  │                                │      │
│  │     ┌ ─ ─ ─ ─ ─ ─ ─ ─ ┐        │      │   SUBJECT SAFE ZONE
│  │     │  circle r=330    │       │      │   centre (540, 470)
│  │     │  centre 540,470  │       │      │   nothing drawn inside
│  │     └ ─ ─ ─ ─ ─ ─ ─ ─ ┘        │      │
│  │                                │      │
│  ╰────────────────────────────────╯      │
├──────────────────────────────────────────┤ ← lockup bar, green-800
│  HACKER HOUSE GOA · 2026                 │   y 912→1080, h 168
└──────────────────────────────────────────┘   text 40px Text-700, cream + yellow "2026"
```

| Property          | Value                                                                        |
| ----------------- | ---------------------------------------------------------------------------- |
| Canvas            | 1080 × 1080                                                                  |
| Outer keyline     | 20px `ink`, inset 0                                                          |
| Photo area        | full bleed, cover-fit                                                        |
| Subject safe zone | circle, centre (540, 470), r 330 — **no graphic element may enter** (FR-023) |
| Lockup bar        | y 912→1080, `green-800`, 3px `ink` top rule                                  |
| Lockup text       | 40px Text-700, tracking 0.16em, `cream`; "2026" in `yellow`                  |
| Sun mark          | circle r 60 @ (960, 120), `yellow`, 3px `ink` stroke                         |

**Thumbnail behaviour (FR-024).** At 48×48 the lockup text is illegible — that is expected and fine. What must survive is the **silhouette**: dark band along the bottom, yellow dot top-right, ink keyline. Those three shapes make it identifiable as an HH Goa frame at avatar size. Design for the shape, not the text.

The safe zone is why the bar sits at the bottom rather than wrapping all four sides: a full border eats into the face on the tight square crops most people will produce.

### 6.2 Builder ID Card — 1080 × 1350 (FR-025, D-4)

```
┌────────────────────────────────────────┐  margin 64
│ ▓ HACKER HOUSE GOA 2026        ☀       │  eyebrow y=96, 24px Text-700
│ ┌────────────────────────────────────┐ │
│ │                                    │ │  PHOTO
│ │           952 × 760                │ │  x 64, y 152, w 952, h 760
│ │                                    │ │  cover-fit, 3px ink border
│ └────────────────────────────────────┘ │
│                                        │
│  Aditya Jadhav                         │  NAME  y 1000, Display 88/56, ≤2 lines
│  Backend · Architecture                │  ROLE  y 1080, Text-500 34/26, ≤2 lines
│                                        │
│  ▰ SHIPS ON DEADLINE ▰                 │  TITLE chip y 1150, pink fill + INK text
│                                        │
├────────────────────────────────────────┤
│  builderstudio.goabyte              ▓  │  footer y 1254→1350, green-900
└────────────────────────────────────────┘
```

| Property                         | Value                                                               |
| -------------------------------- | ------------------------------------------------------------------- |
| Canvas                           | 1080 × 1350                                                         |
| Page margin                      | 64                                                                  |
| **Central safe region (FR-027)** | inset 80 on all sides — photo, name, and role stay inside           |
| Photo                            | x 64, y 152, w 952, h 760 (≈5:4), cover-fit, 3px `ink` border       |
| Name                             | baseline y 1000, Display 400 @ 88 → floor 56, max 2 lines, `cream`  |
| Role                             | baseline y 1080, Text 500 @ 34 → floor 26, max 2 lines, `cream-dim` |
| Title chip                       | y 1150, `pink` fill, 2px `ink` border, **`ink` text** @ 26 Text-700 |
| Footer                           | y 1254→1350, `green-900`, 3px `ink` top rule                        |
| Surface                          | `green-800`                                                         |

**Crop aspect for the card photo is 5:4** (952:760), which is why `crops` is keyed per format — switching PFP ↔ card cannot reuse a 1:1 crop (FR-019, FR-058).

**The title chip is `ink` on `pink`, never `cream` on `pink`.** §3.3. This is the single pairing most likely to be got wrong by someone working from a screenshot.

**On FR-027's safe region:** the 80px inset is justified by durable concerns — UI overlays, repost framing, embeds, thumbnail crops, and future platform changes — not by any one platform's current behaviour (D-4). It costs almost nothing and survives changes we cannot predict.

**When the builder title is empty** (FR-033): the chip is omitted and the footer rule moves up by 96 design units. The layout reflows; it does not leave a gap. This case must be in the recording-context tests.

## 7. Components

Every component ships **default / hover / focus / disabled**, plus **error** where applicable.

| Component            | Spec                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Primary button**   | `yellow` fill, 2px `ink` border, `ink` text 16/700, `shadow-ink-sm`. Press: translate 2px into shadow, `yellow-dim`. Disabled: 40% opacity, no shadow, `not-allowed`. Min height 48. |
| **Secondary button** | transparent, 2px `cream-dim` border, `cream` text. Hover: `yellow` border and text.                                                                                                  |
| **Icon button**      | 44×44 minimum (NFR-010), 2px border, `md` radius.                                                                                                                                    |
| **Dropzone**         | 3px dashed `cream-dim/40`, `green-700` fill, min-height 220. Drag-active: `yellow` solid border, `green-700` fill. Keyboard focusable with visible ring (NFR-016).                   |
| **Text input**       | `cream` fill, 2px `ink` border, `ink` text, `sm` radius, height 48. Focus: 3px `yellow` outline offset 2. Error: 3px `pink-dim` left rule + `ink` message + icon.                    |
| **Format selector**  | Segmented, 2px `ink` border, `cream` track. Active segment: `yellow` fill, `ink` text. Radix ToggleGroup (ADR-6) for keyboard semantics.                                             |
| **Preview frame**    | `cream` card, 2px `ink` border, `shadow-ink`, 24 padding. Canvas inside gets `role="img"` and a generated `aria-label` (FR-041) — the accessibility cost of D-2, paid explicitly.    |
| **Toast**            | `cream` fill, 2px `ink` border, `shadow-ink`, `ink` text. Bottom on mobile respecting safe-area inset, bottom-right on desktop.                                                      |
| **Inline error**     | see §3.4 — 3px `pink-dim` rule, icon, `ink` text. Never colour alone.                                                                                                                |
| **Loading**          | Determinate label over spinner where the stage is known ("Converting your iPhone photo…"). A user must never wonder whether the app is frozen (`NITIN.md` §4).                       |

## 8. Responsive

| Breakpoint         | Layout                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **375** (baseline) | Single column, 20px gutters. Primary CTA above the fold. Cropper 320 tall. Actions in a sticky bottom bar respecting `safe-area-inset-bottom`. |
| **390–430**        | As 375 with 24px gutters.                                                                                                                      |
| **768**            | Single column, max-width 640, centred. Cropper 420 tall.                                                                                       |
| **1024+**          | Two columns: editor left (min 420), preview right (sticky). Max-width 1120.                                                                    |

Rules that hold at every width: no horizontal scroll (NFR-009); tap targets ≥44px (NFR-010); with the keyboard open, the focused input **and** the primary action stay visible (NFR-011).

Mobile is not a compressed desktop. The 375 layout is the design; wider viewports are the adaptation.

## 9. Copy

**Tone:** confident, builder-to-builder, concise. Playful in word choice, never in clarity. No exclamation marks in error states.

| Surface          | Copy                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Eyebrow          | GOABYTE · HACKER HOUSE GOA 2026                                                                |
| H1               | Builder Studio                                                                                 |
| Sub              | Create your Hacker House Goa 2026 identity.                                                    |
| Lead             | Upload a photo. Get a frame or a Builder ID. Post it with #FrameInGoa.                         |
| Privacy          | Your photo never leaves your device.                                                           |
| Upload CTA       | Choose a photo                                                                                 |
| Upload hint      | JPG, PNG or HEIC · up to 32 MB                                                                 |
| Converting       | Converting your iPhone photo…                                                                  |
| Crop helper      | Drag to reposition. Pinch or scroll to zoom.                                                   |
| Name label       | Your name                                                                                      |
| Role label       | What you build                                                                                 |
| Role placeholder | Backend · Architecture                                                                         |
| Title label      | Builder title _(optional)_                                                                     |
| Generate         | Generate                                                                                       |
| Download         | Download PNG                                                                                   |
| Share            | Share to X                                                                                     |
| Start over       | Start over                                                                                     |
| Error — type     | That file type isn't supported. Try a JPG, PNG or HEIC.                                        |
| Error — size     | That photo is {size}. The limit is 32 MB.                                                      |
| Error — small    | That photo is {w}×{h}. We need at least 256×256 for a sharp result.                            |
| Error — HEIC     | Your browser can't read HEIC files. Open the photo in Photos, share it as JPEG, and try again. |
| Error — decode   | We couldn't read that photo. Try another one.                                                  |
| Error — render   | Something went wrong generating your image. Try again.                                         |
| Soft quality     | This crop is quite tight — the result may look soft. Zoom out for a sharper image.             |

### 9.1 Share copy — all variants contain `#FrameInGoa`

Enforced by unit test over every exported variant (FR-050). **Default is V1.**

- **V1** — `Just made my Hacker House Goa 2026 builder identity. #FrameInGoa`
- **V2** — `Locked in for Hacker House Goa 2026. Building in Goa this October. #FrameInGoa`
- **V3** — `New profile picture, same mission. See you in Goa. #FrameInGoa`

The hashtag is appended by a single factory function so no variant can be authored without it.

**The sentence that states what happened is set by SPIKE-3, not by this document.** It must match observed device behaviour (FR-055). Candidates are enumerated in `docs/spikes/SPIKE-3-WEB-SHARE.md` §9.

## 10. Asset handoff

| Asset            | Path                                     | Format | Size      | Notes                                          |
| ---------------- | ---------------------------------------- | ------ | --------- | ---------------------------------------------- |
| Display font     | `public/fonts/hhg-display.woff2`         | woff2  | —         | Instrument Serif 400, subset latin + latin-ext |
| Text font 500    | `public/fonts/hhg-text-500.woff2`        | woff2  | —         | Archivo 500                                    |
| Text font 700    | `public/fonts/hhg-text-700.woff2`        | woff2  | —         | Archivo 700                                    |
| Font licence     | `public/fonts/OFL.txt`                   | txt    | —         | **Required.**                                  |
| Sun mark         | `public/frames/hhg-sun-mark.svg`         | SVG    | 120×120   | Flat, no gradients                             |
| PFP lockup bar   | `public/frames/hhg-pfp-lockup.svg`       | SVG    | 1080×168  | Text outlined                                  |
| Card corner palm | `public/card-assets/hhg-corner-palm.svg` | SVG    | 240×240   | Optional, ≤8% coverage                         |
| Paper texture    | `public/textures/hhg-paper.webp`         | WebP   | 1080×1080 | ≤40 KB, tiles cleanly                          |
| OG image         | `app/opengraph-image.png`                | PNG    | 1200×630  | Static, hand-designed (S1-6)                   |

**Rules:** meaningful filenames, no `final2` (Lavitra §7). All assets **same-origin** — a remote asset taints the canvas and breaks export (FR-045), and is also prohibited by NFR-037. SVGs flat and outlined; a font referenced inside an SVG will not render on canvas.

## 11. Design QA checklist

Measurable corrections only — never "looks slightly off" (Lavitra §10).

- [ ] Spacing values are on the 4px scale
- [ ] No blurred shadows anywhere
- [ ] No radius above 8px
- [ ] Pink never used for body text (§3.3)
- [ ] Pink surfaces carry ink text
- [ ] Every interactive element has a visible focus ring
- [ ] Tap targets ≥44px
- [ ] No text below 14px on screen
- [ ] No horizontal scroll at 320/375/390/768/1024/1280
- [ ] Errors show icon + rule + text, not colour alone
- [ ] PFP subject safe zone is clear of graphics
- [ ] PFP identifiable at 48×48
- [ ] Card critical content inside the 80px safe region
- [ ] Long name, emoji name, Devanagari name all render correctly
- [ ] Empty builder title reflows without a gap
- [ ] Preview matches export at matched scale

## 12. Open design decisions

| #    | Question                                                        | Default                                                                                | Needed by |
| ---- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------- |
| DQ-1 | One PFP frame concept or two variants (S1-3)?                   | Ship one excellent concept; second only if P0 is green                                 | D2        |
| DQ-2 | Paper texture on the card, or flat?                             | Flat. Texture is a P1 refinement — it costs bytes and can look muddy at timeline scale | D3        |
| DQ-3 | Is the corner palm motif needed, or does the sun mark carry it? | Sun mark alone. Do not overcrowd the PFP (Lavitra §3)                                  | D2        |
| DQ-4 | Builder-title list content — who writes the ~20 options?        | Lavitra drafts, Aditya reviews for tone                                                | D3        |

---

_Next document: `docs/IMAGE_ENGINE.md`, then `QA_PLAN.md`._
