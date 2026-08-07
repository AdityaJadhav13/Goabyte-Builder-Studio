import type { Releasable } from '@/lib/resource/resource-slot'

/**
 * The single canonical decoded image for one upload.
 *
 * Upright, downscaled to the working cap, and opaque. Nothing downstream
 * re-reads the source File or re-applies orientation — that is what keeps
 * memory bounded on iOS (PRD R1, NFR-007) and what makes a second rotation bug
 * impossible (FR-011).
 *
 * It owns exactly one browser resource: the downscaled canvas. An object URL
 * of the same pixels used to live here too, because react-easy-crop takes a
 * URL rather than a drawable. Automatic framing (D-9) removed the cropper, and
 * with it a full PNG encode of a 2400×2400 canvas on every single upload.
 */

export interface ImageProvenance {
  readonly originalWidth: number
  readonly originalHeight: number
  readonly mimeType: string
  readonly byteSize: number
  readonly heicConverted: boolean
  readonly downscaled: boolean
}

export interface NormalizedImage extends Releasable {
  /** Drawable source for the renderer. */
  readonly source: CanvasImageSource
  readonly width: number
  readonly height: number
  readonly provenance: ImageProvenance
  readonly isReleased: boolean
}

export interface NormalizedImageInit {
  readonly source: CanvasImageSource
  readonly width: number
  readonly height: number
  readonly provenance: ImageProvenance
  /**
   * Injected so the type stays testable in Node, where canvases do not exist.
   * `normalize.ts` supplies the real browser teardown.
   */
  readonly dispose: () => void
}

/**
 * Wraps an already-created resource in an idempotent release.
 *
 * Idempotency is not defensive padding: the controller releases explicitly on
 * replacement and start-over, and the unmount safety net may release the same
 * resource again. Both paths must be safe.
 */
export function createNormalizedImage(init: NormalizedImageInit): NormalizedImage {
  let released = false

  return {
    source: init.source,
    width: init.width,
    height: init.height,
    provenance: init.provenance,
    get isReleased() {
      return released
    },
    release() {
      if (released) return
      released = true
      init.dispose()
    },
  }
}
