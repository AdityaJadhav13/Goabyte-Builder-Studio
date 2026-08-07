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

/**
 * Every family/weight/size combination the templates draw with.
 *
 * EMPTY IN SLICE 1: the placeholder renderer uses the system UI stack, which
 * needs no loading. The list — and the await below — exist now anyway, because
 * retrofitting this boundary in Slice 2 when the brand fonts arrive is exactly
 * how the FR-043 bug ships.
 *
 * Slice 2 populates this from DESIGN_SYSTEM §4.1:
 *   '400 64px "HHG Display"', '500 32px "HHG Text"', '700 32px "HHG Text"'
 */
export const REQUIRED_FACES: readonly string[] = []

export async function ensureFontsReady(): Promise<void> {
  if (REQUIRED_FACES.length === 0) return
  if (typeof document === 'undefined' || !document.fonts) return

  // Settles per face. A rejection here means a font failed to load, in which
  // case rendering proceeds with the documented fallback stack rather than
  // failing the whole export over typography.
  await Promise.allSettled(REQUIRED_FACES.map((face) => document.fonts.load(face)))
}
