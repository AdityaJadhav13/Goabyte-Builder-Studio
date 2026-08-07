# ADITYA.md — Team Lead / Backend / Architecture / Integration / Release Owner

## Mission

You own the correctness and delivery of the entire GoaByte submission.

Your main job is not to write every line of code. Your job is to make sure the product ships, requirements are satisfied, every member is unblocked, integration is clean, production works, and the submission is valid.

You have final ownership of:
- requirements,
- architecture,
- image engine,
- server functions,
- technical interfaces,
- code review,
- integration,
- performance decisions,
- deployment,
- release freeze,
- X/submission correctness,
- team schedule,
- final sign-off.

---

## 1. Immediate responsibilities

1. Freeze scope.
2. Create repo.
3. Set branch protections if practical.
4. Set up Next.js + TS + Tailwind + linting.
5. Create documentation folder.
6. Define architecture interfaces.
7. Establish design/engineering handoff.
8. Establish daily check-in.
9. Define release freeze.
10. Track submission checklist.

---

## 2. Image engine ownership

You own:
- image validation utilities,
- HEIC conversion strategy,
- decode/orientation strategy,
- crop-to-canvas math,
- PFP renderer,
- Builder ID renderer,
- output presets,
- font loading for canvas,
- export to Blob,
- file naming helpers,
- memory cleanup.

Keep renderers pure and configurable where possible.

Avoid a renderer that depends directly on UI component state.

---

## 3. Backend/server ownership

Use server code only when needed.

Potential server needs:
- dynamic OG/share pages,
- generated-asset hosting,
- optional telemetry endpoint.

Do not create backend infrastructure just because your role says “backend.”

If client-side processing fulfills the requirement more reliably, choose client-side.

No database unless a feature requires persistence.

---

## 4. Share architecture

The browser cannot reliably attach a generated local image directly to an X compose intent.

P0:
- export/download image,
- pre-filled X intent with `#FrameInGoa`,
- honest user instruction to attach the downloaded graphic.

Only build dynamic share links/OG images if you can make them fully reliable.

Never fake attached-image behavior.

---

## 5. Technical contracts

Define types/interfaces before parallel implementation:
- source image,
- crop rectangle,
- output mode,
- builder fields,
- render request,
- render result,
- error types.

Publish them early so Nitin can integrate without waiting.

---

## 6. Deployment

Own Vercel:
- production project,
- env configuration,
- preview deployments,
- build checks,
- production URL,
- domain if any,
- metadata,
- favicon,
- no broken environment variables.

Test production in incognito and on mobile.

---

## 7. CI / quality

Minimum gates:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

Add tests for critical utilities.

Do not allow broken main branch.

---

## 8. Daily leadership cadence

Morning:
- 15-min status
- each person: completed / today / blockers

Midday:
- integration checkpoint if needed

Evening:
- merge stable work
- deploy preview
- test one full happy path

Maintain a blocker list with owner + deadline.

---

## 9. Scope control

P0 first:
- upload
- crop
- PFP
- Builder ID
- download
- Share to X
- mobile
- error handling

Do not allow:
- auth
- profiles
- dashboards
- unnecessary DB
- fancy AI that risks delivery
- unrelated crypto feature
- late framework changes.

---

## 10. Final release process

48–24h before deadline:
- feature freeze
- regression testing
- production deployment
- external tester round
- fix only P0/P1 issues

Submission day:
- no major refactor
- verify live URL
- verify X caption
- publish final X post
- confirm exact `#FrameInGoa`
- complete one team submission
- capture screenshots of success
- archive production version/tag.

---

## 11. Definition of done for Aditya

Your work is done only when:
- all requirements are verified,
- integration is stable,
- production works,
- all teammates have completed their owned deliverables,
- X post contains `#FrameInGoa`,
- official team submission is sent once,
- evidence/screenshots are saved,
- repo and docs are clean,
- no known P0 bug remains.

You are accountable for the outcome.
