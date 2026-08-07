# PRD — GoaByte Builder Studio

**Product:** Builder Studio by GoaByte
**Tagline:** Create your Hacker House Goa 2026 identity.
**Submission:** Hacker House Goa 2026 — Open Trial, Frame / ID Card Generator
**Deadline:** 23:59 IST, 13 August 2026 · **Team target: submit by 14:00 IST, 13 August 2026**
**Owner:** Aditya (final decision maker) · **Frontend:** Nitin · **Design:** Lavitra
**Status:** **Approved with amendments** · v0.2 · 7 August 2026 · see §13 Decision log

> **On requirement IDs:** `FR-xxx` / `NFR-xxx` are stable identifiers, not an ordering. They are referenced by `ARCHITECTURE.md` and `QA_PLAN.md` and are never renumbered. Requirements added after v0.1 take the next free number and are filed under the section they belong to, so section blocks may be non-contiguous. Superseded requirements are struck through, never deleted.

---

## 1. Executive summary

### 1.1 Problem

Hacker House Goa 2026 needs its accepted and aspiring builders to be visible on X. Today a builder who wants to show they are part of it has no way to produce a graphic that looks like it belongs to the event. The alternatives are all bad: open Figma and spend twenty minutes, use a generic frame app that produces something off-brand, or post nothing. Most people choose nothing.

The result is that a residency with a strong visual identity has almost no distributed visual presence, and the signal "I am building for HH Goa" has no artifact attached to it.

### 1.2 User

Anyone applying to, attending, or rooting for Hacker House Goa 2026. Overwhelmingly on a phone, overwhelmingly on iOS, arriving from a link in an X post or a WhatsApp group, with roughly fifteen seconds of patience and no intention of creating an account for a picture.

### 1.3 Goal

A visitor turns a photo from their camera roll into an on-brand HH Goa 2026 graphic — either a profile-picture frame or a Builder ID card — downloads it as a real PNG, and posts it to X with `#FrameInGoa`. One pass, no login, under thirty seconds, works the first time on a stranger's iPhone.

### 1.4 Why this matters for HH Goa

The Open Trial scores **task performance** above all other signals. That reframes what we are optimising: not "how many features," but "does a stranger succeed on the first attempt." A submission that does two things flawlessly on a real phone outranks one that does six things in a demo video.

There is a second-order argument. This tool, if it works, is genuinely useful to the organisers after the trial ends — every participant who generates a PFP is free distribution for the residency. We should build it as if it will be handed over and used, because the difference between "a hackathon entry" and "something we would actually deploy" is exactly the difference a judge is trying to detect.

### 1.5 Success criteria

The submission succeeds if all of the following are true on 13 August:

- The production URL loads and completes the full flow in a fresh incognito session on an iPhone.
- A first-time user with no instructions produces and downloads a graphic in under 30 seconds.
- The downloaded file is a real PNG at the documented dimensions, with crisp text and correct orientation.
- The share flow puts `#FrameInGoa` in front of the user 100% of the time, with zero false claims about attachment.
- The team's official X post contains the literal string `#FrameInGoa`.
- Exactly one submission is filed, by Aditya, before the deadline.
- A reviewer opening the repository can understand the architecture in five minutes.

---

## 2. Scope

### 2.1 P0 — must have. Not shippable without these.

| ID    | Item                                                    | Note                                                      |
| ----- | ------------------------------------------------------- | --------------------------------------------------------- |
| S0-1  | Photo upload — file picker + drag/drop                  | JPG, PNG, WebP, HEIC/HEIF                                 |
| S0-2  | Validation with specific, recoverable errors            | Never a generic "something went wrong"                    |
| S0-3  | Decode + EXIF orientation + downscale to working image  | The reliability foundation                                |
| S0-4  | Crop / zoom / reposition                                | `react-easy-crop`, per-format aspect                      |
| S0-5  | PFP generation — 1080×1080 PNG                          | Format A                                                  |
| S0-6  | Builder ID generation — 1080×1350 PNG                   | Format B                                                  |
| S0-7  | Live preview that matches the export exactly            | Same renderer, different scale                            |
| S0-8  | Download a real image file                              | Not a data-URL-in-a-tab                                   |
| S0-9  | Share to X with `#FrameInGoa` guaranteed present        | Native file share on mobile, intent + download on desktop |
| S0-10 | Mobile-first responsive, 375px up, no horizontal scroll | Primary target, not a fallback                            |
| S0-11 | Full error / loading / empty state coverage             | No blank screens, no infinite spinners                    |
| S0-12 | Edit-after-generate and start-over without reload       | Must not leak memory                                      |

### 2.2 P1 — differentiators. Build only when every P0 item is green.

| ID   | Item                                                                  | Why it earns its place                                            |
| ---- | --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| S1-1 | Builder-title picker with a deterministic smart default               | Turns a form into a moment of delight; costs ~3 hours             |
| S1-2 | Upward-biased smart default crop                                      | Most users will never touch the cropper; the default must be good |
| S1-3 | Two PFP frame variants + two card colourways                          | Ownership over the output without a settings panel                |
| S1-4 | Three share-copy variants, one default                                | Avoids fifty identical posts in the timeline                      |
| S1-5 | Purposeful motion (Framer Motion), `prefers-reduced-motion` respected | Premium feel; strictly subtle                                     |
| S1-6 | Static, hand-designed OG image for the landing page                   | Every shared link looks intentional                               |
| S1-7 | Privacy statement — "your photo never leaves your device"             | True, verifiable, and a real differentiator                       |

