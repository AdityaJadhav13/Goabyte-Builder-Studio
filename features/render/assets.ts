import { ensureFontsReady } from './fonts'
import type { OutputFormat, RenderAssets } from './types'

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
 * EMPTY IN SLICE 1 — the placeholder template draws only shapes and text.
 * Slice 2 adds the frame art listed in DESIGN_SYSTEM §10.
 */
const ART_MANIFEST: Record<OutputFormat, readonly string[]> = {
  pfp: [],
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
