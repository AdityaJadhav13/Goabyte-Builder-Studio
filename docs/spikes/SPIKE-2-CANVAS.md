# SPIKE-2 — Canvas limits, memory, normalization

**Status:** ⬜ Awaiting device runs
**Owner:** Aditya · **Harness:** `/spikes/canvas` · **Due:** end of D0
**Decides:** `FR-012` (2400 px working cap), `FR-061` (decoded-pixel guard), `NFR-007`, acceptance gate `S0-12`
**Related:** `PRD.md` §11.1, D-6 · `ARCHITECTURE.md` §7

---

## 1. Question

Where does this device stop producing _usable_ canvas surfaces, is the 2400 px working cap safely inside that limit, and does five consecutive uploads of a large photo survive without the tab being killed?

**Why this is the highest-stakes spike.** R1 in the risk register is "iOS Safari tab memory kill," and its failure mode is indistinguishable from a crash to a judge. If a reviewer's tab reloads mid-flow, the submission reads as broken regardless of how good the output is.

## 2. The measurement trap this spike avoids

iOS Safari caps canvas area and **fails silently** — allocation succeeds, drawing appears to succeed, and the surface is blank. Any probe that only checks `canvas.width = n` without error is measuring nothing.

The harness therefore writes a pixel and reads it back:

```ts
ctx.fillRect(w - 1, h - 1, 1, 1)
const px = ctx.getImageData(w - 1, h - 1, 1, 1).data
const alive = px[0] === 255 && px[3] === 255
```

Only a pixel that survives a round trip proves the surface is real.

## 3. Hypotheses under test

1. **H1** — 2400 px working cap (FR-012) is comfortably inside the usable limit on every target device.
2. **H2** — export surfaces (1080×1080, 1080×1350) are trivially safe everywhere.
3. **H3** — decoded pixel count, not file size, governs memory pressure (FR-061). A 15 MB JPEG can decode to hundreds of MB of raw pixels; a 30 MB PNG may decode to less.
4. **H4** — with `ImageBitmap.close()` and stepwise release, five cycles stay inside the NFR-007 budget of 250 MB.

## 4. Environment

| Field          | Value    |
| -------------- | -------- |
| Build / commit | _record_ |
| Preview URL    | _record_ |
| Device + OS    | _record_ |
| Date run       | _record_ |
| Tester         | _record_ |

## 5. Procedure

1. Open `/spikes/canvas` on the device.
2. **Probe canvas limits** — record the largest square surface that survives the pixel round trip.
3. **Normalize one photo** — use the largest photo available on the device.
4. **5× repeat-use test** — same photo, five cycles.
5. If the tab reloads at any point, **that is the result.** Record which cycle it died on; do not retry until it passes and report the passing run.

## 6. Results

### 6.1 iPhone Safari (iOS ___) — device ___

**Canvas limit probe**

| Surface                 | Live? | Notes |
| ----------------------- | ----- | ----- |
| 2048×2048               |       |       |
| 4096×4096               |       |       |
| 8192×8192               |       |       |
| 11180×11180             |       |       |
| 16384×16384             |       |       |
| 1080×1350 (export)      |       |       |
| 2400×2400 (working cap) |       |       |

**Largest usable surface:** ___ px² ≈ ___ MP

**Single-photo normalization**

| Stage                     | Time | Result |
| ------------------------- | ---- | ------ |
| decode                    |      |        |
| downscale (halving steps) |      |        |
| toBlob(png)               |      |        |

**5× repeat test**

| Cycle | Total time | Heap after | Survived? |
| ----- | ---------- | ---------- | --------- |
| 1     |            |            |           |
| 2     |            |            |           |
| 3     |            |            |           |
| 4     |            |            |           |
| 5     |            |            |           |

**Tab reloaded?** _yes (cycle __) / no_

### 6.2 Android Chrome ___ (device ___)

_Same tables._

### 6.3 Desktop Safari ___

_Same tables._

### 6.4 Desktop Chrome ___

_Same tables._

## 7. Conclusion

_To be written after the runs._

## 8. Architecture impact

_One of:_

- **H1 holds** — FR-012 stands at 2400 px. `ARCHITECTURE.md` §7 keeps the cap as written.
- **H1 fails** — lower `WORKING_MAX_EDGE` until it sits at most half the measured usable edge, and record the new value in `features/render/types.ts` with a comment citing this document. Note the quality consequence: a lower cap reduces supersampling headroom for tight crops, which interacts with FR-062's soft-quality warning threshold.
- **H4 fails** — investigate what is retained before adding infrastructure. **Do not introduce Web Workers or an offscreen render pool on suspicion** (master prompt §12: do not introduce performance complexity before measuring). The likely causes in order: an un-`close()`d `ImageBitmap`, an un-revoked object URL, a retained canvas whose `width`/`height` were not zeroed, or React state holding a previous `NormalizedImage`.

## 9. Explicitly out of scope for this spike

Web Workers, `OffscreenCanvas` rendering off the main thread, WASM decoders, and streaming decode. All are premature until this spike shows a measured problem that the simple path cannot solve.

## 10. Requirements resolved

| Requirement | Before          | After                  |
| ----------- | --------------- | ---------------------- |
| FR-012      | Proposed cap    | _record_               |
| FR-061      | Proposed        | _record_               |
| NFR-007     | Budget asserted | _record measured peak_ |
| S0-12       | Untested gate   | _record pass/fail_     |
