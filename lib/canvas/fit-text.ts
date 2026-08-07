/**
 * Text that fits its box, whatever the user typed.
 *
 * The algorithm, in order:
 *   1. wrap at the design size, within the configured line budget
 *   2. does not fit the budget? step the size down toward a floor and retry
 *   3. still over budget at the floor? keep the allowed lines
 *   4. content was dropped? truncate with an ellipsis at a GRAPHEME boundary
 *
 * Policy (floor, max lines) is per-field and lives in layout config. This file
 * owns only the mechanism. PRD FR-028, FR-029, FR-030.
 */

export interface TextFitSpec {
  readonly text: string
  readonly fontFamily: string
  readonly fontWeight: number
  /** Starting size in design units. */
  readonly fontSize: number
  /** Smallest acceptable size before wrapping takes over. */
  readonly minFontSize: number
  readonly maxWidth: number
  readonly maxLines: number
  readonly lineHeight: number
  readonly letterSpacing?: number
}

export interface FittedText {
  readonly lines: readonly string[]
  readonly fontSize: number
  readonly lineHeight: number
  /** Widest rendered line, for callers that centre or right-align. */
  readonly width: number
  /** True when content had to be dropped — useful in tests and QA. */
  readonly truncated: boolean
}

const ELLIPSIS = '…'
const SIZE_STEP = 2

/**
 * Split into user-perceived characters, not UTF-16 code units.
 *
 * Slicing by code unit tears apart emoji ZWJ sequences (👨‍💻 → 👨 + ZWJ) and
 * Devanagari clusters, producing exactly the tofu-and-clipping failure FR-030
 * forbids. `Intl.Segmenter` is Safari 14.1+ / Chrome 87+, inside our support
 * matrix; the fallback below is worse but never broken.
 */
function graphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    return Array.from(segmenter.segment(text), (s) => s.segment)
  }
  // Array.from splits by code POINT, which at least keeps surrogate pairs
  // intact even though it can still divide a ZWJ sequence.
  return Array.from(text)
}

function applyFont(ctx: CanvasRenderingContext2D, spec: TextFitSpec, size: number): void {
  ctx.font = `${spec.fontWeight} ${size}px ${spec.fontFamily}`
  if (spec.letterSpacing !== undefined) {
    // Not supported everywhere; assigning it where it is unsupported is an
    // inert no-op rather than an error.
    ctx.letterSpacing = `${spec.letterSpacing}px`
  }
}

/** Greedy word wrap, falling back to grapheme wrap for unbroken strings. */
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): { lines: string[]; overflowed: boolean } {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  const pushCurrent = () => {
    if (current) lines.push(current)
    current = ''
  }

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
      continue
    }

    pushCurrent()

    // A single word wider than the box (a long unbroken handle, or a script
    // without spaces) must still be broken somewhere.
    if (ctx.measureText(word).width > maxWidth) {
      let chunk = ''
      for (const g of graphemes(word)) {
        if (ctx.measureText(chunk + g).width > maxWidth && chunk) {
          lines.push(chunk)
          chunk = g
        } else {
          chunk += g
        }
      }
      current = chunk
    } else {
      current = word
    }

    if (lines.length > maxLines) break
  }
  pushCurrent()

  return { lines: lines.slice(0, maxLines), overflowed: lines.length > maxLines }
}

/**
 * Trim a line to fit, appending an ellipsis, never splitting a grapheme.
 *
 * `force` matters more than it looks. Content can be dropped by the WRAPPER
 * (more lines than the budget allows) while the final surviving line still fits
 * its width comfortably. Ellipsizing only on width overflow would silently
 * discard the rest with no visual sign that anything was cut — the user would
 * never know their name was truncated.
 */
function truncate(
  ctx: CanvasRenderingContext2D,
  line: string,
  maxWidth: number,
  force: boolean,
): string {
  const fitsAsIs = ctx.measureText(line).width <= maxWidth
  if (!force && fitsAsIs) return line

  // Cheap path: the ellipsis alone still fits.
  if (ctx.measureText(line + ELLIPSIS).width <= maxWidth) {
    return `${line.trimEnd()}${ELLIPSIS}`
  }

  const units = graphemes(line)
  let result = ''
  for (const g of units) {
    if (ctx.measureText(result + g + ELLIPSIS).width > maxWidth) break
    result += g
  }
  return `${result.trimEnd()}${ELLIPSIS}`
}

export function fitText(ctx: CanvasRenderingContext2D, spec: TextFitSpec): FittedText {
  const text = spec.text.replace(/\s+/g, ' ').trim()

  if (text.length === 0) {
    return {
      lines: [],
      fontSize: spec.fontSize,
      lineHeight: spec.lineHeight,
      width: 0,
      truncated: false,
    }
  }

  const ratio = spec.lineHeight / spec.fontSize
  let size = spec.fontSize
  let best = { lines: [text], overflowed: true }

  // Wrap at full size while the line budget allows it, and shrink only when it
  // does not. For a name, two lines at 88px reads bolder and more editorial
  // than one line squeezed to 60px — the budget is the constraint, not the
  // line count.
  while (size >= spec.minFontSize) {
    applyFont(ctx, spec, size)
    const attempt = wrap(ctx, text, spec.maxWidth, spec.maxLines)
    best = attempt
    if (!attempt.overflowed) break
    size -= SIZE_STEP
  }

  size = Math.max(size, spec.minFontSize)
  applyFont(ctx, spec, size)

  const lines = best.lines.map((line, index) =>
    // Only the final permitted line gets an ellipsis; earlier lines wrapped
    // legitimately.
    index === best.lines.length - 1 && best.overflowed
      ? truncate(ctx, line, spec.maxWidth, true)
      : truncate(ctx, line, spec.maxWidth, false),
  )

  return {
    lines,
    fontSize: size,
    lineHeight: size * ratio,
    width: Math.max(0, ...lines.map((l) => ctx.measureText(l).width)),
    truncated: best.overflowed,
  }
}

/** Draw a fitted block from a top-left origin. Returns the height consumed. */
export function drawFittedText(
  ctx: CanvasRenderingContext2D,
  fitted: FittedText,
  x: number,
  topY: number,
): number {
  fitted.lines.forEach((line, index) => {
    ctx.fillText(line, x, topY + fitted.lineHeight * (index + 0.8))
  })
  return fitted.lineHeight * fitted.lines.length
}
