# Task 1 implementation plan — Codex UI / Claude product logic

**Decision owner:** Aditya  
**UI and export visual-design owner:** Codex
**Image pipeline, state, export mechanics, QA and deployment owner:** Claude

This is the integration contract for the Hacker House Goa 2026 Task 1 submission. It prevents both implementation tracks from editing the same concerns and keeps the primary flow focused on a successful mobile export in under 30 seconds.

## Current handoff status

### Codex UI delivered

- GoaByte landing hierarchy and responsive split layout.
- Miniature proof of Profile Picture and Builder ID outputs.
- Desktop drag/drop presentation plus Browse Photos and Use Camera actions.
- Premium glass upload form with aurora refraction, light sweep and layered glass controls.
- Live on-device camera preview, permission/error states and JPEG capture.
- Supported-format and on-device privacy messaging beside upload.
- Selected-photo presentation and change action.
- Builder-ID-only optional-field presentation.
- Dimension-aware accessible format selector.
- Editor masthead and compact generated/share-success treatment.
- Start-over navigation back to the actual landing page.
- About Us section with the GoaByte roster, responsibilities and LinkedIn actions.
- Original Goa-after-dark PFP and Builder ID poster templates with layered borders,
  editorial type, portrait ID framing, halftone, palm and wave motifs.
- Visual checks at 320, 375, 390, 768 and 1440 px with no horizontal overflow.

### Claude next

- Fix the development Strict Mode blank-preview/resource-lifecycle defect.
- Confirm every landing entry point uses the canonical validation/decode pipeline.
- Run the production E2E suite against the updated UI contracts.
- Complete real-device HEIC, memory, download and native-share verification.
- Integrate any logic-generated error/status states without changing the established layout.
- Build, deploy and verify the final Vercel revision.

## 1. Agreed product scope

### Ship

1. A landing page that explains the product in one glance.
2. Photo selection through browse, camera and desktop drag/drop.
3. JPG, PNG, WebP and HEIC/HEIF support with clear limits.
4. Client-side processing and an explicit privacy statement.
5. Two outputs:
   - Profile Picture — 1080×1080 PNG.
   - Builder ID — 1080×1350 PNG.
6. Automatic framing as the default path.
7. Optional Builder ID fields: name, role/stack and builder title.
8. Live preview using the same renderer as export.
9. Real PNG download.
10. Share to X with `#FrameInGoa`, native share where supported and an honest manual-attachment fallback.
11. Replace photo, edit details and start over without reloading.
12. Recoverable loading, validation and export states.

### Defer

- 3D physics lanyard and gyro interaction.
- Team Pass / multi-person wizard.
- Accounts, databases and public generated-result URLs.
- Telegram and LinkedIn sharing.
- Required crop step or heavyweight crop dependency. The shipped Frame Lab remains optional after the automatic result.
- Theme switcher, animations that do not communicate state, and decorative controls that look clickable.

## 2. Ownership boundary

| Area          | Codex — UI                                                                                | Claude — non-UI                                                             |
| ------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Design system | Layout, typography, colour, spacing, responsive rules, motion                             | Keep canvas palette tokens in parity with the UI tokens                     |
| Landing       | Hero, format proof, upload presentation, form presentation, trust copy                    | File validation and passing accepted data into editor state                 |
| Upload        | Drag-hover UI, browse/camera affordances, selected-file presentation                      | MIME sniffing, HEIC conversion, decode, EXIF, limits and errors             |
| Editor        | Format selector, optional Frame Lab, preview layout, fields, buttons and responsive order | Decode pipeline, automatic starting frame, render model and lifecycle state |
| Canvas        | Preview container, accessible description, template composition and art                   | Rendering contracts, crop math and preview/export parity                    |
| Export        | Loading/disabled/success/error presentation                                               | PNG generation, exact dimensions, filename and download behavior            |
| Share         | Share panel design and status-message presentation                                        | Web Share API, clipboard, X intent and popup fallbacks                      |
| Accessibility | Semantics, focus, labels, tap targets, contrast, reduced motion                           | Error codes and state announcements supplied to the UI                      |
| QA            | Visual QA at 320/375/390/768/1024/1440 px                                                 | Unit, integration, E2E, real-device HEIC/share/memory testing               |
| Delivery      | UI handoff and visual acceptance checklist                                                | Build, production verification, Vercel deployment and submission checks     |