### 2.3 P2 — explicitly deferred. Not in this submission.

Persisted share links and dynamic per-user OG images · server-side rendering of graphics · additional template variants beyond S1-3 · saved sessions or history · accounts of any kind · AI-generated titles or backgrounds · video/GIF export · analytics beyond privacy-preserving page counts · i18n.

### 2.4 Explicit scope rejections

These are refused on sight, regardless of who proposes them or how much time appears to be left:

- **Authentication, profiles, dashboards, databases.** The brief says no login wall. Every one of these is a way to fail that requirement while feeling productive.
- **Server-side image processing.** Adds latency, cost, privacy obligations, and a failure mode we cannot debug at 2am on the 13th. Client-side is both faster and safer here.
- **LLM calls on the critical path.** A network hop, a cost, a rate limit, and a source of non-determinism between preview and export, in exchange for something a curated list does better.
- **A crypto/wallet feature.** HH Goa is an AI × Crypto residency; that does not make wallet-connect relevant to a picture frame. Adding it would read as pandering, and judges recognise pandering.
- **Any framework, state library, or component library beyond the locked stack.** Reversing a late stack decision is how teams miss deadlines.

**Freeze:** 21:00 IST, Wednesday 12 August 2026. After the freeze, only P0 bug fixes; every change requires Aditya's approval and a full regression pass.

---

## 3. User personas

### P1 — Rhea, mobile-first participant _(primary — optimise for her)_

23, applying to HH Goa, taps the link from an X post on her iPhone 13 over patchy 4G. Photos are HEIC. She will not rotate her phone, will not read instructions, and will leave if anything takes more than a few seconds or asks her to sign up. She wants a PFP that looks good as a 48px avatar. **If Rhea succeeds, we pass.**

### P2 — Arjun, developer on a laptop

28, backend engineer, Chrome on a MacBook. Will drag a JPG onto the page, will try the Builder ID card, will enter an emoji in his name to see what breaks, and will open DevTools. He may look at the repository. He is the persona who notices whether the export is actually 1080×1080 and whether the console is clean.

### P3 — The organiser / judge, evaluating quickly

Opening dozens of submissions. Gives each 60–90 seconds. Wants to know: does it load, is it obvious, does it work on their phone, does the output look like HH Goa, is the hashtag right. Will try one weird thing on purpose — a landscape photo, a very long name — to see if it breaks. **Every edge case in §8 exists because of this persona.**

### P4 — Lakshmi, non-technical supporter

Friend of a participant, mid-range Android, Chrome, older device. Does not know what "PFP" means without context. Present to keep us honest about jargon, tap-target size, and performance on non-flagship hardware.

---

## 4. User journeys

Notation: **→** user action · _italics_ = system state.

### J1 — First visit (0–5 seconds)

Lands. Sees a headline stating exactly what this is, one sentence of explanation, a visible example of both output formats, and one unmistakable upload control above the fold at 375px. No cookie banner, no modal, no autoplay video. → Understands and taps Upload.

**Requirement:** the primary CTA is reachable without scrolling on a 375×667 viewport.

### J2 — Upload, happy path

→ Selects a photo. _Reading file_ (skeleton, ~instant) → _Decoding_ → _Ready._ Cropper appears with a good default crop already applied and the PFP format preselected. Total: under 1.5 s for a typical 3 MB JPG.

### J3 — HEIC upload (iPhone)

→ Selects a HEIC. _Decoding._ Native decode is attempted first; if the browser can handle it, the user never learns their file was unusual. If not: status changes to "Converting your iPhone photo…" with an `aria-live` announcement, `heic2any` is lazy-loaded, conversion runs, flow resumes at J2. If conversion fails: J5 with HEIC-specific recovery copy ("Your browser can't read HEIC files. Open the photo in Photos, share it as JPEG, and try again.").

**Requirement:** the conversion path never blocks the UI with no visible feedback for more than 300 ms.

### J4 — Invalid file

→ Selects a PDF / a 40 MB image / a 100×100 thumbnail / a corrupt file. Inline error, specific to the cause, naming the fix. Dropzone stays in a ready state; no state is destroyed; a previously loaded good image is retained.

### J5 — Decode failure

Error state with a Try another photo action. All partial state is torn down, object URLs revoked, bitmaps closed. The app returns to a clean idle, never to a half-loaded limbo.

### J6 — Crop and reposition

→ Drags and pinches/scrolls to zoom. Aspect ratio is locked to the active format. Reset returns to the smart default. Crop state is preserved per format, so switching PFP ↔ Builder ID and back does not lose work.

### J7 — PFP path

→ Format selector on PFP. Preview renders the framed result live. → Download.

### J8 — Builder ID path

→ Switches to Builder ID. Form appears: **Name** (required), **Role / stack** (required), **Builder title** (optional, prefilled with a deterministic suggestion, editable, with a shuffle control). Preview updates as fields change (debounced). Long values are handled by the auto-fit rules in §5. → Download.

### J9 — Download

→ Taps Download. Button enters a rendering state, export runs at full resolution, a real PNG lands in the user's files with a sanitised, meaningful name. On iOS, where `<a download>` is unreliable, the Web Share path is offered and the rendered result is additionally presented as a long-pressable image — there is always a way to get the file.

### J10 — Share to X

→ Taps Share to X.

