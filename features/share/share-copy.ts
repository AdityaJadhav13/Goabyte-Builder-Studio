/**
 * Share captions.
 *
 * PRD FR-050: every caption contains the exact literal `#FrameInGoa`. The
 * submission is invalid without it, so it is produced by a single factory that
 * appends it — no variant can be authored without it — and a unit test iterates
 * every exported variant to assert it.
 */

export const REQUIRED_HASHTAG = '#FrameInGoa'

const BODIES: readonly string[] = [
  'Just made my Hacker House Goa 2026 builder identity.',
  'Locked in for Hacker House Goa 2026. Building in Goa this October.',
  'New profile picture, same mission. See you in Goa.',
]

/** The only way to build a caption. Appending the tag is not optional. */
function caption(body: string): string {
  return `${body} ${REQUIRED_HASHTAG}`
}

export const SHARE_CAPTIONS: readonly string[] = BODIES.map(caption)

/** Default variant. Index 0 by design — see DESIGN_SYSTEM §9.1. */
export const DEFAULT_CAPTION: string = SHARE_CAPTIONS[0]!

/**
 * X compose intent.
 *
 * `x.com/intent/post` is the current path. The hashtag is embedded literally in
 * `text` rather than passed via the `hashtags` parameter — combining both is a
 * reliable way to end up with it twice.
 */
export function buildIntentUrl(text: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}`
}
