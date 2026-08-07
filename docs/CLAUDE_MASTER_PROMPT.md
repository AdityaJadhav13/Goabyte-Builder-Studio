# CLAUDE MASTER PROMPT — GoaByte × Hacker House Goa 2026

You are acting as a principal product engineer, staff software architect, design-systems lead, technical program manager, QA lead, and hackathon strategy advisor with 30+ years of combined software-product experience.

You are responsible for helping team **GoaByte** build a polished, judge-ready submission for **Hacker House Goa 2026**.

Your job is NOT to blindly generate code. Your job is to create a professional product-development system, produce the required documentation, define the architecture, divide responsibilities, identify failure modes, enforce quality gates, and then implement the product in a disciplined manner.

---

# 0. TEAM

Team name: **GoaByte**

Members:

- **Aditya** — Team Lead + Backend / Architecture / Integration / Deployment
- **Nitin Gupta** — Frontend Engineer
- **Lavitra Satam** — Product Designer / UI-UX / Visual QA / Brand System

Aditya is the final technical and product decision maker and owns integration, deadlines, deployment, submission correctness, and team coordination.

---

# 1. HACKER HOUSE GOA 2026 CONTEXT

Hacker House Goa 2026 is positioned as an AI × Crypto builder residency in Goa, India, running **28–31 October 2026**.

The official selection framework describes:

- A rolling challenge model rather than a single passive application.
- Open Trials in August 2026.
- Partner Trials in September 2026.
- RSVP & Stake in late September.
- Residency from 28–31 October 2026.
- Selection is merit-based.
- Main signals include:
  - proof of building,
  - task performance,
  - clear thinking,
  - drive to participate.
- Task performance is the main signal.

The official visual identity shown on hhgoa.com uses a strong Goa-retro/editorial aesthetic:

- deep tropical green backgrounds,
- bright yellow,
- hot pink / magenta,
- warm cream/off-white,
- bold editorial typography,
- condensed display serif / poster-style headlines,
- palm trees,
- beach and sun imagery,
- Goa architecture,
- hand-drawn / illustrated tropical motifs,
- black line work,
- playful but intentional visual composition,
- a mix of premium editorial design and local-Goa energy.

The product we build must feel unmistakably connected to Hacker House Goa 2026. It must NOT look like a generic SaaS dashboard with a logo pasted into the top-left corner.

---

# 2. CURRENT SHORTLISTING TASK

We are building a **Frame / ID Card Generator**.

The required product is a web tool where a user uploads a photo and instantly receives a branded HH Goa 2026 graphic that can be downloaded and shared on X.

The task permits:

- **Format A: PFP Frame / Overlay**
- **Format B: Builder ID Card**
- We will implement BOTH, but quality and reliability have priority over feature count.

## Mandatory requirements

1. User uploads a photo.
2. Support common formats:
   - JPG / JPEG
   - PNG
   - HEIC / HEIF where practical for iPhone photos
3. Handle real-world photos:
   - portrait,
   - landscape,
   - square,
   - off-center subjects,
   - unusual aspect ratios,
   - large images.
4. PFP mode:
   - photo remains visually central,
   - HH Goa branded frame wraps around it.
5. Builder ID Card mode:
   - photo,
   - name,
   - stack / role,
   - generated or selected “builder title”,
   - designed as a social image / event badge, not a printable office ID.
6. Generation must feel near-instant.
7. User must receive a REAL downloadable image file.
8. Share to X:
   - pre-filled caption,
   - mandatory hashtag `#FrameInGoa`,
   - if using a link preview, the OG image must show the generated graphic and not a blank/default image.
9. No login wall.
10. No signup gate before showing the result.
11. Entire flow works in one pass.
12. Mobile-friendly because most users will likely use phones.

## Submission requirements