- **Mobile where `navigator.canShare({ files })` is true:** the native share sheet is invoked with the actual PNG and the caption. **The receiving application decides how it handles the shared file and text** — we can hand both over, but we cannot guarantee the target app uses both, and iOS in particular frequently drops the text when a file is attached. We therefore copy the caption to the clipboard at the same time and say so in the UI. Behaviour on real devices is established by **SPIKE-3 (§11.1)** before this path is finalised.
- **Everywhere else:** the image downloads (if not already), `x.com/intent/post` opens pre-filled, and the UI states plainly: _"Your image is downloaded — attach it to the post."_

The caption always contains `#FrameInGoa`. We never say the image is attached unless it is.

### J11 — Edit after generating

→ Back to editor. Crop, fields, and format are intact. Re-render and re-download work an arbitrary number of times with no memory growth.

### J12 — Start over

→ Start over. Full teardown, fresh idle state, no page reload.

---

## 5. Functional requirements

### Upload and input

- **FR-001** Accept `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif` via file input and desktop drag/drop.
- **FR-002** The file input is keyboard-focusable and operable with Enter/Space; the dropzone is not the only path to upload.
- **FR-003** Validate by sniffing magic bytes from the file header, not by trusting extension or reported MIME type.
- **FR-004** Reject files above **32 MB** with a message stating the actual size and the limit.
- **FR-005** Reject decoded images below **256×256** with a message stating the actual dimensions and the minimum.
- **FR-006** Warn (do not block) between 256×256 and 512×512 that output may look soft.
- **FR-007** A cancelled file picker changes no state and shows no error.
- **FR-008** Selecting a new file while one is loaded fully releases the previous image before decoding the new one.

### Decode pipeline

- **FR-009** Attempt native decode via `createImageBitmap` with `{ imageOrientation: 'from-image' }`; fall back to `HTMLImageElement` where unsupported.
- **FR-010** Load `heic2any` **only** after a native decode of a HEIC/HEIF file has failed, via dynamic import. **Provisional — subject to SPIKE-1 (§11.1).** The native-decode-first ordering is a hypothesis about `createImageBitmap` behaviour with HEIC/HEIF, not an established fact; it must be confirmed on real devices before `ARCHITECTURE.md` treats it as settled. If the spike shows native decode is inconsistent or silently produces wrong output on any target browser, the fallback becomes: convert first on that browser family, native-first elsewhere, selected by capability probe rather than user-agent.
- **FR-061** Inspect intrinsic decoded dimensions at the earliest point the browser APIs allow, and normalize immediately. Memory risk is governed by **decoded pixel count, not file size** — a 15 MB JPEG can decode to hundreds of MB of raw pixels — so the FR-004 file-size limit is a cheap first filter, never the actual memory guard.
- **FR-011** Apply EXIF orientation exactly once, producing an upright bitmap; no downstream consumer applies rotation.
- **FR-012** Downscale so the longest edge is at most **2400 px**, using stepwise halving to avoid aliasing. Never upscale.
- **FR-013** Composite the working image onto an opaque background so transparent PNGs cannot produce transparent exports.
- **FR-014** Produce exactly one `NormalizedImage` per upload; it is the sole source of pixels for cropping, preview, and export.
- **FR-015** Release the previous `NormalizedImage` (`ImageBitmap.close()`, `URL.revokeObjectURL`) on replacement and on unmount.

### Crop

- ~~**FR-016** Provide drag-to-reposition and zoom via `react-easy-crop`…~~ **SUPERSEDED by D-9.** No crop UI is rendered. `react-easy-crop` is removed from the dependency tree.
- **FR-017** Frame automatically and deterministically: the largest region of the target aspect that fits the image, centred horizontally and biased to ~42% of image height vertically. This is _the_ framing, not a default a user overrides — there is no correction step, so it has to be right the first time.
- ~~**FR-018** Provide a Reset control…~~ **SUPERSEDED by D-9.** Nothing to reset.
- **FR-063** The primary flow is upload → automatic framing → preview → download. No step may be inserted between upload and a downloadable result. Replacing the photo and starting over are the only editor actions.
- **FR-064** Framing is deterministic: the same photo always yields the same graphic, with no randomness or time dependence (NFR-035).
- **FR-019** Store crop rectangles in normalized coordinates relative to the `NormalizedImage`, independently per format.
- **FR-020** Clamp crop rectangles to image bounds; an out-of-bounds rectangle is impossible by construction, not by validation.
- **FR-062** Derive effective output quality from the crop, not from the source image. When the selected crop region yields fewer than the export's target pixels along either axis (i.e. the render must upscale), show a non-blocking soft-quality warning stating that the result may look soft and suggesting the user zoom out or use a larger photo. Never silently upscale and imply the output is sharp. The warning threshold and copy are defined in the render config.

### PFP rendering

- **FR-021** Export PFP at exactly **1080×1080 px**, PNG.
- **FR-022** Cover-fit the cropped region into the photo area without distortion; aspect ratio is never altered.
- **FR-023** The frame must leave the central subject area unobscured, with documented safe margins.
- **FR-024** The result must remain legible at 48×48 px (X avatar size) — verified visually, not assumed.

### Builder ID rendering

- **FR-025** Export Builder ID at exactly **1080×1350 px** (4:5), PNG.
- **FR-026** Render photo, name, role/stack, builder title, and HH Goa 2026 identity per the design spec.
- **FR-027** Keep critical identity content — photo, name, role — inside a conservative central safe region with sufficient edge margin to survive UI overlays, repost and embed contexts, thumbnail treatments, and future changes to platform presentation. The safe region is defined once in the card layout config as an inset, not derived from any single platform's current crop behaviour.
- **FR-028** Auto-fit name: shrink font from the design size down to a documented floor, then wrap to a maximum of 2 lines, then ellipsis.
- **FR-029** Auto-fit role and title with the same mechanism and their own documented floors and line limits.
- **FR-030** Render Unicode correctly — Devanagari, accented Latin, and emoji must not produce tofu or clipping.

