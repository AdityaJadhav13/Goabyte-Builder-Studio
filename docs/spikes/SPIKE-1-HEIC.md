# SPIKE-1 — HEIC / decode pipeline

**Status:** ⬜ Awaiting device runs
**Owner:** Aditya · **Harness:** `/spikes/heic` · **Due:** end of D0
**Decides:** `FR-009`, `FR-010` — both currently **PROVISIONAL**
**Related:** `PRD.md` §11.1, D-7 · `ARCHITECTURE.md` §7

---

## 1. Question

Does `createImageBitmap` decode a real iPhone HEIC camera original on each target browser?

If it does, `heic2any` is dead weight and must never be downloaded. If it does not, how long does the fallback take, how much does it cost over the wire, and does it block the main thread long enough to matter on a mid-range phone?

**Why this cannot be answered from documentation:** HEIC support is a codec licensing and platform-integration question, not a web-standards question. It varies by browser, by OS version, and by whether the OS itself ships an HEIC decoder. Support tables disagree with each other, and `createImageBitmap` can fail in more than one way.

## 2. Hypothesis under test

```
HEIC/HEIF
   ↓
try createImageBitmap(file, { imageOrientation: 'from-image' })
   ↓ succeeds                          ↓ fails
NormalizedImage              await import('heic2any')
                                       ↓
                             JPEG Blob → retry decode
                                       ↓
                             NormalizedImage
```

A secondary hypothesis worth confirming: **iOS transcodes HEIC to JPEG at file-pick time** when the input's `accept` excludes HEIC. If true, most iPhone users never hit the HEIC path at all, and our `accept` attribute becomes a deliberate design lever rather than an afterthought.

## 3. Environment

| Field          | Value                            |
| -------------- | -------------------------------- |
| Build / commit | _record the deployed commit SHA_ |
| Preview URL    | _record_                         |
| Date run       | _record_                         |
| Tester         | _record_                         |

## 4. Test inputs

Use **camera originals**. A photo that has been AirDropped, re-exported, or sent through WhatsApp may already be a JPEG, which would make this spike pass for entirely the wrong reason.

| Input                                | Source                       | Notes                |
| ------------------------------------ | ---------------------------- | -------------------- |
| HEIC portrait, 12 MP                 | iPhone camera roll, original | Primary case         |
| HEIC landscape                       | iPhone camera roll, original | Orientation check    |
| HEIC with rotation applied in Photos | iPhone                       | EXIF orientation ≠ 1 |
| JPG portrait                         | Any phone                    | Control              |
| PNG                                  | Screenshot                   | Control              |

## 5. Procedure

1. Open `/spikes/heic` on the target device.
2. Select each test input in turn.
3. For each, record the printed observations **and** visually confirm the rendered preview canvas is upright — matching how the photo appears in the gallery app.
4. Tap **Copy as Markdown**, paste below.
5. Note whether `heic2any` appeared in the transfer table at all.

## 6. Results

### 6.1 iPhone Safari (iOS ___)

_Paste harness output here._

| Observation | Value | Verdict |
| ----------- | ----- | ------- |
|             |       |         |

**Upright in preview?** _yes / no_
**heic2any downloaded?** _yes / no_

### 6.2 Safari — macOS ___

_Paste harness output here._

### 6.3 Chrome — macOS ___

_Paste harness output here._

### 6.4 Android Chrome ___ (device: ___)

_Paste harness output here._

### 6.5 Firefox ___ (optional)

_Paste harness output here._

## 7. Timings summary

| Browser        | Native decode | heic2any import | heic2any convert | Total to NormalizedImage |
| -------------- | ------------- | --------------- | ---------------- | ------------------------ |
| iOS Safari     |               |                 |                  |                          |
| macOS Safari   |               |                 |                  |                          |
| macOS Chrome   |               |                 |                  |                          |
| Android Chrome |               |                 |                  |                          |

## 8. Conclusion

_To be written after the runs. State plainly whether the hypothesis held._

## 9. Architecture impact

_One of:_

- **Hypothesis held** — FR-009/FR-010 become non-provisional as written. `ARCHITECTURE.md` §7 loses its PROVISIONAL marker.
- **Native decode inconsistent** — decode strategy becomes a capability branch: attempt native, fall back on failure, selected by **probe, never by user-agent** (NFR-028). Cost: `heic2any` downloads more often than hoped; the lazy import still keeps it off the landing bundle.
- **Native decode succeeds but produces wrong orientation** — worst case. Orientation normalisation must then be verified per path rather than trusted, and FR-011 needs an explicit post-decode check.

## 10. Fallback if the spike fails outright

`heic2any` on every HEIC, lazily imported. Slower, but correct — and still never affects users who upload JPG or PNG. If `heic2any` itself proves unreliable on a target browser, the honest degradation is the `HEIC_UNSUPPORTED` error path with recovery copy telling the user to re-share the photo as JPEG from Photos, which every iPhone can do.

## 11. Requirements resolved

| Requirement   | Before      | After    |
| ------------- | ----------- | -------- |
| FR-009        | Provisional | _record_ |
| FR-010        | Provisional | _record_ |
| D-7 (partial) | Open        | _record_ |
