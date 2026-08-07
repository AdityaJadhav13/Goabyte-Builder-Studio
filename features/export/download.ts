/**
 * Get the file onto the user's device.
 *
 * PROVISIONAL — the iOS behaviour of `<a download>` is what SPIKE-3 measures.
 * It can fail by opening the image in a new tab instead of saving, which
 * throws nothing and returns nothing to detect, so there is no way to branch on
 * it. Slice 4 adds the Web Share rung above this one and a long-press
 * affordance below it; both are out of scope today.
 *
 * PRD FR-046, FR-048, J9.
 */

/**
 * Object URLs pin their blob in memory until revoked. The delay gives the
 * browser time to start the download before the URL becomes invalid — revoking
 * synchronously after click() cancels the download on some browsers.
 */
const REVOKE_DELAY_MS = 60_000

export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.rel = 'noopener'

  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS)
}