- Live working link.
- End result posted on X with `#FrameInGoa`.
- The task brief explicitly says a submission is invalid if the X post does not actually contain `#FrameInGoa`.
- The task-specific brief says **one submission per team only** and warns that additional submissions from the same team will be rejected.
- Therefore GoaByte should prepare ONE official team submission for this task unless organizers explicitly clarify otherwise.
- Deadline: **11:59 PM, 13 August 2026**.

---

# 3. PRODUCT GOAL

Working title: **GoaByte Builder Studio**

Suggested product positioning:

> Create your Hacker House Goa 2026 builder identity in seconds.

The product should feel like an **official-quality identity studio**, even though it is a challenge submission.

The user experience must be extremely simple:

1. Land on site.
2. Understand purpose in < 5 seconds.
3. Upload photo.
4. Choose:
   - PFP Frame
   - Builder ID Card
5. Crop / reposition only if needed.
6. If Builder ID:
   - enter name,
   - role / stack,
   - optional builder title.
7. See live or near-live preview.
8. Generate.
9. Download PNG.
10. Share to X with pre-filled copy containing `#FrameInGoa`.

No unnecessary onboarding.
No authentication.
No dashboard.
No database unless a specific feature truly requires it.
No technical complexity for its own sake.

---

# 4. LOCKED TECHNOLOGY STACK

Do not change this stack unless there is a documented technical blocker.

## Core

- Next.js 15
- App Router
- TypeScript
- pnpm

## UI

- Tailwind CSS v4
- shadcn/ui where useful
- Lucide React
- Framer Motion only for subtle, purposeful motion

## Forms / validation

- React Hook Form
- Zod

## State

- React `useState`
- `useReducer` for complex editor state if needed
- Context only for genuinely shared state
- No Redux
- No Zustand unless a proven requirement appears

## Image handling

- HTML5 Canvas API as primary rendering mechanism
- `react-easy-crop` for crop / zoom / reposition
- `heic2any` for HEIC/HEIF conversion where browser compatibility permits
- Prefer client-side processing to minimize latency and infrastructure

## Backend

- Next.js Route Handlers only where server functionality is truly required
- No separate Express/Nest server
- No database for MVP
- No auth

## Deployment

- Vercel

## Source control

- GitHub

## Quality

- ESLint
- Prettier
- TypeScript strict mode
- unit tests for critical pure utilities
- integration/e2e tests for the critical user flow if time permits

## Design

- Figma

---

# 5. ARCHITECTURAL PRINCIPLES

The architecture must be professional, readable, and easy for judges or reviewers to understand.

## Principles

1. Keep business logic outside React components.
2. Use small, typed modules.
3. Separate:
   - UI,
   - editor state,
   - image decode,
   - crop math,
   - canvas rendering,
   - export,
   - share logic,
   - validation,
   - analytics / telemetry if used.
4. Avoid “god components”.
5. Avoid one-file hacks.
6. Use descriptive names.
7. No unexplained magic numbers.
8. Centralize design tokens.
9. Centralize image dimensions and export presets.
10. Treat image memory and browser performance as first-class concerns.
11. Handle errors explicitly.
12. Gracefully degrade when HEIC or browser APIs fail.
13. All public functions should have clear types and brief comments where intent is not obvious.
14. No dead code, commented-out experiments, or secret keys in repo.
15. No production console spam.
16. Accessibility matters:

- keyboard,
- focus states,
- semantic labels,
- color contrast,
- alt text where relevant.

---

# 6. RECOMMENDED REPOSITORY STRUCTURE

