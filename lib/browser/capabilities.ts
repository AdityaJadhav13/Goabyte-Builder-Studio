/**
 * Feature detection. Never user-agent sniffing (NFR-028).
 *
 * UA strings lie, and a UA-conditioned code path is untestable and rots. Every
 * capability below has a defined degraded path in ARCHITECTURE §14 that lands
 * on something that works, never on something broken.
 *
 * ARCHITECTURE §4 R-1: this module is pure and framework-free, so every probe
 * is written to be safe when `window` does not exist (SSR, unit tests).
 */

const hasWindow = (): boolean => typeof window !== 'undefined'

export const can = {
  /** Offscreen rendering for export. Degrades to a detached <canvas>. */
  offscreenCanvas: (): boolean => hasWindow() && typeof OffscreenCanvas !== 'undefined',

  /** Preferred decode path. Degrades to HTMLImageElement + canvas normalize. */
  createImageBitmap: (): boolean =>
    hasWindow() && typeof createImageBitmap === 'function',

  /** Web Share Level 1 — text only. */
  share: (): boolean => hasWindow() && typeof navigator.share === 'function',

  /**
   * Web Share Level 2 — the actual PNG. Must be probed with a real File:
   * `navigator.canShare` returns false for file payloads on platforms that
   * only support Level 1, and there is no other way to tell them apart.
   */
  shareFiles: (files: readonly File[]): boolean =>
    hasWindow() && typeof navigator.canShare === 'function'
      ? navigator.canShare({ files: [...files] })
      : false,

  /** Caption fallback. Degrades to a selectable text field (FR-054). */
  clipboard: (): boolean =>
    hasWindow() && typeof navigator.clipboard?.writeText === 'function',

  /**
   * Grapheme-safe truncation (FR-030). Slicing by UTF-16 code unit splits
   * emoji ZWJ sequences and Devanagari clusters. Degrades to code-point
   * slicing, which is worse but not broken.
   */
  segmenter: (): boolean =>
    typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function',

  /** Non-standard, Chromium-only. Used for spike reporting, never for logic. */
  deviceMemoryGb: (): number | null => {
    if (!hasWindow()) return null
    const nav = navigator as Navigator & { deviceMemory?: number }
    return typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null
  },
} as const
