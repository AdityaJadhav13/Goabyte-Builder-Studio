import { describe, expect, it } from 'vitest'
import { fitText } from '@/lib/canvas/fit-text'
import { createRecordingContext } from '@/lib/canvas/recording-context'

/**
 * Text fitting. The recording context's measureText is a linear approximation
 * (characters × size × ratio), which is exactly right for these tests: they
 * assert the DECISIONS the algorithm makes, not real font metrics.
 */

const base = {
  fontFamily: 'sans-serif',
  fontWeight: 400,
  fontSize: 88,
  minFontSize: 56,
  maxWidth: 952,
  maxLines: 2,
  lineHeight: 92,
}

const fit = (text: string, overrides: Partial<typeof base> = {}) =>
  fitText(createRecordingContext().ctx, { ...base, ...overrides, text })

describe('fitText', () => {
  it('leaves a short name at the design size on one line', () => {
    const result = fit('Aditya')
    expect(result.fontSize).toBe(base.fontSize)
    expect(result.lines).toEqual(['Aditya'])
    expect(result.truncated).toBe(false)
  })

  it('wraps at full size while the line budget allows it', () => {
    // Two lines at 88px reads bolder than one line squeezed to 60px, so the
    // budget is what constrains the layout — not the line count.
    const result = fit('Aditya Jadhav Ramchandra Kulkarni')
    expect(result.fontSize).toBe(base.fontSize)
    expect(result.lines.length).toBe(2)
    expect(result.truncated).toBe(false)
  })

  it('shrinks only once the line budget is exceeded', () => {
    const overBudget = fit('Aditya Jadhav Ramchandra Kulkarni Deshpande Venkatesh')
    expect(overBudget.fontSize).toBeLessThan(base.fontSize)
    expect(overBudget.lines.length).toBeLessThanOrEqual(base.maxLines)
  })

  it('never goes below the configured floor', () => {
    const result = fit('A'.repeat(200))
    expect(result.fontSize).toBeGreaterThanOrEqual(base.minFontSize)
  })

  it('respects the line budget', () => {
    const result = fit('one two three four five six seven eight nine ten eleven twelve')
    expect(result.lines.length).toBeLessThanOrEqual(base.maxLines)
  })

  it('truncates with an ellipsis when even the floor cannot fit', () => {
    const result = fit('supercalifragilistic '.repeat(12))
    expect(result.truncated).toBe(true)
    expect(result.lines.at(-1)).toContain('…')
  })

  it('breaks an unbroken string too long for the box', () => {
    const result = fit('a'.repeat(400), { maxLines: 2 })
    expect(result.lines.length).toBeGreaterThan(0)
    expect(result.lines.length).toBeLessThanOrEqual(2)
  })

  it('returns nothing for empty input rather than a blank line', () => {
    expect(fit('   ').lines).toEqual([])
    expect(fit('').lines).toEqual([])
  })

  it('collapses newlines and runs of whitespace', () => {
    expect(fit('Aditya\n\n  Jadhav').lines).toEqual(['Aditya Jadhav'])
  })

  it('scales lineHeight with the chosen size, preserving the ratio', () => {
    const result = fit('Aditya Jadhav Kumar Singh')
    expect(result.lineHeight / result.fontSize).toBeCloseTo(
      base.lineHeight / base.fontSize,
    )
  })
})

describe('grapheme safety — FR-030', () => {
  it('never splits an emoji ZWJ sequence when truncating', () => {
    // 👨‍💻 is man + ZWJ + laptop. A code-unit slice would leave a bare ZWJ or a
    // lone surrogate, which renders as tofu.
    const result = fit('👨‍💻'.repeat(60), { maxLines: 1 })
    const rendered = result.lines.join('')
    expect(rendered).not.toContain('‍…')
    expect(rendered.endsWith('…')).toBe(true)
    // No unpaired surrogates survived the cut.
    expect(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(rendered)).toBe(false)
    expect(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(rendered)).toBe(false)
  })

  it('keeps Devanagari clusters intact', () => {
    const result = fit('आदित्य '.repeat(40), { maxLines: 1 })
    expect(result.lines.join('')).not.toMatch(/^[ऀ-ःा-ॏ]/)
  })

  it('handles a name that is entirely emoji', () => {
    const result = fit('🚀🔥🌴')
    expect(result.lines.length).toBe(1)
  })
})