Codex must not change image decoding, export mechanics or share behavior. For the explicitly
requested optional Frame Lab, Codex may maintain the small pure control-to-crop mapping and its
state action. Codex may also change deterministic canvas composition and layout values when the
request is visual, while preserving renderer contracts and exact dimensions. Claude must not restyle or restructure UI
components without first updating this contract or coordinating the prop/state change.

## 3. Step-by-step implementation

### Phase 0 — Freeze contracts

**Codex**

- Keep existing public props for `EditorShell`, `EditorWorkspace`, `FormatSelector` and `SharePanel` unless a UI requirement cannot be expressed with them.
- Document any needed state or callback before asking Claude to wire it.

**Claude**

- Confirm the supported file types, maximum file size, output dimensions and editor-state shape.
- Keep UI-facing errors as stable, human-readable data rather than throwing raw exceptions into components.

**Exit:** both tracks can work without touching the same modules.

### Phase 1 — Landing and upload

**Codex**

- Present “Builder Studio” as the product, not only “Builder ID.”
- Show miniature proof of both output formats.
- Build browse, camera and drag/drop affordances.
- Place format support and “processed in your browser” beside upload.
- Label name and role as Builder-ID-only fields so PFP users know they may skip them.
- Keep the upload action visible within a 375×667 viewport.

**Claude**

- Route browse, camera and dropped files through one validation pipeline.
- Preserve name and role when transitioning from landing to editor.
- Return specific errors for type, size, dimensions, decode and HEIC failures.
- Ensure all temporary URLs/bitmaps/canvases are released.

**Exit:** a user can select a photo in one attempt and reach a valid preview.

### Phase 2 — Editor and preview

**Codex**

- Make the preview the first editor content on mobile and sticky on desktop.
- Present Profile Picture and Builder ID as an accessible segmented control with dimensions.
- Keep Builder ID fields compact and show clear required/optional states.
- Style soft-quality warnings, loading, disabled and inline-error states.
- Keep Download PNG as the dominant action.

**Claude**

- Fix the React Strict Mode auto-load/resource-disposal issue.
- Preserve automatic crops independently for each format.
- Apply landing fields once the image reaches editing state.
- Guarantee preview/export parity and exact 1080×1080 / 1080×1350 output.
- Keep deterministic builder-title suggestions and Unicode text fitting.

**Exit:** switching formats never loses the image or fields, and the preview is never blank.

### Phase 3 — Export and sharing

**Codex**

- Present a compact “Your graphic is ready” success surface after export.
- Group Download again, Share/Post on X and Copy caption by importance.
- Explain manual image attachment only when the browser cannot attach a file.
- Preserve edit and start-over actions.

**Claude**

- Generate a real PNG with a sanitized filename.
- Support native file sharing when available.
- Copy the caption and guarantee `#FrameInGoa` in every copy variant.
- Open the X intent synchronously and handle popup blocking honestly.
- Invalidate a stale export whenever format, photo or fields change.

**Exit:** download and every share fallback work without false attachment claims.

### Phase 4 — Verification and submission

**Codex**

- Visually verify landing, editor, Builder ID form and share state at all target widths.
- Check focus visibility, keyboard order, labels, contrast and reduced motion.
- Confirm no decorative element resembles a nonfunctional control.

**Claude**

- Run lint, typecheck, unit tests, production build and Playwright E2E.
- Test portrait, landscape, panorama, transparent, low-resolution, corrupt and oversized inputs.
- Test HEIC, download and native sharing on real iPhone hardware.
- Verify no console errors, horizontal overflow or unbounded memory growth.
- Deploy to Vercel and run the full flow from a clean production session.

**Aditya**

- Approve final visual output and submission copy.
- Post exactly one official submission containing the literal `#FrameInGoa`.

## 4. Merge order

1. Codex lands UI-only components and styling.
2. Claude rebases/updates the controller and pipeline against the UI contracts.
3. Claude runs production E2E and fixes logic failures without redesigning the UI.
4. Codex performs final visual QA against the production build.
5. Aditya approves and Claude deploys the locked revision.

## 5. Definition of done

- Upload controls are above the fold at 375×667.
- No horizontal overflow at 320 px or wider.
- A first-time user can download a PFP without entering text.
- Builder ID clearly requires name and role before export.
- No blank preview, dead link, fake control or unexplained disabled action.
- Exports are real opaque PNGs at the documented dimensions.
- `#FrameInGoa` appears in the graphic and share copy.
- The photo never leaves the browser.
- Full production verification passes before the single team submission is posted.
