# LAVITRA.md — Product Design / UI-UX / Brand / Visual QA Owner

## Mission

You own the visual and interaction quality of GoaByte Builder Studio.

Your job is to make the product feel intentional, easy, recognizably Hacker House Goa 2026, and polished enough that a judge understands the value in seconds.

You are not “just making Figma screens.” You own:

- user flow,
- design system,
- brand translation,
- PFP visual template,
- Builder ID Card visual template,
- responsive behavior,
- interaction specification,
- product copy,
- visual QA,
- usability testing,
- submission screenshots.

---

## 1. Required design research

Study the official hhgoa.com visual language and supplied screenshots.

Document:

- dominant deep green,
- yellow highlights,
- hot pink accent,
- cream/paper backgrounds,
- black/ink outlines,
- editorial and condensed display typography,
- retro poster feeling,
- Goa tropical imagery,
- palms/beach/sun/villas,
- playful but structured visual rhythm.

Avoid:

- generic SaaS dashboard look,
- blue/purple AI gradients,
- glassmorphism everywhere,
- random crypto neon,
- excessive shadows,
- design that looks unrelated to HH Goa.

Create a short `BRAND_NOTES.md` or include this in the design system.

---

## 2. Figma deliverables

Create one Figma file with pages:

### Page 00 — Cover

- GoaByte Builder Studio
- HH Goa 2026 Shortlisting Task
- version/date
- owner names

### Page 01 — Foundations

Define:

- palette,
- typography,
- spacing,
- radii,
- border styles,
- shadows,
- icon style,
- illustration rules,
- grid,
- desktop max width,
- mobile safe areas.

### Page 02 — Components

Design:

- header/nav,
- format selector,
- upload dropzone,
- file preview,
- crop modal/editor,
- form inputs,
- segmented controls,
- primary button,
- secondary button,
- icon button,
- toast,
- inline error,
- loading state,
- skeleton if needed,
- preview frame,
- download button,
- share button,
- reset/edit controls.

Every component must have:

- default,
- hover,
- focus,
- disabled,
- error where applicable.

### Page 03 — Desktop Flow

Screens:

1. Landing
2. File selected
3. Crop/edit
4. PFP preview
5. Builder ID form
6. Builder ID preview
7. Generated result
8. Error examples

### Page 04 — Mobile Flow

At minimum 375px width.
Screens:

1. landing,
2. upload,
3. crop,
4. PFP,
5. Builder ID,
6. generated result,
7. share/download.

### Page 05 — Output Templates

Design actual export-ready graphic systems:

- PFP 1080×1080
- Builder ID target dimension chosen and documented

Do not just draw webpage previews. Create real graphic layout specs with exact coordinates/padding/typography hierarchy.

---

## 3. PFP frame design requirements

The photo is the hero.

The frame should:

- not obscure the face,
- be unmistakably HH Goa,
- work with light and dark photos,
- have safe margins,
- look good as a small X avatar,
- remain legible at thumbnail size.

Design at least 2 concepts, then select 1 production concept with the team.

Possible motifs:

- tropical border,
- yellow/pink editorial label,
- Goa poster corner treatments,
- subtle palm/sun illustration,
- event title lockup.

Do not overcrowd the PFP.

---

## 4. Builder ID Card requirements

Must contain:

- photo,
- name,
- role / stack,
- builder title,
- HH Goa 2026 identity,
- GoaByte attribution only if it does not confuse the official event identity.

Design for social sharing, not for printing.

Need:

- strong hierarchy,
- controlled text wrapping,
- fallback for long names,
- fallback for long roles,
- clear photo area,
- enough contrast,
- readable output on phone.

Define truncation / resizing rules:

- name max visual lines,
- role max lines,
- builder title max lines,
- minimum font sizes.

---

## 5. UX rules

The user should understand what to do without reading instructions.

Desired flow:

1. Upload photo
2. Pick PFP or Builder ID
3. Adjust crop only if needed
4. Enter fields if ID
5. Preview
6. Download
7. Share to X

Do not add onboarding slides.
Do not require account creation.
Do not hide the main CTA.
Do not require a tutorial.

---

## 6. Copywriting

Write concise copy for:

- hero,
- upload prompt,
- file requirements,
- crop helper,
- PFP tab,
- ID tab,
- name field,
- stack/role field,
- builder-title field,
- generate action,
- download,
- share to X,
- HEIC conversion,
- invalid file,
- oversized image,
- failed generation,
- retry,
- reset.

Tone:

- confident,
- builder-centric,
- playful but not childish,
- concise.

The X share copy MUST include:
`#FrameInGoa`

Provide at least 3 share-copy variants to engineering, but one should be the default.

---

## 7. Asset handoff

Every exported asset must have:

- meaningful filename,
- correct format (SVG for vectors, PNG/WebP where raster required),
- exact intended dimensions,
- transparent background where expected,
- no accidental whitespace,
- no duplicate “final2.png” style names.

Suggested:

```text
hhgoa-pfp-frame-v1.svg
hhgoa-card-corner-palm.svg
hhgoa-sun-mark.svg
hhgoa-paper-texture.webp
```

Provide a handoff table:
| asset | path | size | usage | notes |

---

## 8. Responsive specification

Specify:

- 375px mobile,
- 768px tablet,
- 1024px/1280px desktop.

For every major screen define:

- stacking order,
- margins,
- control width,
- preview size,
- cropper height,
- sticky/fixed actions if used,
- keyboard behavior,
- safe-area padding on iOS if needed.

No horizontal overflow.

---

## 9. Accessibility / usability

Check:

- visible focus states,
- color contrast,
- non-color error indicators,
- labels for fields,
- large tap targets,
- button text clarity,
- no tiny text,
- disabled controls look disabled,
- loading state explains what is happening,
- errors explain recovery.

---

## 10. Visual QA ownership

When Nitin implements screens, compare implementation to Figma.

Create visual QA checklist:

- spacing,
- font,
- line-height,
- alignment,
- border,
- radius,
- colors,
- icon sizes,
- desktop,
- mobile,
- long text,
- errors,
- disabled,
- loading.

Log issues with:

- screenshot,
- expected,
- actual,
- severity,
- device/browser.

Do not say “looks slightly off.” Give measurable corrections.

---

## 11. Usability testing

Find at least 5 people not involved in implementation.

Ask them to:

1. generate a PFP,
2. generate an ID,
3. download,
4. share.

Do not guide them unless they are completely stuck.

Record:

- time to first successful output,
- points of confusion,
- misclicks,
- text they fail to understand,
- whether output feels share-worthy.

Fix repeated issues.

---

## 12. Daily deliverables

### Day 1

- visual research
- design tokens
- complete user flow
- low-fi wireframes
- first PFP concepts
- first Builder ID concepts

### Day 2

- final desktop/mobile UI
- component specs
- production PFP
- production Builder ID
- handoff assets

### Day 3+

- implementation reviews
- visual bug reports
- usability tests
- social/submission assets

---

## 13. Definition of done for Lavitra

Your design work is done only when:

- all screens are designed,
- mobile is designed,
- edge/error states exist,
- frame template is export-ready,
- ID template is export-ready,
- assets are handed off,
- copy is finalized,
- implementation is visually reviewed,
- critical visual issues are fixed,
- submission screenshots are prepared.

You are accountable for product experience, not just the Figma file.