### Form

- **FR-031** Name: required, trimmed, 1–32 characters after trim, any Unicode. Whitespace-only is rejected.
- **FR-032** Role / stack: required, trimmed, 1–40 characters.
- **FR-033** Builder title: optional, trimmed, 0–28 characters, prefilled with a deterministic suggestion.
- **FR-034** The default builder title is derived deterministically from the name so it never changes between preview and export.
- **FR-035** A shuffle control offers alternative titles; the chosen value is then fixed in state.
- **FR-036** Validation via React Hook Form + Zod, with inline errors tied to inputs by `aria-describedby`.
- **FR-037** Errors are announced accessibly and indicated by more than colour alone.

### Preview

- **FR-038** Preview is produced by the same renderer as the export, at a smaller scale — there is no second layout implementation.
- **FR-039** Preview canvas is sized for `devicePixelRatio` (capped at 2) so it is crisp without wasting memory.
- **FR-040** Preview updates are debounced (~120 ms) on text input and coalesced into `requestAnimationFrame`.
- **FR-041** The preview canvas carries `role="img"` and a generated `aria-label` describing the output.

### Export and download

- **FR-042** Export renders to an offscreen canvas at full target resolution and produces a PNG `Blob` via `canvas.toBlob`.
- **FR-043** All required font faces are explicitly awaited via `document.fonts.load()` for each family/weight/size in use before any text is drawn. `document.fonts.ready` alone is insufficient.
- **FR-044** All frame and decoration assets are fully loaded and decoded before rendering begins.
- **FR-045** Only same-origin assets are drawn to canvas, so the canvas is never tainted and `toBlob` never throws a security error.
- **FR-046** Filenames follow `hhgoa-2026-{slug}-{format}.png`, with the slug sanitised to `[a-z0-9-]`, truncated to 32 characters, falling back to `builder` when empty.
- **FR-047** Repeated download clicks are ignored while a render is in flight.
- **FR-048** Every export blob URL is revoked after the download is triggered.
- **FR-049** A render failure surfaces a specific error with a retry action and never leaves a permanent spinner.

### Share

- **FR-050** The share caption always contains the exact literal string `#FrameInGoa`. This is enforced by a unit test asserting it on every generated variant.
- **FR-051** Where `navigator.canShare({ files })` returns true, share the actual PNG file together with the caption.
- **FR-052** Where it does not, ensure the image is downloaded and open `https://x.com/intent/post` with a URL-encoded pre-filled caption.
- **FR-053** The share window is opened synchronously within the click handler; no `await` precedes it.
- **FR-054** If the share window is blocked or the share sheet is dismissed, offer a copy-caption fallback and a visible link.
- **FR-055** The UI states truthfully whether the image is attached or must be attached manually.
- **FR-056** Copy the caption to the clipboard alongside a file share, and tell the user, because iOS may drop the text.

### Application state

- **FR-057** Editor state is a discriminated union; states such as "ready with no image" are unrepresentable.
- **FR-058** Format switching preserves per-format crop and all entered field values.
- **FR-059** Start over returns to idle with all resources released, without a page reload.
- **FR-060** No state is persisted to `localStorage`, cookies, or any server.

---

## 6. Non-functional requirements

### Performance

- **NFR-001** Landing page LCP under **1.8 s** on a mid-range Android over simulated 4G.
- **NFR-002** Landing route first-load JS at or under **120 KB gzipped**; cropper and HEIC converter excluded via dynamic import.
- **NFR-003** `heic2any` is never downloaded unless a HEIC decode has actually failed.
- **NFR-004** Decode + normalize of a typical 3 MB JPG completes in under **800 ms** on a mid-range phone.
- **NFR-005** Full-resolution export completes in under **400 ms** (p50, desktop) and **1200 ms** (p95, mid-range Android).
- **NFR-006** No synchronous main-thread block exceeds **200 ms** during editing interactions.
- **NFR-007** Peak JS heap stays under **250 MB** through five consecutive uploads of 12 MP photos.
- **NFR-008** Cumulative Layout Shift under 0.1; all media has reserved dimensions.

### Mobile usability

- **NFR-009** No horizontal scrolling at 320, 375, 390, 414, 768, 1024, and 1280 px.
- **NFR-010** Interactive targets are at least 44×44 px.
- **NFR-011** With the on-screen keyboard open, the active input and the primary action remain reachable.
- **NFR-012** Respect iOS safe-area insets; nothing sits under the home indicator.
- **NFR-013** Pinch-zoom on the cropper does not trigger browser page zoom.

### Accessibility

- **NFR-014** WCAG 2.1 AA contrast for all text and meaningful UI. The brand's yellow-on-cream and pink pairings must be verified, not assumed — this is the most likely place a Goa-poster palette fails.
- **NFR-015** The entire flow is completable by keyboard alone.
- **NFR-016** Visible, high-contrast focus indicators on every interactive element; focus is never trapped or lost.
- **NFR-017** Semantic heading hierarchy with exactly one `h1`.
- **NFR-018** Async status and errors announced via `aria-live` regions.
- **NFR-019** All non-decorative imagery has meaningful alternative text; decoration is `aria-hidden`.
- **NFR-020** All motion is disabled or reduced under `prefers-reduced-motion: reduce`.

