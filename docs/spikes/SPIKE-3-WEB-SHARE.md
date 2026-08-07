# SPIKE-3 — Web Share behaviour & download

**Status:** ⬜ Awaiting device runs
**Owner:** Aditya · **Harness:** `/spikes/share` · **Due:** end of D0
**Decides:** `FR-051`, `FR-055`, `FR-056`, `FR-046`, the J9 download ladder, and the **exact wording** of the share UI
**Related:** `PRD.md` §11.1, J9, J10, D-7 · `ARCHITECTURE.md` §12

---

## 1. Question

When we hand the OS a PNG **and** a caption together, what actually arrives in the X compose screen?

And separately: does `<a download>` with a blob URL save a real file on iOS, or open it in a tab?

## 2. Why this decides UI copy, not just code

`FR-055` forbids claiming an image is attached when it is not. That makes this spike unusual: **its output is a sentence of user-facing copy**, and that sentence cannot be written until someone watches a real share sheet on a real phone.

Web Share Level 2 permits passing `files` and `text` together. It does **not** oblige the receiving application to use both. iOS is known to drop `text` when a file is attached. If that reproduces, the product must copy the caption to the clipboard and say so (`FR-056`) — which is a different UI, not just a different code path.

## 3. The invariant that does not depend on this spike

Whatever the result:

- `#FrameInGoa` is presented to the user, every time, on every platform.
- The fallback ladder stays. **Even if native sharing works perfectly**, download + X intent + copyable caption remains the floor, because the share sheet can be dismissed, the X app may be absent, and desktop has no Web Share at all.

This spike can only make the experience better than the floor. It can never remove the floor.

## 4. Hypotheses under test

1. **H1** — `navigator.canShare({ files })` returns true on current iOS Safari and Android Chrome.
2. **H2** — sharing `{ files, text }` to X attaches the image.
3. **H3** — sharing `{ files, text }` to X **drops the text** on iOS. _(Expected to be true — this is the one we most want disproved.)_
4. **H4** — `<a download>` with a blob URL saves a correctly-named file on iOS.
5. **H5** — `window.open` called synchronously inside the click handler is not blocked (FR-053).

## 5. Environment

| Field          | Value                                        |
| -------------- | -------------------------------------------- |
| Build / commit | _record_                                     |
| Preview URL    | _record_                                     |
| Device + OS    | _record_                                     |
| X app version  | _record_                                     |
| Signed into X? | _record — behaviour differs when logged out_ |
| Tester         | _record_                                     |

## 6. Procedure

For each of the three share modes, complete the share into X and **look at the compose screen** before recording.

1. Open `/spikes/share`.
2. **Probe capabilities** → record.
3. **Share: text only** → target X → record.
4. **Share: file only** → target X → record.
5. **Share: file + text** → target X → record.
6. Repeat step 5 targeting **WhatsApp**, to establish whether any text-dropping is X-specific or OS-wide. This distinction matters: OS-wide means our copy must be unconditional; X-specific means it can be narrower.
7. **Open X intent** → confirm `#FrameInGoa` appears intact in the compose box.
8. **Test download** → record whether a file saved and under what name.

## 7. Results

### 7.1 iPhone Safari (iOS ___) — X app ___

**Capability probe**

| Probe                       | Value |
| --------------------------- | ----- |
| `navigator.share` exists    |       |
| `navigator.canShare` exists |       |
| `canShare({ files })`       |       |
| `canShare({ files, text })` |       |
| Clipboard API               |       |

**Share attempts — observed in the X compose screen**

| Mode        | Sheet listed X? | Image attached? | Caption present? | `#FrameInGoa` intact? |
| ----------- | --------------- | --------------- | ---------------- | --------------------- |
| text only   |                 |                 |                  |                       |
| file only   |                 | n/a             |                  |                       |
| file + text |                 |                 |                  |                       |

**Same, targeting WhatsApp**

| Mode        | Image attached? | Caption present? |
| ----------- | --------------- | ---------------- |
| file + text |                 |                  |

**X intent (synchronous `window.open`)**

| Check                          | Result |
| ------------------------------ | ------ |
| Window opened (not blocked)    |        |
| Caption pre-filled             |        |
| `#FrameInGoa` present verbatim |        |

**Download**

| Check                           | Result |
| ------------------------------- | ------ |
| File saved, or opened in a tab? |        |
| Saved filename                  |        |
| Valid PNG when reopened?        |        |

### 7.2 Android Chrome ___ (device ___)

_Same tables._

### 7.3 Desktop Chrome / Safari

_Web Share is expected to be unavailable. Confirm the fallback ladder is what runs, and that the intent window is not popup-blocked._

## 8. Conclusion

_To be written after the runs._

## 9. Architecture impact — and the copy it produces

| Observed                     | Share UI copy becomes                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| File attaches, text survives | "Shared to X with your caption."                                                                                   |
| File attaches, text dropped  | "Shared. **Your caption is copied — paste it into the post.**" ← copy-to-clipboard becomes mandatory, not a nicety |
| File does not attach         | Fall through to the ladder: "Your image is downloaded — attach it to the post."                                    |
| Web Share absent             | Same as above; this is the desktop path                                                                            |

Whichever row is observed, `ARCHITECTURE.md` §12 loses its PROVISIONAL marker and the wording is fixed in `features/share/share-copy.ts`.

## 10. Requirements resolved

| Requirement        | Before            | After               |
| ------------------ | ----------------- | ------------------- |
| FR-051             | Provisional       | _record_            |
| FR-055             | Wording undecided | _record final copy_ |
| FR-056             | Provisional       | _record_            |
| FR-046 / J9 ladder | Provisional       | _record_            |
| D-7 (partial)      | Open              | _record_            |
