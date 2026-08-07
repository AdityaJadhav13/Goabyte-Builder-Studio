import type { Releasable } from '@/lib/resource/resource-slot'

/**
 * The single canonical decoded image for one upload.
 *
 * Upright, downscaled to the working cap, and opaque. Nothing downstream
 * re-reads the source File or re-applies orientation — that is what keeps
 * memory bounded on iOS (PRD R1, NFR-007) and what makes a second rotation bug
 * impossible (FR-011).
 *
 * It owns TWO browser resources and releases both together:
 *   - the downscaled canvas, used by the renderer
 *   - an object URL of that canvas, required because react-easy-crop takes a
 *     URL rather than a drawable
 *
 * One resource, one owner, one disposal (FR-015).
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
  /** Object URL of the same pixels, for the cropper. */
  readonly previewUrl: string
  readonly width: number
  readonly height: number
  readonly provenance: ImageProvenance
  readonly isReleased: boolean
}

export interface NormalizedImageInit {
  readonly source: CanvasImageSource
  readonly previewUrl: string
  readonly width: number
  readonly height: number
  readonly provenance: ImageProvenance
  /**
   * Injected so the type stays testable in Node, where neither canvases nor
   * object URLs exist. `normalize.ts` supplies the real browser teardown.
   */
  readonly dispose: () => void
}

/**
 * Wraps already-created resources in an idempotent release.
 *
 * Idempotency is not defensive padding: the controller releases explicitly on
 * replacement and start-over, and the unmount safety net may release the same
 * resource again. Both paths must be safe.
 */
export function createNormalizedImage(init: NormalizedImageInit): NormalizedImage {
  let released = false

  return {
    source: init.source,
    previewUrl: init.previewUrl,
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
