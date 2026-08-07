/**
 * Canvas font readiness.
 *
 * `document.fonts.ready` is NOT used and must not be. CSS font loading is lazy
 * per face: `ready` resolves once currently-pending loads settle, which can
 * include none of the faces the canvas needs. A weight used only by the
 * renderer may never have been requested at all when `ready` resolves — and
 * the export then ships in a fallback face while the preview looks correct.
 *
 * `document.fonts.load(spec)` per face is the only construct that actually
 * guarantees availability before fillText. PRD FR-043, ARCHITECTURE §10,
 * demonstrated by SPIKE-4.
 */

export const FONT_DISPLAY = 'HHG Display'
export const FONT_TEXT = 'HHG Text'

/**
 * Fallbacks are metric-adjacent rather than arbitrary: if a face fails to
 * load, the layout degrades instead of collapsing. Templates read these, so
 * canvas and CSS can never reference a different stack.
 */
export const FONT_STACK = {
  display: `"${FONT_DISPLAY}", Georgia, "Times New Roman", serif`,
  text: `"${FONT_TEXT}", ui-sans-serif, system-ui, -apple-system, sans-serif`,
} as const

/**
 * Every family/weight the templates draw with.
 *
 * `document.fonts.load` matches on family and weight; the size in the spec is
 * required by the CSS font shorthand grammar but does not affect which face
 * loads. Keep this list in step with the templates — a missing entry is a
 * SILENT export bug, which is why `tests/unit/font-coverage.test.ts` asserts
 * every weight used by any layout config appears here.
 */
export const REQUIRED_FACES: readonly string[] = [
  `400 64px "${FONT_DISPLAY}"`,
  `500 32px "${FONT_TEXT}"`,
  `700 32px "${FONT_TEXT}"`,
]

let readyOnce: Promise<void> | null = null

export async function ensureFontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return

  // Cached: called before every preview render and every export, so it must be
  // free after the first resolution.
  readyOnce ??= (async () => {
    // allSettled, not all: a font that fails to load must degrade to the
    // fallback stack, not fail the whole export over typography.
    await Promise.allSettled(REQUIRED_FACES.map((face) => document.fonts.load(face)))
  })()

  return readyOnce
}