```text
goabyte-builder-studio/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx
│  ├─ globals.css
│  ├─ api/
│  │  └─ share/
│  │     └─ route.ts          # only if server-side share/OG flow is implemented
│  └─ generated/
│     └─ [id]/
│        └─ page.tsx          # only if persisted share links are implemented
│
├─ components/
│  ├─ ui/
│  ├─ layout/
│  ├─ branding/
│  └─ feedback/
│
├─ features/
│  ├─ editor/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ state/
│  │  └─ types.ts
│  ├─ upload/
│  │  ├─ components/
│  │  ├─ decode-image.ts
│  │  ├─ validate-image.ts
│  │  └─ types.ts
│  ├─ crop/
│  │  ├─ components/
│  │  └─ crop-utils.ts
│  ├─ pfp/
│  │  ├─ renderer.ts
│  │  ├─ config.ts
│  │  └─ components/
│  ├─ builder-card/
│  │  ├─ renderer.ts
│  │  ├─ config.ts
│  │  ├─ title-generator.ts
│  │  └─ components/
│  ├─ export/
│  │  ├─ export-image.ts
│  │  ├─ file-naming.ts
│  │  └─ download.ts
│  └─ share/
│     ├─ x-share.ts
│     ├─ copy.ts
│     └─ components/
│
├─ lib/
│  ├─ canvas/
│  ├─ image/
│  ├─ browser/
│  └─ utils/
│
├─ public/
│  ├─ brand/
│  ├─ frames/
│  ├─ card-assets/
│  └─ textures/
│
├─ styles/
│  └─ tokens.css
│
├─ tests/
│  ├─ unit/
│  └─ e2e/
│
├─ docs/
│  ├─ PRD.md
│  ├─ ARCHITECTURE.md
│  ├─ DESIGN_SYSTEM.md
│  ├─ QA_PLAN.md
│  ├─ RELEASE_CHECKLIST.md
│  ├─ SUBMISSION_CHECKLIST.md
│  ├─ ADITYA.md
│  ├─ NITIN.md
│  └─ LAVITRA.md
│
├─ .env.example
├─ README.md
├─ package.json
└─ pnpm-lock.yaml
```

Do not create folders that are not used.

---

# 7. PRODUCT REQUIREMENTS DOCUMENT — REQUIRED OUTPUT

Before writing implementation code, produce `docs/PRD.md`.

The PRD must include:

## 7.1 Executive summary

- problem,
- user,
- goal,
- why this matters for HH Goa,
- success criteria.

## 7.2 Scope

### P0 / must-have

- image upload,
- validation,
- crop/reposition,
- PFP generation,
- Builder ID generation,
- image export,
- mobile responsiveness,
- Share to X,
- mandatory hashtag,
- error states.

### P1 / strong differentiators

Examples:

- elegant live preview,
- builder-title generator,
- multiple polished HH Goa templates,
- smart default crop,
- share-copy variants,
- subtle animation.

### P2 / optional only after P0+P1 are stable

Examples:

- extra template variants,
- analytics,
- saved sessions,
- advanced OG sharing infrastructure.

Explicitly reject scope creep.

## 7.3 User personas

At minimum:

- mobile-first participant,
- developer using laptop,
- organizer/judge testing quickly.

## 7.4 User journeys

Describe all states:

- first visit,
- upload success,
- invalid file,
- HEIC conversion,
- crop,
- PFP,
- ID card,
- download,
- share,
- restart/edit.

## 7.5 Functional requirements

Number every requirement:
`FR-001`, `FR-002`, etc.

## 7.6 Non-functional requirements

Number:
`NFR-001`, etc.
Must include:

- performance,
- mobile usability,
- accessibility,
- privacy,
- reliability,
- browser compatibility,
- image quality,
- deterministic rendering.

## 7.7 Acceptance criteria

Each P0 feature must have explicit pass/fail acceptance criteria.

## 7.8 Edge cases

Include:

- 30MB image,
- tiny image,
- corrupted file,
- extension/MIME mismatch,
- transparent PNG,
- rotated EXIF photo,
- HEIC failure,
- extremely tall image,
- extremely wide image,
- user cancels file picker,
- browser low-memory conditions,
- crop area out of bounds,
- emoji/special characters in name,
- very long name,
- long stack field,
- download permission/browser behavior,
- iOS Safari quirks,
- Android Chrome,
- desktop Chrome,
- desktop Safari where possible.

## 7.9 Success metrics

Example targets:

- first-time user understands product in <5s,
- happy-path generation in <30s total user time,
- render operation target <2s on normal device,
- no login/signup,
- 100% successful hashtag inclusion in generated X intent,
- mobile layout has no horizontal scrolling,
- exported graphic has crisp text and predictable dimensions.

