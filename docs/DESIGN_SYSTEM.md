# DESIGN SYSTEM — Builder Studio by GoaByte

**Version:** v0.2 · 10 August 2026
**Owner:** Lavitra (design) · Aditya (token implementation) · Nitin (component implementation)
**Implements:** `PRD.md` v0.3 · Binding decisions D-1a (brand permission), D-2 (canvas preview), D-4 (card format), D-10 (two-sided card)
**Token source of truth:** `app/globals.css` `@theme` block. Nothing else. See `ARCHITECTURE.md` §15.

---

## 1. Brand position

**Builder Studio is an independent project by team GoaByte. It is not an official Hacker House Goa product and must never imply that it is.** (D-1, amended by D-1a)

> **Update, 8 Aug 2026 — permission granted (D-1a).** Hacker House Goa branding and artwork are explicitly available for participant use. Organiser artwork may now be used; the constraints below on _impersonation_ still hold in full. Using their art does not make us official, and the footer states plainly what this is.

That constraint shapes the whole system:

- Event branding and organiser-supplied artwork are used only under the participant permission recorded by D-1a; unrelated site assets are not scraped or copied.
- Export compositions, poster motifs and the reverse-side crew-builder mascot are original work; the mascot is drawn from Canvas geometry and has no external character asset.
- Typefaces remain open-licensed (OFL) and self-hosted.
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

| Role      | Family               | Faces            | Why                                                                                                                          |
| --------- | -------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Display   | **Instrument Serif** | 400              | High-contrast editorial serif. Carries the poster/magazine feeling at large sizes without looking like a wedding invitation. |
| Text / UI | **Archivo**          | 100–900 variable | Grotesque with tight, even colour. Wide-tracked 700–800 gives the poster-label voice; medium weights handle body and inputs. |

**Two local font files, four renderer face requests.** Every Canvas family/weight is an explicit loading obligation (FR-043). `REQUIRED_FACES` in `features/render/fonts.ts` lists:

```
'400 64px "HHG Display"'
'700 32px "HHG Text"'
'750 32px "HHG Text"'
'800 32px "HHG Text"'
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

| Element                 | Face        | Design size | Floor | Max lines |
| ----------------------- | ----------- | ----------- | ----- | --------- |
| Builder front name      | Text 750    | 35          | 20    | 1         |
| Builder front role/team | Text 750    | 31          | 20    | 1         |
| Builder front title     | Text 800    | 21          | 16    | 1         |
| Builder back name       | Display 400 | 86          | 50    | 1         |
| Builder back title      | Text 800    | 34          | 20    | 1         |
| Builder back event      | Display 400 | 49          | 38    | 1         |
| PFP lockup              | Display 400 | 58          | 38    | 1         |
| Crew event lockup       | Display 400 | 78          | 54    | 1         |

Floors are the point at which `fit-text.ts` stops shrinking and starts grapheme-safe truncation (FR-028, FR-029). Front and back policy remains in their layout configs even though the fitting algorithm is shared.

## 5. Space, shape, depth

**Spacing scale** (4px base): `4, 8, 12, 16, 24, 32, 48, 64, 96`. Nothing off-scale.

**Radii:** `none 0` · `sm 2` · `md 4` · `lg 8` are the normal UI scale. The 12px flip button and 16px preview frame are deliberate touch/preview exceptions; export apertures and mascot geometry use named design-space radii. Nothing becomes a generic pill.

**Borders:** `hair 1px` · `ink 2px` (default) · `bold 3px` (dropzone, active states). Ink borders are the defining structural motif — they do the work that shadows do in a typical SaaS UI.

**Shadows:** hard offset only.

```css
shadow-ink-sm  →  2px 2px 0 0 ink
shadow-ink     →  4px 4px 0 0 ink
```

No blur radius, ever. A blurred shadow anywhere in this product is a bug.

**Motion:** ordinary UI feedback is 120–200ms, `ease-out`; buttons translate 2px toward their shadow on press. The one deliberate exception is the Builder ID's physical front/back flip: 480ms with a restrained custom easing curve. Under `prefers-reduced-motion`, its transition becomes `none` while the side change remains immediate and operable (NFR-020).

## 6. Export template specifications

All export formats are authored in **design units**. PFP is 1080 wide, both Builder ID faces share one 1080×1350 design space, and Crew Frame is 2048×1362. The renderer applies one transform; preview and export differ only by scale (D-2, `ARCHITECTURE.md` §6). Every coordinate below is a named field in a `*.layout.ts` config. **No magic numbers in draw code.**

### 6.1 PFP — 1080 × 1080 (FR-021)

One frame catalog drives the picker and renderer. The three original treatments are **Coastal postcard**, **Midnight Goa**, and **Heritage portal**; each supplies a same-origin, text-free plate plus its aperture, ink and accent registration.

| Property          | Shipped rule                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| Canvas            | 1080 × 1080                                                                                       |
| Photo             | Automatic cover-fit inside the selected circular or rounded-rectangle aperture                    |
| Campaign lockup   | Full `HACKER HOUSE GOA 2026`, fitted to one line; `GOABYTE · MAKER EDITION` below                 |
| Footer            | `BUILD · CONNECT · GROW` plus full event lockup and `#FrameInGoa`                                 |
| Text provenance   | Drawn by Canvas from layout data, never baked into the decorative plate                           |
| Thumbnail promise | Face/aperture and high-contrast plate silhouette remain recognisable at 48×48; micro-copy may not |