### Privacy

- **NFR-021** No photo, crop, or field value is transmitted anywhere. All processing is in-browser.
- **NFR-022** No user photo is ever written to persistent storage.
- **NFR-023** No third-party script may receive user content. Analytics, if present, are page-level and cookieless.
- **NFR-024** The privacy claim is stated plainly in the UI and in the README, and is literally true.
- **NFR-037** "Your photo never leaves your device" is an **architectural invariant, not a marketing claim.** It is enforced structurally and is violated by any of the following, each of which is prohibited: an upload endpoint of any kind; server-side rendering of user content; remote image optimization applied to user photos (including `next/image` loaders pointed at user data); third-party image, crop, or face-detection APIs; Cloudinary or equivalent; error-reporting breadcrumbs, tags, or context carrying photo data or form field values; analytics events carrying name, role, or builder title. Any pull request introducing a network call that could carry user content requires explicit sign-off from Aditya and a corresponding amendment to this requirement.

### Reliability

- **NFR-025** Every async operation has explicit pending, success, and failure states with a recovery path.
- **NFR-026** No unhandled promise rejections and no console errors in production.
- **NFR-027** A React error boundary wraps the editor and offers recovery without a reload.
- **NFR-028** Feature detection, never user-agent sniffing, gates every optional browser API.

### Browser compatibility

- **NFR-029** Fully supported: iOS Safari 16+, Android Chrome 110+, desktop Chrome/Edge 110+, desktop Safari 16+, Firefox 115+.
- **NFR-030** Where an API is unavailable, degrade to a working path — never to a broken one.

### Image quality

- **NFR-031** Exports are PNG at exactly the documented dimensions, verified by test.
- **NFR-032** Downscaling uses stepwise halving; no visible aliasing on detailed photos.
- **NFR-033** Text in exports is rendered by the canvas text API at full resolution — never by upscaling a bitmap.
- **NFR-034** Exported PNGs are fully opaque.

### Deterministic rendering

- **NFR-035** Identical inputs and renderer configuration produce **pixel-equivalent visual output and identical layout decisions**. No randomness, timestamps, `Date.now()`, locale-dependent formatting, or other nondeterministic content exists in the render path. Verified by asserting dimensions, computed layout values, and rendered content — **not** by hashing PNG bytes, since canvas PNG encoding is implementation-dependent across browsers and OS versions and identical pixels do not imply identical byte streams.
- **NFR-036** The preview and the export differ only by scale factor.

---

## 7. Acceptance criteria for P0

Each is a pass/fail gate. All must pass on production before submission.

**S0-1 Upload** — PASS when JPG, PNG, WebP, and HEIC can each be selected via the picker on iOS Safari and Android Chrome, and via drag/drop on desktop Chrome, and each reaches the editor. FAIL if any listed format silently does nothing.

**S0-2 Validation** — PASS when a `.pdf` renamed to `.jpg`, a 40 MB image, and a 100×100 image each produce a distinct, specific, actionable error, and the app remains usable afterwards. FAIL on any generic error text or state corruption.

**S0-3 Decode** — PASS when a photo taken in portrait on an iPhone appears upright in the cropper, the preview, and the exported PNG. FAIL if any of the three is rotated.

**S0-4 Automatic framing** — PASS when portrait, landscape, square, panoramic and off-centre photos each produce a well-framed 1:1 graphic with the subject intact and no distortion, with zero user interaction between choosing the photo and seeing the result; and when the same photo re-uploaded produces an identical graphic. FAIL if any common photo shape yields a decapitated or badly-framed subject, or if any step is required before the result appears.

**S0-5 PFP** — PASS when the export is exactly 1080×1080, the frame is on-brand, the face is unobscured, and the result is recognisable at 48×48. FAIL on wrong dimensions or an obscured subject.

**S0-6 Builder ID** — PASS when the export is exactly 1080×1350 and remains legible and correctly laid out with: a 1-character name, a 32-character name, an emoji name, a Devanagari name, and a 40-character role. FAIL on overflow, clipping, or tofu.

**S0-7 Preview fidelity** — PASS when preview and export are visually identical in framing, typography, and colour under side-by-side comparison at matched scale. FAIL on any font substitution or layout difference.

**S0-8 Download** — PASS when the downloaded file opens as a valid PNG at the correct dimensions on macOS, Windows, iOS, and Android, with a sensible filename. FAIL if any platform yields a broken file or no file.

**S0-9 Share** — PASS when the caption contains `#FrameInGoa` on every platform tested, the mobile path attaches the real file where supported, and the UI's claim about attachment matches reality in every path. FAIL on a missing hashtag or any false statement.

**S0-10 Responsive** — PASS when the full flow completes with no horizontal scroll at 320/375/390/768/1024/1280 px, and the primary CTA is above the fold at 375×667. FAIL on any overflow.

**S0-11 States** — PASS when every async operation shows a pending state, every failure is recoverable in-place, and no path produces a blank screen or a spinner lasting beyond 10 s. FAIL on any dead end.

**S0-12 Repeat use** — PASS when five consecutive upload → generate → download cycles on an iPhone complete without a tab reload and with heap under the NFR-007 budget. FAIL on any crash or unbounded growth.

---

## 8. Edge cases

Each entry states the expected behaviour. These are test cases, not hypotheticals.

### Input