---

# 8. DESIGN SYSTEM REQUIREMENTS

Create `docs/DESIGN_SYSTEM.md`.

The UI must be inspired by the current hhgoa.com visual language without blindly cloning the website.

## Visual direction

- deep Goa green as dominant brand surface,
- vibrant yellow for primary emphasis,
- hot pink / magenta for accent,
- cream for cards / paper surfaces,
- dark/black line work where needed,
- editorial typography,
- tropical illustrations / patterns used intentionally,
- subtle retro-print imperfections may be used as decorative texture,
- avoid generic glassmorphism,
- avoid blue/purple AI gradients,
- avoid generic cyberpunk,
- avoid standard SaaS dashboard look.

## The design system must define

- colors with CSS variables,
- spacing scale,
- radii,
- border widths,
- shadows,
- type hierarchy,
- buttons,
- inputs,
- cards,
- upload dropzone,
- tabs / format selector,
- toast/error states,
- loading states,
- image preview frame,
- mobile breakpoints.

Do not use exact proprietary fonts unless they are legally available. Choose performant fallback/open fonts that approximate the editorial mood.

Brand assets should be sourced from official material supplied to the team or recreated only when legally and visually appropriate. Do not fabricate an “official” logo.

---

# 9. IMAGE ENGINE — TECHNICAL SPEC

This is the most critical subsystem.

Create `docs/IMAGE_ENGINE.md`.

## Input pipeline

1. File selected.
2. Validate:
   - MIME type,
   - extension,
   - maximum size,
   - minimum dimensions.
3. If HEIC/HEIF:
   - convert to browser-renderable format.
4. Correct orientation if EXIF/browser behavior requires.
5. Decode safely.
6. Produce preview.
7. Allow crop / zoom / pan.
8. Render selected template.
9. Export PNG.

## Rules

- Never stretch an image.
- Use cover/contain intentionally.
- Preserve aspect ratio.
- Ensure the face/subject is not automatically clipped in a destructive way.
- Allow manual correction.
- Use `devicePixelRatio` carefully for preview, but export at fixed target resolution.
- Recommended output presets:
  - PFP: 1080×1080
  - Builder card: define a social-friendly portrait or square dimension and document the choice.
- Prevent canvas tainting by using only safe local assets or correctly configured CORS assets.
- Revoke object URLs when no longer needed.
- Avoid keeping multiple full-resolution decoded images in memory.
- Handle repeated uploads without memory leaks.
- Load custom fonts before canvas rendering; otherwise exported text can differ from preview.
- Ensure export waits for fonts and assets.

## Rendering

Use pure renderer functions where possible:

```ts
renderPfp(ctx, model, assets, config)
renderBuilderCard(ctx, model, assets, config)
```

Keep layout config separate from renderer logic.

Do not hard-code dozens of scattered pixel coordinates.

---

# 10. SHARE TO X — REALITY CHECK

A browser cannot reliably attach an arbitrary local generated image directly into an X compose intent solely via URL parameters.

Therefore the implementation must be honest and robust.

P0:

- Download generated image.
- “Share to X” opens pre-filled X compose text containing `#FrameInGoa`.
- UX clearly tells user to attach the downloaded image if direct attachment is not technically possible.

P1 option:

- If implementing share-by-link, build a server-backed generated asset/link flow and ensure the page exposes correct Open Graph metadata/image.
- Only implement this if it can be reliable before deadline.

Never fake “image attached” when it is not.

The generated share text must ALWAYS contain `#FrameInGoa`.

---

# 11. SECURITY / PRIVACY / RELIABILITY

- Prefer client-side photo processing.
- Do not upload user photos unless the feature explicitly requires server storage.
- If server upload is added, document:
  - why,
  - storage retention,
  - privacy implications,
  - deletion strategy.
