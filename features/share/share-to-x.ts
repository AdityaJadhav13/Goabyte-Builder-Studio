import { can } from '@/lib/browser/capabilities'
import { buildIntentUrl } from './share-copy'

/**
 * The share ladder.
 *
 * PROVISIONAL — SPIKE-3 measures what the X app actually does with a shared
 * file and text. The UI copy for each outcome must match observed device
 * behaviour, never the specification (FR-055).
 *
 * Two rules that do not depend on the spike:
 *   1. `#FrameInGoa` reaches the user on every path.
 *   2. The fallback ladder stays even if native sharing works perfectly — the
 *      sheet can be dismissed, the X app may be absent, and desktop has no Web
 *      Share at all.
 *
 * We never claim an image was attached when it was not (PRD §10, FR-055).
 */

export type ShareOutcome =
  /** File and caption handed to the OS. The target app decides what it uses. */
  | { readonly kind: 'shared-file'; readonly captionCopied: boolean }
  /** User dismissed the sheet. Not a failure. */
  | { readonly kind: 'dismissed' }
  /** Compose window opened; the user must attach the downloaded image. */
  | { readonly kind: 'intent-opened'; readonly captionCopied: boolean }
  /** Popup blocked — the UI must offer a link and the caption directly. */
  | { readonly kind: 'blocked'; readonly url: string; readonly captionCopied: boolean }

async function copyCaption(caption: string): Promise<boolean> {
  if (!can.clipboard()) return false
  try {
    await navigator.clipboard.writeText(caption)
    return true
  } catch {
    return false
  }
}

/**
 * Open the X compose window.
 *
 * MUST be called synchronously inside the click handler — Safari blocks
 * `window.open` that follows an await (FR-053). This is why the share control
 * only enables once the export has already completed: the handler itself does
 * no async work before this point.
 */
export function openIntentWindow(caption: string): { opened: boolean; url: string } {
  const url = buildIntentUrl(caption)
  const win = window.open(url, '_blank', 'noopener,noreferrer')
  return { opened: win !== null, url }
}

/**
 * Try to hand the OS the real PNG plus the caption.
 *
 * The clipboard copy is not a nicety: iOS is known to drop `text` when a file
 * is attached, so the caption has to be recoverable (FR-056).
 */
export async function shareFile(file: File, caption: string): Promise<ShareOutcome> {
  const captionCopied = await copyCaption(caption)

  try {
    await navigator.share({ files: [file], text: caption })
    return { kind: 'shared-file', captionCopied }
  } catch (error) {
    // AbortError is the user closing the sheet — a choice, not a fault.
    if (error instanceof Error && error.name === 'AbortError') {
      return { kind: 'dismissed' }
    }
    throw error
  }
}

export function canShareFile(file: File): boolean {
  return can.share() && can.shareFiles([file])
}

/** Copy-only fallback for when everything else is unavailable (FR-054). */
export async function copyCaptionOnly(caption: string): Promise<boolean> {
  return copyCaption(caption)
}