| Case                                  | Expected                                                               |
| ------------------------------------- | ---------------------------------------------------------------------- |
| 30 MB, 12000×9000 JPG                 | Accepted; downscaled to ≤2400 px; no crash on iOS; under 3 s to editor |
| 40 MB file                            | Rejected with size stated                                              |
| 100×100 image                         | Rejected with dimensions stated                                        |
| 400×400 image                         | Accepted with a soft-output warning                                    |
| Corrupt / truncated JPG               | Decode failure, specific error, clean recovery                         |
| `.pdf` renamed `.jpg`                 | Rejected by magic-byte sniffing, not by extension                      |
| Correct extension, wrong MIME from OS | Accepted — content sniffing wins                                       |
| Transparent PNG                       | Flattened onto an opaque brand background; export is opaque            |
| Animated GIF/WebP                     | First frame only; no error                                             |
| CMYK JPEG                             | Decoded via the browser; if it fails, a specific error                 |
| Grayscale image                       | Renders normally                                                       |
| EXIF orientation 6 (rotated 90°)      | Upright everywhere, once                                               |
| EXIF orientation 3 (180°)             | Upright everywhere, once                                               |
| No EXIF at all                        | Treated as orientation 1                                               |
| HEIC that fails conversion            | HEIC-specific error naming the fix                                     |
| HEIC on a browser with native support | Converted natively; `heic2any` never downloaded                        |
| 10000×200 panorama                    | Accepted; crop defaults to a valid centred square; no distortion       |
| 200×10000 tall image                  | Same                                                                   |
| Zero-byte file                        | Rejected before decode                                                 |
| Picker cancelled                      | No state change, no error                                              |
| Same file selected twice              | Reprocessed cleanly; previous resources released                       |
| Multi-file drop                       | First image used; brief note that one photo is used                    |
| Non-image dropped                     | Rejected with a clear message                                          |

### Text

| Case                                     | Expected                                                                                        |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1-character name                         | Renders at design size                                                                          |
| 32-character name                        | Auto-fit shrink, then wrap to 2 lines                                                           |
| Whitespace-only name                     | Rejected as required                                                                            |
| Emoji in name (👨‍💻, 🇮🇳)                   | Renders; ZWJ sequences do not clip; no tofu                                                     |
| Devanagari / Tamil name                  | Renders correctly with the chosen font stack                                                    |
| RTL name (Arabic)                        | Renders; layout does not break                                                                  |
| `<script>` in a field                    | Rendered as literal text on canvas — canvas cannot execute it — and never injected into the DOM |
| Newlines pasted into a field             | Normalised to spaces                                                                            |
| Leading/trailing whitespace              | Trimmed before render and before filename generation                                            |
| 40-character role                        | Auto-fit per FR-029                                                                             |
| Empty builder title                      | Field omitted from the card; layout reflows, no gap                                             |
| Name that sanitises to empty (all emoji) | Filename falls back to `builder`                                                                |

### Environment

| Case                                    | Expected                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------ |
| iOS Safari private mode                 | Full flow works; no storage APIs required                                                  |
| iOS `<a download>` unreliable           | Web Share path offered; result is long-pressable                                           |
| Android Chrome download                 | Real file in Downloads with correct name                                                   |
| Popup blocker on share                  | Blocked window detected; copy-caption fallback shown                                       |
| Web Share unavailable (desktop)         | Download + intent path; UI states the image must be attached                               |
| Web Share present but files unsupported | Text-only share; UI states the image must be attached                                      |
| Clipboard API denied                    | Caption shown in a selectable field                                                        |
| Low memory / tab under pressure         | Working-image cap makes this survivable; error boundary catches the rest                   |
| Offline after first load                | App shell works; share opens a failed navigation, which is the browser's message, not ours |
| Fonts fail to load                      | Documented fallback stack; export still succeeds with acceptable typography                |
| `prefers-reduced-motion`                | All animation removed                                                                      |
| 200% browser zoom                       | No overflow, no clipping                                                                   |
| Desktop Safari `toBlob`                 | Verified explicitly — historically the weakest canvas implementation                       |
| Rapid format toggling                   | No render race; last request wins                                                          |
| Download tapped repeatedly              | Ignored while in flight                                                                    |
| Browser back button mid-flow            | SPA state is intact or cleanly reset — never a half-state                                  |

---

## 9. Success metrics

| Metric                       | Target                                   | How measured                                           |
| ---------------------------- | ---------------------------------------- | ------------------------------------------------------ |
| Time to comprehension        | Under 5 s                                | Usability test, 5 external participants (Lavitra)      |
| Time to first download       | Under 30 s                               | Same, timed                                            |
| Unaided completion rate      | 5/5 participants                         | Same, no guidance given                                |
| Render time, export          | <400 ms p50 desktop, <1200 ms p95 mobile | `performance.mark` in dev builds                       |
| Landing LCP                  | <1.8 s on 4G mid-range                   | Lighthouse mobile                                      |
| Landing first-load JS        | ≤120 KB gzip                             | `next build` output                                    |
| Lighthouse Accessibility     | ≥95                                      | Lighthouse, production URL                             |
| Hashtag inclusion            | 100%                                     | Unit test over all copy variants + manual verification |
| Horizontal scroll            | 0 occurrences                            | Manual sweep across the breakpoint list                |
| Console errors in production | 0                                        | Manual QA on all target browsers                       |
| Export dimension accuracy    | 100%                                     | Unit test + file inspection                            |
| Repeat-use crashes           | 0 in 5 cycles                            | Manual, on a real iPhone                               |
| Login/signup steps           | 0                                        | Structural                                             |