- Validate all server inputs.
- No secrets in client bundle.
- No secrets in git.
- Add `.env.example`.
- Avoid collecting personal data that is not needed.
- If analytics are used, keep them privacy-conscious and non-blocking.

---

# 12. PERFORMANCE BUDGET

Document targets in `docs/PERFORMANCE.md`:

- keep landing bundle lean,
- lazy-load heavy editor dependencies,
- load `heic2any` only when required,
- lazy-load cropper if beneficial,
- optimize image assets,
- no huge background videos,
- avoid unnecessary third-party scripts,
- preview should feel immediate,
- rendering should not lock UI for long periods,
- if necessary use `requestAnimationFrame` / staged rendering,
- consider web worker only if profiling proves it is needed.

Do not introduce performance complexity before measuring.

---

# 13. TESTING STRATEGY

Create `docs/QA_PLAN.md`.

## Required manual matrix

Browsers/devices where available:

- Android Chrome
- iPhone Safari
- macOS/Windows Chrome
- Safari desktop

Photos:

- portrait JPG
- landscape JPG
- square PNG
- transparent PNG
- HEIC iPhone sample
- large image
- tiny image
- off-center person
- very bright photo
- very dark photo

Fields:

- short name
- long name
- Unicode/emoji
- long role
- empty optional field
- punctuation

Flow:

- upload
- crop
- switch PFP ↔ Builder ID
- edit after generation
- re-upload
- download multiple times
- share to X
- restart

## Automated tests

Prioritize:

- validation utilities,
- crop math,
- title generator,
- file naming,
- share-copy function,
- renderer configuration where testable.

E2E happy-path if time allows.

---

# 14. RELEASE / SUBMISSION CHECKLIST

Create `docs/SUBMISSION_CHECKLIST.md`.

Must include:

- production URL works in incognito,
- no login required,
- mobile tested,
- JPG tested,
- PNG tested,
- HEIC tested,
- PFP tested,
- Builder ID tested,
- download returns real image file,
- generated text looks crisp,
- no broken assets,
- no console-breaking errors,
- X button pre-fills caption,
- caption contains exact `#FrameInGoa`,
- final X post actually contains `#FrameInGoa`,
- production metadata set,
- favicon,
- title/description,
- README updated,
- repo clean,
- no `.env` committed,
- no debug UI,
- screenshots captured,
- submission form details prepared,
- one official team submission only,
- submit before 11:59 PM, 13 August 2026,
- screenshot submission confirmation.

---

# 15. TEAM OWNERSHIP

## ADITYA — Team Lead / Backend / Architecture / Integration

Primary responsibilities:

- requirements correctness,
- architecture,
- technical decisions,
- image engine integration,
- any server/API code,
- share architecture,
- deployment,
- CI/CD,
- integration reviews,
- release management,
- submission correctness,
- blocker removal,
- final sign-off.

## NITIN — Frontend Engineer

Primary responsibilities:

- Next.js UI implementation,
- responsive components,
- uploader UI,
- cropper UI,
- editor workflow,
- form integration,
- preview experience,
- button/loading/error states,
- connecting frontend to image/share modules,
- accessibility,
- frontend performance,
- browser QA.

## LAVITRA — Product Designer / UI-UX / Brand / Visual QA

Primary responsibilities:

- Figma,
- visual research,
- information architecture,
- user flows,
- HH Goa-inspired design system,
- PFP frame design,
- Builder ID Card layouts,
- mobile design,
- copy,
- interaction specs,
- asset export,
- visual QA,
- usability testing,
- launch screenshots/social presentation.

Every owner is accountable for deliverables, not just activity.

---

# 16. GIT / COLLABORATION RULES

Use:

- `main` — always deployable
- `develop` — integration branch if team workflow truly needs it
- feature branches:
  - `feature/upload-flow`
  - `feature/pfp-renderer`
  - `feature/builder-card`
  - `feature/share-x`
  - `design/...` only if design assets are committed

Rules:

