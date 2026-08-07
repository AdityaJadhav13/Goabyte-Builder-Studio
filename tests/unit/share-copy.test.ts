import { describe, expect, it } from 'vitest'
import {
  buildIntentUrl,
  DEFAULT_CAPTION,
  REQUIRED_HASHTAG,
  SHARE_CAPTIONS,
} from '@/features/share/share-copy'

/**
 * FR-050. The submission is invalid if the post does not contain the exact
 * hashtag, so it gets a test rather than a code review.
 */
describe('share captions always carry #FrameInGoa', () => {
  it('has the exact required hashtag string', () => {
    expect(REQUIRED_HASHTAG).toBe('#FrameInGoa')
  })

  it.each(SHARE_CAPTIONS)('variant contains it verbatim: %s', (caption) => {
    expect(caption).toContain('#FrameInGoa')
  })

  it('offers more than one variant so timelines are not identical (S1-4)', () => {
    expect(SHARE_CAPTIONS.length).toBeGreaterThanOrEqual(3)
    expect(new Set(SHARE_CAPTIONS).size).toBe(SHARE_CAPTIONS.length)
  })

  it('defaults to the first variant', () => {
    expect(DEFAULT_CAPTION).toBe(SHARE_CAPTIONS[0])
    expect(DEFAULT_CAPTION).toContain('#FrameInGoa')
  })

  it('uses correct casing — the brief is case-specific', () => {
    for (const caption of SHARE_CAPTIONS) {
      expect(caption).not.toContain('#frameingoa')
      expect(caption).not.toContain('#FrameinGoa')
    }
  })
})

describe('buildIntentUrl', () => {
  it('targets the current x.com compose path', () => {
    expect(buildIntentUrl('hi')).toContain('https://x.com/intent/post?text=')
  })

  it('percent-encodes the hash so the tag survives the URL', () => {
    const url = buildIntentUrl(DEFAULT_CAPTION)
    expect(url).toContain('%23FrameInGoa')
    // A raw # would truncate the query into a fragment and drop the tag.
    expect(url.split('?text=')[1]).not.toContain('#')
  })

  it('round-trips back to the original caption', () => {
    const url = buildIntentUrl(DEFAULT_CAPTION)
    const encoded = url.split('?text=')[1]!
    expect(decodeURIComponent(encoded)).toBe(DEFAULT_CAPTION)
  })

  it('does not also pass a hashtags parameter, which would duplicate the tag', () => {
    expect(buildIntentUrl(DEFAULT_CAPTION)).not.toContain('hashtags=')
  })
})
