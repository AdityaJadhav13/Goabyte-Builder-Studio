# Technical spikes — Day 0

**Purpose:** eliminate browser uncertainty before Nitin and Aditya start working in parallel.

The dangerous problems in this product are not React problems. They are browser problems: HEIC decoding, iOS memory ceilings, canvas and font fidelity, file sharing, download behaviour, and deterministic rendering. Those are what D0 exists to close.

## The rule these documents enforce

```
PRD → Architecture → Explicit contracts → Spikes → Evidence → Decision → Implementation
```

Not:

```
Someone thinks something might work → everything gets built around it
```

A spike result that contradicts the plan is the spike working correctly. When that happens, the requirement is amended in `PRD.md` §13 **before** implementation begins.

## Status

| Spike                              | Question                          | Harness          | Decides                        | Status                  |
| ---------------------------------- | --------------------------------- | ---------------- | ------------------------------ | ----------------------- |
| [SPIKE-1](SPIKE-1-HEIC.md)         | Does native decode handle HEIC?   | `/spikes/heic`   | FR-009, FR-010                 | ⬜ Awaiting device runs |
| [SPIKE-2](SPIKE-2-CANVAS.md)       | Canvas limits & memory ceiling    | `/spikes/canvas` | FR-012, FR-061, NFR-007, S0-12 | ⬜ Awaiting device runs |
| [SPIKE-3](SPIKE-3-WEB-SHARE.md)    | What does X receive from a share? | `/spikes/share`  | FR-051, FR-055, FR-056, FR-046 | ⬜ Awaiting device runs |
| [SPIKE-4](SPIKE-4-FONTS-ASSETS.md) | Font readiness before canvas text | `/spikes/fonts`  | FR-043, FR-044, ADR-4          | ⬜ Awaiting device runs |

**Numbering note:** this scheme is canonical and matches `PRD.md` §11.1 as amended on 7 Aug 2026. The v0.1 PRD used a different order; it was superseded, not duplicated.

## How to run one

1. Open the Vercel preview URL on the target device — **a real device, not a desktop emulator**. Responsive mode in DevTools does not reproduce iOS memory limits, HEIC support, or share-sheet behaviour, which are the three things most likely to hurt us.
2. Go to `/spikes` and pick the spike.
3. Run each test. Record what you observe in the app, not just what the page prints — some findings (did the caption survive into the X compose box?) are only visible outside the browser.
4. Tap **Copy as Markdown** and paste into the matching document's results table.
5. Fill in **Conclusion**, **Architecture impact**, and **Requirements resolved**.
6. Flip the status above from ⬜ to ✅, or to ⚠️ if the result contradicts the plan.

## Honesty rule

An empty results table is an accurate statement that the evidence does not exist yet. A filled-in table that was not produced on a real device is worse than no spike at all, because everything downstream will be built on it.