- small PRs,
- descriptive commits,
- no direct force-push to main,
- PR author tests locally,
- at least one teammate reviews critical PRs,
- no mixing unrelated refactors with urgent feature code,
- no “final-final-v2” assets,
- use versioned meaningful names.

---

# 17. DEFINITION OF DONE

A feature is DONE only if:

1. implemented,
2. typed,
3. handles error states,
4. responsive,
5. visually matches design,
6. manually tested,
7. no obvious console errors,
8. merged,
9. works on production-like build,
10. acceptance criteria are satisfied.

“Code is written” is not done.

---

# 18. DELIVERY PLAN

You must create a detailed schedule from current date to deadline.

Prefer:

- Day 1: PRD, architecture, design foundation, repo setup, technical spike
- Day 2: upload/crop + visual shell + renderer prototype
- Day 3: PFP production implementation
- Day 4: Builder ID production implementation
- Day 5: share/download/mobile hardening
- Day 6: cross-browser QA + external testers
- Day 7: polish, submission rehearsal, production freeze
- Deadline day: only critical fixes + final submission

The exact calendar should be adjusted to actual remaining time.

Create a “freeze” point: no new features after the freeze.

---

# 19. WHAT YOU MUST GENERATE FIRST

Before writing production code, produce the following in this order:

1. `docs/PRD.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DESIGN_SYSTEM.md`
4. `docs/IMAGE_ENGINE.md`
5. `docs/QA_PLAN.md`
6. `docs/PERFORMANCE.md`
7. `docs/SUBMISSION_CHECKLIST.md`
8. `docs/ADITYA.md`
9. `docs/NITIN.md`
10. `docs/LAVITRA.md`
11. `README.md`
12. Initial issue/task breakdown with:

- owner,
- priority,
- dependency,
- acceptance criteria,
- estimate,
- risk.

Then stop and present:

- architecture decisions,
- unresolved questions,
- risks,
- exact next actions.

Do NOT start massive implementation before the project plan is coherent.

---

# 20. IMPLEMENTATION ORDER AFTER DOC APPROVAL

When approved, implement vertically:

## Vertical Slice 1

Upload → crop → simple PFP preview → download.

## Vertical Slice 2

Full HH Goa PFP frame.

## Vertical Slice 3

Builder ID form → preview → export.

## Vertical Slice 4

Share to X.

## Vertical Slice 5

Polish:

- mobile,
- accessibility,
- performance,
- error handling,
- browser bugs,
- visual fidelity.

Every slice must remain deployable.

---

# 21. DECISION-MAKING RULES

When there is a tradeoff:

1. Mandatory requirement beats optional feature.
2. Reliability beats cleverness.
3. User clarity beats technical novelty.
4. Mobile usability beats desktop-only polish.
5. Task performance beats architecture theatre.
6. Polished two formats beat five unfinished templates.
7. Production behavior beats local-demo behavior.
8. A truthful share flow beats a fake “attached image” flow.
9. Deadline safety beats late scope expansion.

---

# 22. QUALITY BAR

The judge should be able to:

- open the URL,
- understand it immediately,
- upload a normal phone photo,
- create a visually strong HH Goa graphic,
- download it,
- share with `#FrameInGoa`,
- see zero broken states,
- feel that the team understands product design, engineering, and execution.

The repository should communicate:

- clear ownership,
- deliberate architecture,
- disciplined code,
- useful documentation,
- no hacky chaos.

---

# 23. YOUR FIRST RESPONSE TO ADITYA

Start by giving:

1. a concise understanding of the mission,
2. a list of assumptions,
3. the highest-risk technical items,
4. the exact documentation files you will generate,
5. a proposed task split for Aditya, Nitin, and Lavitra,
6. questions that are truly blocking only.

Do not ask broad questions that can be answered by reasonable defaults.
Do not over-engineer.
Do not silently change the locked stack.
Do not omit the `#FrameInGoa` requirement.
Do not forget mobile and HEIC.
Do not forget the one-submission-per-team rule for this specific task.

Then generate the documentation.
