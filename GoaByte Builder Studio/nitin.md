# NITIN.md — Frontend Engineer Owner

## Mission

You own the complete browser-facing implementation of GoaByte Builder Studio.

Your job is to turn the approved product/design system into a fast, responsive, accessible, reliable Next.js application.

You own frontend quality end-to-end:
- pages,
- components,
- upload UX,
- cropper UX,
- form behavior,
- editor state,
- preview,
- responsive implementation,
- error states,
- loading states,
- integration with render/export/share modules,
- frontend performance,
- browser compatibility.

---

## 1. Stack

Use:
- Next.js 15 App Router
- TypeScript strict mode
- Tailwind CSS v4
- shadcn/ui selectively
- Lucide React
- React Hook Form
- Zod
- react-easy-crop
- Framer Motion only when useful
- pnpm

Do not add UI/state packages casually.
Do not use Redux.
Do not add another component library.

---

## 2. Frontend architecture

Keep presentational components separate from feature logic.

Suggested:
```text
components/
  ui/
  layout/
  branding/

features/
  upload/
  crop/
  editor/
  pfp/
  builder-card/
  export/
  share/
```

Examples:
```text
UploadDropzone.tsx
ImagePreview.tsx
CropEditor.tsx
FormatSelector.tsx
BuilderCardForm.tsx
PfpPreview.tsx
BuilderCardPreview.tsx
DownloadButton.tsx
ShareXButton.tsx
EditorToolbar.tsx
InlineError.tsx
```

Avoid 800-line page components.

---

## 3. Landing page

Implement:
- HH Goa-inspired visual shell,
- clear headline,
- one-sentence explanation,
- obvious upload CTA,
- format preview / selector,
- mobile-first layout.

Performance:
- do not load heavy image editor packages until needed if practical,
- optimize decorative assets,
- avoid autoplay background video.

---

## 4. Upload UX

Requirements:
- file input + drag/drop where desktop supports it,
- accept JPG/JPEG/PNG/HEIC/HEIF,
- browser-friendly feedback,
- file name may be shown but not required,
- clear replace/remove action.

Client validation:
- file exists,
- allowed type,
- size threshold,
- readable image,
- error if unsupported.

Do not trust extension alone.
Coordinate with Aditya on validation utility.

States:
- idle,
- drag active,
- reading,
- converting HEIC,
- success,
- invalid type,
- oversized,
- decode failed.

User must never wonder if the app is frozen.

---

## 5. Crop editor

Use `react-easy-crop`.

Requirements:
- drag image,
- zoom,
- maintain target aspect ratio based on output format,
- reset control,
- confirm control,
- cancel/back.

PFP target aspect: 1:1.

Builder card photo area may have different ratio; define with design.

Important:
- do not permanently reduce quality in preview stage,
- preserve crop coordinates accurately,
- re-upload resets crop state correctly,
- switching format does not corrupt crop state.

---

## 6. Editor state

Define a typed editor model.

Example:
```ts
type OutputMode = 'pfp' | 'builder-card'

type EditorState = {
  mode: OutputMode
  sourceFile: File | null
  sourceImageUrl: string | null
  crop: { x: number; y: number }
  zoom: number
  croppedAreaPixels: Area | null
  name: string
  role: string
  builderTitle: string
  status: 'idle' | 'loading' | 'ready' | 'rendering' | 'error'
}
```

Use reducer if transitions become complex.

Prevent impossible states.

Revoke object URLs on replacement/unmount.

---

## 7. Builder ID form

Use React Hook Form + Zod.

Fields:
- name,
- role / stack,
- builder title (generated/selectable/editable according to PRD).

Validation:
- sensible max lengths,
- trim whitespace,
- reject meaningless empty required values,
- support Unicode,
- provide inline errors.

Do not reject legitimate Indian names or non-ASCII text.

---

## 8. Preview

The preview should closely match exported output.

Requirements:
- correct aspect ratio,
- responsive sizing,
- no blurry CSS scaling where avoidable,
- easy edit action,
- render state,
- error recovery.

