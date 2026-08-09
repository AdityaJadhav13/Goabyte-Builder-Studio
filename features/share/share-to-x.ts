import { can } from '@/lib/browser/capabilities'
import { buildIntentUrl } from './share-copy'

/**
 * The browser can hand a file to the operating-system share sheet, but it
 * cannot select X or confirm what the receiving app retained. Outcomes here
 * describe only what this page can prove.
 */
export type ShareOutcome =
  | { readonly kind: 'shared-file'; readonly captionCopied: boolean }
  | { readonly kind: 'dismissed' }

export interface IntentOutcome {
  readonly opened: boolean
  readonly url: string
}

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
 * Open a real, detectable popup synchronously, detach its opener, then
 * navigate it to X. Passing `noopener` in windowFeatures makes Chromium return
 * null even when it opened the tab, which cannot be used to detect blocking.
 */
export function openIntentWindow(caption: string): IntentOutcome {
  const url = buildIntentUrl(caption)
  const popup = window.open('about:blank', '_blank')

  if (!popup) return { opened: false, url }

  try {
    popup.opener = null
    popup.location.replace(url)
    return { opened: true, url }
  } catch {
    // Navigation can still be denied by an embedded browser policy.
    popup.close()
    return { opened: false, url }
  }
}

/**
 * Hand the real PNG and caption to the system share sheet.
 *
 * Both privileged calls are STARTED in the click task before either promise is
 * awaited. Awaiting clipboard.writeText first loses transient user activation
 * in Safari and can prevent navigator.share from opening at all. File sharing
 * is started first because it is the primary action; the caption remains
 * visible if the secondary clipboard operation is rejected.
 */
export async function shareFile(file: File, caption: string): Promise<ShareOutcome> {
  const sharePromise = navigator.share({ files: [file], text: caption })
  const captionPromise = copyCaption(caption)

  try {
    await sharePromise
    return { kind: 'shared-file', captionCopied: await captionPromise }
  } catch (error) {
    // Always settle the internally caught clipboard attempt before returning.
    await captionPromise
    if (error instanceof Error && error.name === 'AbortError') {
      return { kind: 'dismissed' }
    }
    throw error
  }
}

/** Probe the exact payload that will be shared rather than files alone. */
export function canShareFile(file: File, caption: string): boolean {
  if (!can.share() || typeof navigator.canShare !== 'function') return false
  try {
    return navigator.canShare({ files: [file], text: caption })
  } catch {
    return false
  }
}

/** Copy-only fallback for blocked popups or omitted native-share text. */
export async function copyCaptionOnly(caption: string): Promise<boolean> {
  return copyCaption(caption)
}

/**
 * Image clipboard writes are a progressive enhancement for desktop Chromium
 * and other secure contexts that expose ClipboardItem. They are never treated
 * as proof that X received an attachment.
 */
export function canCopyPngToClipboard(file: File): boolean {
  if (
    typeof window === 'undefined' ||
    !window.isSecureContext ||
    typeof ClipboardItem === 'undefined' ||
    typeof navigator.clipboard?.write !== 'function' ||
    file.type !== 'image/png'
  ) {
    return false
  }

  try {
    return (
      typeof ClipboardItem.supports !== 'function' || ClipboardItem.supports('image/png')
    )
  } catch {
    return false
  }
}

export async function copyPngToClipboard(file: File): Promise<boolean> {
  if (!canCopyPngToClipboard(file)) return false
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': file })])
    return true
  } catch {
    return false
  }
}
