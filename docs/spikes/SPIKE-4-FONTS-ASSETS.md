# SPIKE-4 — Canvas fonts & asset preparation

**Status:** ⬜ Awaiting device runs (mechanism testable now; full confirmation needs the brand font)
**Owner:** Aditya · **Harness:** `/spikes/fonts` · **Due:** end of D0, re-run after font handoff
**Decides:** `FR-043`, `FR-044`, and validates `ADR-4` (synchronous renderer)
**Related:** `ARCHITECTURE.md` §10, §11

---

## 1. Question

Does `document.fonts.ready` leave a face the canvas needs still unloaded — and does explicit per-face `document.fonts.load()` actually fix it?

## 2. Why this spike exists

This is R2: preview and export diverging. The font variant of that bug is the nastiest because **it is invisible during development**. The page has already rendered the font in DOM text, so the preview looks perfect; the canvas then draws with a fallback face and the exported PNG ships in the wrong typeface. Nobody notices until a user posts it.

The root cause is that **CSS font loading is lazy per face.** `document.fonts.ready` resolves when currently-pending loads settle. A weight used _only_ by the canvas may never have been requested, so `ready` resolves while that face is genuinely unavailable. `document.fonts.load(spec)` per face is the only construct that guarantees availability before `fillText`.

## 3. Hypotheses under test

1. **H1** — `await document.fonts.ready` resolves while `document.fonts.check('700 64px "HHG Display"')` is still `false`. _(This is the trap. Confirming it justifies FR-043.)_
2. **H2** — `document.fonts.load(spec)` makes `check()` return true and **changes `measureText` metrics**, proving the fallback was genuinely in use before.
3. **H3** — an asset decoded via `img.decode()` can then be drawn by a purely synchronous render, with no await anywhere in the draw path (ADR-4).
4. **H4** — the two preview canvases render **visibly differently** before and after preparation. If they look identical once a real brand font is installed, font preparation is not working.

## 4. Current limitation — stated plainly

The brand font does not exist yet (D-1: original design, OFL fonts, pending Lavitra's handoff). Until `public/fonts/hhg-display.woff2` lands, this spike proves **the mechanism and the trap** — H1 and H3 — but cannot fully confirm H2 and H4.

The harness detects the font file automatically and runs the full test when present. **Re-running after handoff is a required D2 task, not optional.**

## 5. Environment

| Field               | Value                                            |
| ------------------- | ------------------------------------------------ |
| Build / commit      | _record_                                         |
| Preview URL         | _record_                                         |
| Brand font present? | _record — changes which hypotheses are testable_ |
| Device + OS         | _record_                                         |
| Tester              | _record_                                         |

## 6. Procedure

1. Open `/spikes/fonts`.
2. Run the spike.
3. Record the printed observations.
4. **Look at the two canvases.** Before/after must differ once a real font is loaded.
5. Repeat on each target browser.

## 7. Results

### 7.1 Desktop Chrome ___

| Observation                 | Value | Verdict |
| --------------------------- | ----- | ------- |
| `fonts.ready` resolve time  |       |         |
| `fonts.check()` after ready |       |         |
| `measureText` before load   |       |         |
| Brand font present          |       |         |
| `FontFace.load()` time      |       |         |
| `fonts.load(per-face)` time |       |         |
| `measureText` after load    |       |         |
| Metrics changed?            |       |         |
| Asset decode → sync render  |       |         |

**Canvases visibly different?** _yes / no / n.a. (no brand font yet)_

### 7.2 Desktop Safari ___

_Same table._

### 7.3 iPhone Safari (iOS ___)

_Same table._

### 7.4 Android Chrome ___

_Same table._

## 8. Conclusion

_To be written after the runs._

## 9. Architecture impact

- **H1 confirmed** — `ARCHITECTURE.md` §10 stands: `document.fonts.ready` is banned in the export path and `ensureFontsReady()` awaits each face explicitly. The `REQUIRED_FACES` list becomes a maintained artifact: **every font/weight the templates use must appear in it**, and a missing entry is a silent export bug. Worth a unit test that cross-references the layout configs against `REQUIRED_FACES`.
- **H1 disproved on all browsers** — `fonts.ready` would be sufficient, but we keep explicit per-face loading anyway. It is a few lines, it is correct on every browser regardless, and the failure it prevents is silent and ships to users. Cheap insurance against a bug nobody would catch in QA.
- **H2 shows unchanged metrics with a real font installed** — font is not applying at all. Investigate `@font-face` family-name mismatch first; that is the usual cause and exactly why ADR-3 rejected `next/font`'s generated names.
- **H3 fails** — ADR-4 needs revisiting. Not expected: `img.decode()` resolving before `drawImage` is well-defined.

## 10. Follow-up task created by this spike

Add `tests/unit/font-coverage.test.ts` asserting that every `fontFamily`/`weight` referenced in any `*.layout.ts` appears in `REQUIRED_FACES`. This converts "someone remembered to add the face" into a build failure — the same technique used for token parity in `ARCHITECTURE.md` §15.

## 11. Requirements resolved

| Requirement | Before                       | After                      |
| ----------- | ---------------------------- | -------------------------- |
| FR-043      | Asserted from spec reasoning | _record measured evidence_ |
| FR-044      | Asserted                     | _record_                   |
| ADR-4       | Design decision              | _record validation_        |