The full event name is non-negotiable. An abbreviated `HH GOA 2026` label is not a substitute on any PFP variant.

### 6.2 Builder ID front — 1080 × 1350 (FR-025, D-4)

The front remains the production lanyard-style photo credential.

| Property     | Shipped registration                                                                       |
| ------------ | ------------------------------------------------------------------------------------------ |
| Canvas       | 1080 × 1350; safe region x 52→1028, y 38→1326                                              |
| Header       | `HACKER HOUSE` / `GOA 2026` plus `BUILDER AT HACKER HOUSE GOA 2026`                        |
| Photo        | x 145, y 315, w 530, h 590; rounded aperture and cream keyline; automatic portrait framing |
| Title        | Yellow/ink chip at x 128, y 922, max w 420; canonical label only, auto-fit to one line     |
| Identity     | Name, stack/role and crew/team at x 134 with independent one-line fitting                  |
| Verification | Real Canvas QR at x 786, y 1045, size 188; `SCAN THE BUILD` and `28–31 OCT · GOA`          |
| Footer       | `BUILD · CONNECT · SHIP · #FrameInGoa`                                                     |

The card's normalized framing entry is separate from PFP and Crew because its photo well is portrait (approximately 560:625), not square. Automatic framing remains the default; optional X/Y/zoom controls never become a required crop step.

### 6.3 Builder ID back — 1080 × 1350 (FR-067, FR-068)

The reverse is the collectible poster face of the same credential, not a second web screen.

| Property         | Shipped registration                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| Canvas           | 1080 × 1350; equal to front; safe region x 56→1024, y 42→1308                                                   |
| Header           | `HACKER HOUSE GOA` plus the adjacent `2026` chip; together they carry the full campaign identity                |
| Mascot region    | x 270, y 250, w 540, h 565; original crew-builder astronaut over yellow sun and pink offset shadow              |
| Personalization  | Builder name region x 88, y 838, w 904, h 100; canonical title region x 126, y 956, w 828, h 82                 |
| Poster language  | `CREW BUILDER // IDENTIFIED`, `BUILD · SHIP · GOA`, `#FrameInGoa`                                               |
| Attribution      | `GOABYTE BUILDER STUDIO · GOA, INDIA` in an ink-on-pink footer plaque                                           |
| Tropical system  | Palms, waves, sun, halftone and sparkles using the shared green/yellow/pink/cream/ink palette                   |
| Asset provenance | Mascot and motifs are original Canvas paths/primitives; no downloaded character art, external image or AI asset |