---

## 10. Open questions

| #      | Question                                                                    | Default if unanswered             | Blocking?             |
| ------ | --------------------------------------------------------------------------- | --------------------------------- | --------------------- |
| ~~Q1~~ | ~~Do we have licensed HH Goa brand assets?~~                                | **RESOLVED — see D-1 in §13**     | Closed                |
| Q2     | Which X account posts the official submission?                              | Aditya's                          | No — needed by 12 Aug |
| Q3     | Custom domain, or `*.vercel.app`?                                           | `*.vercel.app`                    | No — nice-to-have     |
| Q4     | Do organisers want a handover (repo access, asset licence) after the trial? | Offer it unprompted in the README | No                    |

---

## 11. Delivery plan

| Day | Date       | Milestone                                                                         | Deployable outcome              |
| --- | ---------- | --------------------------------------------------------------------------------- | ------------------------------- |
| D0  | Fri 7 Aug  | Docs, repo, CI, **Day-0 spikes (§11.1)**                                          | Empty app deployed to Vercel    |
| D1  | Sat 8 Aug  | **Slice 1:** upload → normalize → crop → plain PFP → download                     | End-to-end flow works, unstyled |
| D2  | Sun 9 Aug  | **Slice 2:** production PFP frame, brand shell, landing page                      | Shippable PFP product           |
| D3  | Mon 10 Aug | **Slice 3:** Builder ID form, renderer, text auto-fit                             | Both formats work               |
| D4  | Tue 11 Aug | **Slice 4:** share flows, mobile hardening, accessibility pass                    | Feature-complete                |
| D5  | Wed 12 Aug | Cross-browser QA, 5 external testers, P0/P1 fixes. **FREEZE 21:00 IST**           | Release candidate               |
| D6  | Thu 13 Aug | Production verification, X post, submission **by 14:00 IST**. Critical fixes only | Submitted                       |

Every slice ends deployable. If we run out of time at any point, the last deployed slice is a coherent product rather than a broken half-build — this is the entire reason for slicing vertically.

### 11.1 Day-0 technical spikes

These are **empirical questions that architecture must not answer by assumption.** Each is a throwaway page deployed to a Vercel preview and opened on real hardware. Each produces a written result in `docs/SPIKE_RESULTS.md`. `ARCHITECTURE.md` may describe the intended path, but marks it provisional until the corresponding spike closes. Owner: Aditya. Due: end of D0.

> **Numbering amended 7 Aug 2026 (v0.2).** The original v0.1 numbering was superseded to add a fonts/assets spike and to fold download reliability into the share spike, where it is tested by the same person on the same device in the same sitting. The numbering below is canonical; `docs/spikes/` and the harness at `/spikes` follow it. No duplicate IDs exist.

**SPIKE-1 — HEIC / decode pipeline.** Load real HEIC camera originals (not re-exported copies — iOS transcodes on some export paths and would make this pass for the wrong reason) and attempt `createImageBitmap` directly. Record per browser: does it succeed; is the result correctly oriented; how long does it take; does it fail loudly or silently. Then measure the `heic2any` fallback: transfer size, conversion time on a 12 MP file, main-thread block duration.
Matrix: iPhone Safari (current iOS), Safari macOS, Android Chrome, Chrome macOS. Firefox if time permits.
**Decides:** FR-009, FR-010, and whether the decode strategy is uniform or capability-branched.
**Harness:** `/spikes/heic`

**SPIKE-2 — Canvas limits, memory, normalization.** Probe where canvas surfaces stop being usable — writing a pixel and reading it back, because iOS fails _silently_ and successful allocation proves nothing. Confirm the 2400 px working cap sits safely inside the limit. Normalize a very large photo end to end with timings. Run five consecutive cycles watching for a tab reload.
Matrix: iPhone Safari (essential), Android Chrome, desktop Safari.
**Decides:** FR-012, FR-061, NFR-007, and the S0-12 acceptance gate.
**Harness:** `/spikes/canvas`

**SPIKE-3 — Web Share behaviour and download.** Generate a real PNG, probe `navigator.canShare({ files })`, then invoke `navigator.share` three ways — text only, file only, file + text — and record what actually arrives in the X app and in WhatsApp. Specifically: is the file attached; is the text preserved, dropped, or truncated; what happens on dismissal. In the same sitting, test `<a download>` with a blob URL: does a file save, what is it named, or does it open in a tab instead.
Matrix: iPhone Safari, Android Chrome.
**Decides:** FR-051, FR-055, FR-056, FR-046, the J9 download ladder, and the exact wording of the UI's claim about attachment — which must match observed reality, not the specification.
**Harness:** `/spikes/share`

**SPIKE-4 — Canvas fonts and asset preparation.** Demonstrate that `document.fonts.ready` resolves while a canvas-needed face is still unavailable, that explicit per-face `document.fonts.load()` fixes it, and that measured text metrics actually change across the boundary. Confirm asset decode completes before a purely synchronous render.
Matrix: iPhone Safari, Android Chrome, desktop Chrome, desktop Safari. Re-run once the brand font is handed off.
**Decides:** FR-043, FR-044, and validates ADR-4 (the synchronous renderer).
**Harness:** `/spikes/fonts`

If a spike invalidates a PRD requirement, the requirement is amended in §13 before implementation begins. A spike result that contradicts the plan is the spike working correctly.

---

## 12. Sign-off

