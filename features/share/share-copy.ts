import type { OutputFormat } from '@/features/render/types'

/**
 * Share captions.
 *
 * Every authored caption goes through one factory so the submission hashtag
 * cannot be accidentally omitted or duplicated. X currently allows 280
 * characters; keeping that limit here also protects future, longer variants.
 */

export const REQUIRED_HASHTAG = '#FrameInGoa'
export const X_POST_CHARACTER_LIMIT = 280

const BODY_LIMIT = X_POST_CHARACTER_LIMIT - REQUIRED_HASHTAG.length - 1

function caption(body: string): string {
  const withoutHashtag = body
    .split(REQUIRED_HASHTAG)
    .join(' ')
    .replace(/\s+/gu, ' ')
    .trim()
  const safeBody = Array.from(withoutHashtag).slice(0, BODY_LIMIT).join('').trimEnd()

  return safeBody.length > 0 ? `${safeBody} ${REQUIRED_HASHTAG}` : REQUIRED_HASHTAG
}

const BUILDER_CAPTIONS = [
  caption(
    'My Hacker House Goa 2026 Builder ID is ready. Built with GoaByte Builder Studio.',
  ),
  caption(
    'Locked in for Hacker House Goa 2026. Building, connecting and shipping in Goa.',
  ),
] as const

const PFP_CAPTIONS = [
  caption('Fresh frame, Goa energy. My Hacker House Goa 2026 profile picture is ready.'),
  caption('New profile picture, same mission. See you at Hacker House Goa 2026.'),
] as const

const CREW_CAPTIONS = [
  caption(
    'The crew is locked in for Hacker House Goa 2026. We are building together and shipping from Goa.',
  ),
  caption('One crew, many skills, one Goa build. Meet our Hacker House Goa 2026 team.'),
] as const

/** All public variants, retained for the invariant test and future picker UI. */
export const SHARE_CAPTIONS: readonly string[] = [
  ...BUILDER_CAPTIONS,
  ...PFP_CAPTIONS,
  ...CREW_CAPTIONS,
]

/** Default remains the first variant for backwards compatibility. */
export const DEFAULT_CAPTION: string = SHARE_CAPTIONS[0]!

/** Match the copy to the graphic the user actually exported. */
export function captionForFormat(
  format: OutputFormat,
  context: { readonly name?: string; readonly team?: string } = {},
): string {
  const name = context.name?.replace(/\s+/gu, ' ').trim()
  const team = context.team?.replace(/\s+/gu, ' ').trim()

  switch (format) {
    case 'builder-card':
      if (name) {
        return caption(
          `${name}'s Hacker House Goa 2026 Builder ID is ready${team ? ` — building with ${team}` : ''}.`,
        )
      }
      return BUILDER_CAPTIONS[0]
    case 'crew':
      if (team) {
        return caption(
          `Meet ${team}, our Hacker House Goa 2026 crew. Building together and shipping from Goa.`,
        )
      }
      return CREW_CAPTIONS[0]
    case 'pfp':
      if (name) {
        return caption(`${name} just framed the Goa energy for Hacker House Goa 2026.`)
      }
      return PFP_CAPTIONS[0]
  }
}

/**
 * X compose intent. Web intents can prefill text, but cannot attach a local
 * File or blob URL; the UI therefore keeps the PNG recovery actions visible.
 */
export function buildIntentUrl(text: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}`
}