Name and title use the shared grapheme-safe fitting utility. Missing title falls back to the generic `BUILDER` label, so the reverse never contains an empty identity plaque.

### 6.4 Flip presentation and campaign invariant

The two Canvas faces sit in an equal 4:5 CSS perspective shell. A webpage button immediately below the card reads **Flip to Back** or **Flip to Front**. The 480ms Y-axis transition uses `backface-visibility`; reduced-motion users get the same state change without a transition. The control never overlaps the card, never changes its reserved height, and is structurally unavailable to PNG export.

The literal **HACKER HOUSE GOA 2026** identity must appear in every generated family:

| Format        | Size      | Campaign treatment                                                         |
| ------------- | --------- | -------------------------------------------------------------------------- |
| PFP           | 1080×1080 | Full fitted lockup on every frame variant                                  |
| Builder front | 1080×1350 | Two-line masthead plus full metadata line                                  |
| Builder back  | 1080×1350 | Event name and adjacent year chip                                          |
| Crew Frame    | 2048×1362 | Full fitted header above team name, 1–4 portraits and `#FrameInGoa` footer |

## 7. Components

Every component ships **default / hover / focus / disabled**, plus **error** where applicable.

| Component            | Spec                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Primary button**   | `yellow` fill, 2px `ink` border, `ink` text 16/700, `shadow-ink-sm`. Press: translate 2px into shadow, `yellow-dim`. Disabled: 40% opacity, no shadow, `not-allowed`. Min height 48. |
| **Secondary button** | transparent, 2px `cream-dim` border, `cream` text. Hover: `yellow` border and text.                                                                                                  |
| **Icon button**      | 44×44 minimum (NFR-010), 2px border, `md` radius.                                                                                                                                    |
| **Dropzone**         | 3px dashed `cream-dim/40`, `green-700` fill, min-height 220. Drag-active: `yellow` solid border, `green-700` fill. Keyboard focusable with visible ring (NFR-016).                   |
| **Text input**       | `cream` fill, 2px `ink` border, `ink` text, `sm` radius, height 48. Focus: 3px `yellow` outline offset 2. Error: 3px `pink-dim` left rule + `ink` message + icon.                    |
| **Format selector**  | Native radio group in a segmented 2px `ink`/`cream` track. Active segment: `yellow` fill and `ink` text; platform keyboard semantics, no component dependency.                       |
| **Preview frame**    | `cream` card, 2px `ink` border, `shadow-ink`, 24 padding. Canvas inside gets `role="img"` and a generated `aria-label` (FR-041) — the accessibility cost of D-2, paid explicitly.    |
| **Card flip shell**  | Equal 4:5 faces in a 1200px CSS perspective. Front and back are real canvases; hidden face is `aria-hidden`. No hover-only or draggable behavior.                                    |
| **Flip button**      | Existing native secondary Button directly below the card, min 48px high, pink surface with ink text and yellow hard shadow. Label and `aria-pressed` follow the visible side.        |
| **Inline error**     | see §3.4 — 3px `pink-dim` rule, icon, `ink` text. Never colour alone.                                                                                                                |
| **Loading**          | Determinate label over spinner where the stage is known ("Converting your iPhone photo…"). A user must never wonder whether the app is frozen (`NITIN.md` §4).                       |

## 8. Responsive

| Breakpoint             | Layout                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **320–375** (baseline) | Single column, 20px gutters. Primary CTA above the fold. Preview keeps its aspect ratio; flip button remains below and reachable. |
| **390–430**            | As 375 with 24px gutters.                                                                                                         |
| **768**                | Single column, max-width 640, centred. Preview and optional Frame Lab controls remain inline.                                     |
| **1024+**              | Two columns: editor left (min 420), preview right (sticky). Max-width 1120.                                                       |

Rules that hold at every width: no horizontal scroll (NFR-009); tap targets ≥44px (NFR-010); with the keyboard open, the focused input **and** the primary action stay visible (NFR-011); flipping never changes the card's reserved width or height.

Mobile is not a compressed desktop. The 375 layout is the design; wider viewports are the adaptation.