| Role                     | Owner   | Approved |
| ------------------------ | ------- | -------- |
| Product / final decision | Aditya  | ☐        |
| Frontend feasibility     | Nitin   | ☐        |
| Design feasibility       | Lavitra | ☐        |

---

## 13. Decision log

Binding decisions. Architecture and implementation follow these; changing one requires Aditya's approval and an entry here.

**D-1 — Brand assets: original / inspired-by.** _(Resolves Q1.)_ hhgoa.com is used as a **visual reference only**. Visual access is not a licence. We do not reuse their fonts, logo, wordmark, illustrations, or artwork. Organizer-supplied assets may be used **only** where they were explicitly made available for participant use; absent that, we build an original HH-Goa-inspired system with open-licensed (OFL) fonts and original decorative assets. The product never claims or implies official status. _Alternative considered:_ reuse site assets scraped from the live site — rejected, no public brand-kit or licence page was found in the official material, and unlicensed reuse is a reputational risk that would outweigh any visual gain. _Future implication:_ if organizers later licence a brand kit, the design token layer and asset directory are the only things that change.

**D-2 — Canvas preview only.** One renderer serves both preview and export, differing only by scale factor. There is no separate DOM representation of the final graphic. _Why:_ the product is fundamentally an image compositor, and the worst bug class available to us is "looks right on screen, exports differently." A second layout implementation is a second source of truth. _Trade-off:_ the preview is not selectable text and not natively accessible — mitigated by FR-041 (`role="img"` plus a generated `aria-label`). _Ownership:_ Nitin owns the React shell around the canvas; he does not build a DOM version of the card. Enforces FR-038, NFR-036.

**D-3 — No wallet, token, or on-chain feature; no AI on the critical path.** The task is a Frame / ID Card Generator and task performance is the scored signal. Technology that is irrelevant to the task weakens the submission rather than strengthening it, regardless of the residency's AI × Crypto framing. _Future implication:_ none — this is a permanent boundary for this submission.

**D-4 — Builder ID stays 1080×1350 (4:5); 16:9 safe-band assumption removed.** The output dimension is unchanged and correct. The _rationale_ changed: X currently documents full display for single images between 2:1 and 3:4, and 4:5 (0.8:1) sits inside that range, so architecting around an assumed timeline crop encoded a platform behaviour that is not in effect. FR-027 now specifies a conservative central safe region justified by durable concerns — overlays, reposts, embeds, thumbnails, future platform changes — rather than one platform's current crop. _Why this matters beyond this card:_ a layout constraint justified by a real invariant survives; one justified by a vendor's current UI does not.

**D-5 — Deterministic rendering, not byte-identical output.** Supersedes the original NFR-035. Canvas PNG encoding is implementation-dependent; visually identical pixels do not guarantee identical byte streams across Safari, Chrome, Firefox, or OS versions. Requiring byte equality would have produced a test that fails for reasons unrelated to our correctness. We test dimensions, computed layout decisions, and rendered content — never file hashes.

**D-6 — Input caps approved, with the real guard named.** 32 MB file cap and 2400 px working cap stand as initial constraints. But **decoded dimensions, not file size, are the memory risk** (FR-061) — a compressed 15 MB JPEG can decode to hundreds of MB of raw pixels, so the file-size check is a cheap first filter and nothing more. Added FR-062: effective quality is derived from the crop, and a tight crop that would require upscaling produces an honest soft-quality warning rather than a silently soft export.

**D-7 — HEIC strategy and Web Share behaviour are spike-gated.** The native-decode-first ordering (FR-010) and the file-share path (J10) are hypotheses until SPIKE-1 and SPIKE-3 close on real devices. `ARCHITECTURE.md` describes them as provisional. _Why:_ both depend on behaviour that varies by browser, OS version, and receiving application, and neither can be settled by reading a specification.

**D-9 — Automatic framing replaces the crop editor.** _(7 Aug 2026, supersedes S0-4, FR-016, FR-018, J6.)_ The task brief states that the product must handle portrait, landscape, off-centre subjects and varying aspect ratios and must **not assume users will crop first**. A required crop step contradicts that directly, and on mobile it is a wall between a visitor and their download. The primary flow is now upload → automatic framing → preview → download, and it must feel one-click.

_What this bought beyond UX:_ the crop editor was the only reason `NormalizedImage` carried an object URL, because `react-easy-crop` takes a URL rather than a drawable. Producing it meant a full `toBlob()` PNG encode of the working canvas — up to 2400×2400 — on **every upload**, on the devices least able to afford it. Removing the cropper deleted that encode, made `normalizeImage` synchronous, cut a resource from the ownership model, and dropped a dependency.

_Trade-off, stated plainly:_ a user who dislikes the automatic framing has no recourse but to upload a different photo. That is a real cost, accepted because the 42% vertical bias handles ordinary phone photos well and because forcing a crop on everyone to serve a minority is the worse trade. **The mitigation is measurement, not assumption:** if usability testing shows automatic framing failing on real photos, an optional "Adjust position" panel ships as S1-8 — progressive enhancement, never a required step.

_Consequence to watch:_ `VERTICAL_SUBJECT_BIAS` now carries the entire product. It is the difference between a good graphic and a decapitated one, with no manual correction available. It deserves explicit attention in usability testing.

**D-8 — Privacy is an invariant, not a claim.** NFR-037 enumerates the prohibited mechanisms explicitly, so "your photo never leaves your device" is enforced by the absence of any code path that could violate it, not by intent.

---

_Next document: `docs/ARCHITECTURE.md`._
