import { describe, expect, it } from 'vitest'
import { CREW_LAYOUT, CREW_MEMBER_LAYOUTS } from '@/features/render/templates/crew.layout'

/**
 * The crew poster is a symmetrical composition. Anything that claims to be
 * centred must actually be centred on the canvas axis — the header was 49
 * units off, which is invisible in code and obvious in the export.
 */
const AXIS = CREW_LAYOUT.canvas.width / 2

describe('crew frame alignment', () => {
  it.each([
    ['header', CREW_LAYOUT.header.centreX],
    ['team name', CREW_LAYOUT.team.centreX],
    ['kicker', CREW_LAYOUT.kicker.centreX],
    ['footer', CREW_LAYOUT.footer.centreX],
  ])('%s is centred on the canvas axis', (_label, centreX) => {
    expect(centreX).toBe(AXIS)
  })

  it.each(Object.entries(CREW_MEMBER_LAYOUTS))(
    'a %s-member roster is symmetrical about the axis',
    (_count, placements) => {
      const first = placements[0]!.centreX
      const last = placements[placements.length - 1]!.centreX
      expect((first + last) / 2).toBe(AXIS)
    },
  )

  it('keeps the header clear of the QR block', () => {
    const headerRight = CREW_LAYOUT.header.centreX + CREW_LAYOUT.header.maxWidth / 2
    expect(headerRight).toBeLessThan(CREW_LAYOUT.qr.x)
  })

  it('centres the QR caption under the QR itself', () => {
    expect(CREW_LAYOUT.qrLabel.centreX).toBe(CREW_LAYOUT.qr.x + CREW_LAYOUT.qr.size / 2)
  })
})