## 9. Copy

**Tone:** confident, builder-to-builder, concise. Playful in word choice, never in clarity. No exclamation marks in error states.

| Surface          | Copy                                                                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Eyebrow          | GOABYTE · HACKER HOUSE GOA 2026                                                                                         |
| H1               | Builder Studio                                                                                                          |
| Sub              | Create your Hacker House Goa 2026 identity.                                                                             |
| Lead             | Upload a real selfie. Get a PFP, two-sided Builder ID or Crew Frame. Post it with #FrameInGoa.                          |
| Privacy          | Your photo never leaves your device.                                                                                    |
| Upload step      | Add your real selfie                                                                                                    |
| Upload actions   | Browse photos / Use camera                                                                                              |
| Upload hint      | JPG, PNG or HEIC · up to 32 MB                                                                                          |
| Converting       | Converting your iPhone photo…                                                                                           |
| Photo helper     | Use a real, current selfie. We'll frame it automatically.                                                               |
| Name label       | Your name                                                                                                               |
| Role label       | What you build                                                                                                          |
| Role placeholder | Backend · Architecture                                                                                                  |
| Title label      | Builder title _(optional)_                                                                                              |
| Generate         | Generate                                                                                                                |
| Download         | Download PNG                                                                                                            |
| Card download    | Download Front / Download Back                                                                                          |
| Card flip        | Flip to Back / Flip to Front                                                                                            |
| Share            | Share to X                                                                                                              |
| Start over       | Start over                                                                                                              |
| Error — type     | That file type isn't supported. Try a JPG, PNG or HEIC.                                                                 |
| Error — size     | That photo is {size}. The limit is 32 MB.                                                                               |
| Error — small    | That photo is {w}×{h}. We need at least 256×256 for a sharp result.                                                     |
| Error — HEIC     | Your browser can't read HEIC files. Open the photo in Photos, share it as JPEG, and try again.                          |
| Error — decode   | We couldn't read that photo. Try another one.                                                                           |
| Error — render   | Something went wrong generating your image. Try again.                                                                  |
| Soft quality     | This photo is on the small side, so your graphic may look slightly soft. A larger photo or less zoom will look sharper. |

### 9.1 Share copy — all variants contain `#FrameInGoa`

Enforced by unit test over every exported variant (FR-050). The default is format-aware so the post describes the exported graphic.

- **Builder V1** — `My Hacker House Goa 2026 Builder ID is ready. Built with GoaByte Builder Studio. #FrameInGoa`
- **Builder V2** — `Locked in for Hacker House Goa 2026. Building, connecting and shipping in Goa. #FrameInGoa`
- **PFP V1** — `Fresh frame, Goa energy. My Hacker House Goa 2026 profile picture is ready. #FrameInGoa`
- **PFP V2** — `New profile picture, same mission. See you at Hacker House Goa 2026. #FrameInGoa`
- **Crew V1** — `The crew is locked in for Hacker House Goa 2026. We are building together and shipping from Goa. #FrameInGoa`
- **Crew V2** — `One crew, many skills, one Goa build. Meet our Hacker House Goa 2026 team. #FrameInGoa`

The hashtag is appended by a single factory function so no variant can be authored without it, and every result is capped at 280 code points.

**The sentence that states what happened is set by SPIKE-3, not by this document.** It must match observed device behaviour (FR-055). Candidates are enumerated in `docs/spikes/SPIKE-3-WEB-SHARE.md` §9.

### 9.2 Builder-title copy

The selector exposes exactly the 14 labels in PRD FR-070. UI labels preserve authored casing and symbols (`dApp`, `AI × Web3`, `Growth & Community`); the responsibility description appears only as form help. Both card faces render only the selected label in their intentional uppercase poster treatment. “Try another” advances predictably rather than choosing randomly.

## 10. Asset handoff

