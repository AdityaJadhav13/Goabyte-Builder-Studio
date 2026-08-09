import { ensureFontsReady } from './fonts'
import type { OutputFormat, RenderAssets } from './types'

export const PFP_HERITAGE_PLATE_PATH = '/brand/generated/goa-pfp-plate.webp'
export const PFP_POSTCARD_PLATE_PATH = '/brand/generated/goa-pfp-postcard.webp'
export const PFP_MIDNIGHT_PLATE_PATH = '/brand/generated/goa-pfp-midnight.webp'
export const BUILDER_PLATE_PATH = '/brand/generated/goa-builder-badge.webp'
export const CREW_PLATE_PATH = '/brand/generated/goa-crew-plate.webp'

/**
 * THE asset-preparation boundary.
 *
 * All asynchrony in the render path lives here and nowhere else. Everything
 * above this line may await, retry, fail and report progress; everything below
 * it is a deterministic synchronous function of its inputs.
 *
 * That single seam is what buys preview/export parity, straightforward
 * profiling (one synchronous span to measure), lightweight recording-context
 * tests, and a clean division of labour: Nitin waits, Aditya guarantees.
 *
 * ARCHITECTURE §11, ADR-4. PRD FR-043, FR-044.
 */

/** Decoded art, keyed by format. Prepared once, reused for every render. */
const artCache = new Map<OutputFormat, ReadonlyMap<string, ImageBitmap>>()

/**
 * Static art each template draws. All paths are same-origin from `public/`:
 * a remote asset would taint the canvas and break toBlob (FR-045), and is
 * separately forbidden by the privacy invariant (NFR-037).
 *
 * Both plates are same-origin, text-free artwork. User content, exact event
 * copy and the QR are still painted deterministically by the canvas renderer.
 * Loading both plates in the initial editor preparation keeps format switching
 * synchronous: the preview can never flash a blank frame while art decodes.
 */
const PLATES = [
  PFP_HERITAGE_PLATE_PATH,
  PFP_POSTCARD_PLATE_PATH,
  PFP_MIDNIGHT_PLATE_PATH,
  BUILDER_PLATE_PATH,
  CREW_PLATE_PATH,
] as const

const ART_MANIFEST: Record<OutputFormat, readonly string[]> = {
  pfp: PLATES,
  'builder-card': PLATES,
  crew: PLATES,
}

async function loadArt(format: OutputFormat): Promise<ReadonlyMap<string, ImageBitmap>> {
  const cached = artCache.get(format)
  if (cached) return cached

  const paths = ART_MANIFEST[format]
  const entries = await Promise.all(
    paths.map(async (path): Promise<[string, ImageBitmap]> => {
      const response = await fetch(path)
      if (!response.ok) throw new Error(`asset ${path} → ${response.status}`)
      return [path, await createImageBitmap(await response.blob())]
    }),
  )

  const art: ReadonlyMap<string, ImageBitmap> = new Map(entries)
  artCache.set(format, art)
  return art
}

/**
 * Resolve everything the renderer needs. Idempotent and cached, so calling it
 * before every render costs nothing after the first.
 */
export async function prepareRenderAssets(format: OutputFormat): Promise<RenderAssets> {
  const [, art] = await Promise.all([ensureFontsReady(), loadArt(format)])
  return { fonts: 'ready', art }
}