If canvas is used for preview, ensure sizing is managed correctly.
If DOM preview differs from canvas export, document differences and minimize them.

---

## 9. Download integration

Download button:
- disabled until output is renderable,
- shows rendering/loading state,
- requests export from image engine,
- downloads real PNG,
- uses stable filename.

Example:
`hhgoa-2026-aditya-builder-card.png`

Filename must sanitize unsafe characters.

Handle:
- render failure,
- browser download quirks,
- repeated clicks.

---

## 10. Share to X

Implement a robust share experience.

P0:
- create pre-filled X intent URL,
- text ALWAYS includes `#FrameInGoa`,
- open safely in new tab/window,
- explain that user should attach downloaded image if direct image attachment is unavailable.

Do not claim the image is automatically attached unless it really is.

Coordinate with Aditya if share-by-link / OG generation is implemented.

---

## 11. Responsive implementation

Must work well at:
- 375px,
- 390/393px,
- 768px,
- 1024px,
- 1280px+.

Test:
- no horizontal scroll,
- cropper visible,
- action buttons reachable,
- preview not too tall,
- keyboard does not permanently hide buttons,
- long text wraps predictably.

Mobile is not a compressed desktop version. Follow Lavitra’s mobile design.

---

## 12. Accessibility

Implement:
- semantic headings,
- labels,
- button names,
- `aria-live` for async errors/status where useful,
- keyboard navigation,
- focus outlines,
- dropzone keyboard access,
- correct disabled states,
- `prefers-reduced-motion` respect for animation.

---

## 13. Error handling

Every async operation needs:
- pending state,
- success,
- failure,
- retry/recovery path.

Examples:
- HEIC conversion fails → tell user and allow another file.
- image decode fails → reset cleanly.
- render fails → do not leave spinner forever.
- share popup blocked → provide fallback/copy text.

No blank screens.

---

## 14. Frontend performance

- lazy-load heavy modules if beneficial,
- do not render huge full-resolution image directly in multiple places,
- avoid unnecessary React rerenders,
- memoize expensive derived values only when measured,
- minimize layout shifts,
- use optimized static assets,
- no heavy analytics during critical interaction,
- test on mid-range mobile device if possible.

---

## 15. Integration contract with Aditya

Agree on typed interfaces.

Example:
```ts
interface RenderRequest {
  mode: 'pfp' | 'builder-card'
  image: ImageBitmap | HTMLImageElement
  crop: CropRect
  fields?: {
    name: string
    role: string
    builderTitle: string
  }
}

interface RenderResult {
  blob: Blob
  width: number
  height: number
}
```

Do not directly reach into Aditya’s internals.
Use exported functions/interfaces.

---

## 16. Integration contract with Lavitra

Before implementing a screen, ensure you have:
- Figma link/frame,
- breakpoint behavior,
- component states,
- assets,
- exact copy,
- type specs.

When unclear, do not invent random styling if it changes brand direction. Use reasonable placeholder only with TODO tracked.

---

## 17. Testing checklist

You personally test:
- JPG portrait,
- JPG landscape,
- PNG,
- transparent PNG,
- HEIC,
- large file,
- invalid file,
- cancel upload,
- replace upload,
- PFP flow,
- Builder ID flow,
- long name,
- emoji name,
- long role,
- download,
- share,
- back/edit,
- repeat generation,
- mobile,
- desktop.

Check console for errors.

---

## 18. Git workflow

Use feature branches.
Small PRs.

Good examples:
- `feature/upload-dropzone`
- `feature/crop-editor`
- `feature/builder-form`
- `feature/share-x`

PR description:
- what changed,
- screenshots,
- how tested,
- known issues,
- dependency.

No giant “frontend complete” PR.

---

## 19. Definition of done for Nitin

Frontend is done only when:
- matches approved design,
- responsive,
- accessible,
- typed,
- all states implemented,
- critical browsers tested,
- error recovery works,
- production build succeeds,
- no serious console errors,
- integrated with image/export/share flows,
- final output path works from a clean browser session.

You are accountable for the actual user experience in the browser, not merely component completion.