| Asset                  | Path                                                  | Format | Size         | Notes                                              |
| ---------------------- | ----------------------------------------------------- | ------ | ------------ | -------------------------------------------------- |
| Display font           | `public/fonts/hhg-display-400.woff2`                  | woff2  | —            | Instrument Serif 400                               |
| Text variable font     | `public/fonts/hhg-text-var.woff2`                     | woff2  | —            | Archivo 100–900                                    |
| Font licence           | `public/fonts/OFL.txt`                                | txt    | —            | **Required.**                                      |
| PFP plates             | `public/brand/generated/goa-pfp-*.webp`               | WebP   | 1080² canvas | Three local, text-free frame treatments            |
| Builder front plate    | `public/brand/generated/goa-builder-badge.webp`       | WebP   | 1080×1350    | Local decorative plate; identity text stays Canvas |
| Crew plate             | `public/brand/generated/goa-crew-plate.webp`          | WebP   | 2048×1362    | Local decorative landscape plate                   |
| Builder reverse mascot | `features/render/templates/builder-card-back.draw.ts` | code   | 1080×1350    | Original Canvas geometry; **no image asset**       |
| Landing hero           | `public/brand/hero-{wide,narrow}.webp`                | WebP   | responsive   | Organiser-supplied art used under D-1a             |
| OG image               | `app/opengraph-image.png`                             | PNG    | 1200×630     | Static, hand-designed (S1-6)                       |

**Rules:** meaningful filenames, no `final2` (Lavitra §7). All renderer assets are **same-origin** — a remote asset taints the canvas and breaks export (FR-045), and is also prohibited by NFR-037. Exact event text remains Canvas data so it is testable and cannot drift inside bitmap artwork.

## 11. Design QA checklist

Measurable corrections only — never "looks slightly off" (Lavitra §10).

- [ ] Spacing values are on the 4px scale
- [ ] No blurred shadows anywhere
- [ ] No unreviewed soft/pill treatment; deliberate preview/control radii retain ink keylines
- [ ] Pink never used for body text (§3.3)
- [ ] Pink surfaces carry ink text
- [ ] Every interactive element has a visible focus ring
- [ ] Tap targets ≥44px
- [ ] No text below 14px on screen
- [ ] No horizontal scroll at 320/375/390/414/768/1024/1280
- [ ] Errors show icon + rule + text, not colour alone
- [ ] PFP subject safe zone is clear of graphics
- [ ] PFP identifiable at 48×48
- [ ] Both Builder ID faces are 1080×1350 and their critical regions stay inside their named safe regions
- [ ] Long name, emoji name, Devanagari name all render correctly
- [ ] All 14 canonical titles preserve exact symbols/casing and fit both card faces
- [ ] Empty builder title renders the generic `BUILDER` fallback without a blank plaque
- [ ] Full `HACKER HOUSE GOA 2026` identity appears on every PFP, both card faces and Crew Frame
- [ ] Reverse mascot is the original code-drawn composition; no external character image is loaded
- [ ] Flip button is below the preview, keyboard-operable and reachable at 320px
- [ ] Reduced motion changes sides immediately with no transition
- [ ] Flip/Download/Share controls are absent from both exported card faces
- [ ] Upload and camera paths explicitly request a real, current selfie without claiming automated verification
- [ ] Preview matches export at matched scale

## 12. Design decision status

| #    | Question                                     | Default                                                                               | Needed by |
| ---- | -------------------------------------------- | ------------------------------------------------------------------------------------- | --------- |
| DQ-1 | **Resolved:** PFP variants                   | Three catalogued treatments ship from one picker/renderer source                      | Complete  |
| DQ-2 | **Resolved:** card surface                   | Local decorative plate on front; code-drawn flat reverse; all exact text stays Canvas | Complete  |
| DQ-3 | **Resolved:** tropical motifs                | Each PFP plate owns its restraint; reverse uses named sun/palm/wave geometry          | Complete  |
| DQ-4 | **Resolved 10 Aug:** canonical title catalog | Exactly 14 reviewed records in `features/builder-title/suggest-title.ts`              | Complete  |

---

_Next document: `docs/IMAGE_ENGINE.md`, then `QA_PLAN.md`._
