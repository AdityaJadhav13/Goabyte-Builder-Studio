/**
 * A CanvasRenderingContext2D stand-in that records every call.
 *
 * Renderer tests assert LAYOUT DECISIONS — where things were drawn, at what
 * size, in what order — rather than pixels. That satisfies PRD D-5 (verify
 * layout decisions and rendered content, never file hashes), runs in Node in
 * milliseconds, needs no node-canvas native dependency, and is stable across
 * every platform.
 *
 * ARCHITECTURE §16.2, ADR-5.
 */

export interface RecordedCall {
  readonly method: string
  readonly args: readonly unknown[]
  /** Style state at the moment of the call — what was actually drawn. */
  readonly fillStyle: string
  readonly strokeStyle: string
  readonly lineWidth: number
  readonly font: string
}

export interface RecordingContext {
  readonly ctx: CanvasRenderingContext2D
  readonly calls: readonly RecordedCall[]
  callsOf(method: string): readonly RecordedCall[]
}

/** Rough advance width. Enough for layout assertions; not a font engine. */
const APPROX_GLYPH_RATIO = 0.55

export function createRecordingContext(): RecordingContext {
  const calls: RecordedCall[] = []

  const fontSizeOf = (font: string): number =>
    Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? 10)

  /**
   * Style properties must be read from the recorder itself, not from a
   * captured snapshot: callers assign to `ctx.fillStyle`, so a separate state
   * object would never see the change and every recorded call would carry the
   * initial value.
   */
  const record = (method: string, ...args: unknown[]): void => {
    calls.push({
      method,
      args,
      fillStyle: String(recorder.fillStyle),
      strokeStyle: String(recorder.strokeStyle),
      lineWidth: recorder.lineWidth,
      font: recorder.font,
    })
  }

  const recorder = {
    fillStyle: '#000000' as string | CanvasGradient | CanvasPattern,
    strokeStyle: '#000000' as string | CanvasGradient | CanvasPattern,
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    globalCompositeOperation: 'source-over',
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    letterSpacing: '0px',
    globalAlpha: 1,

    save: () => record('save'),
    restore: () => record('restore'),
    setTransform: (...a: unknown[]) => record('setTransform', ...a),
    translate: (...a: unknown[]) => record('translate', ...a),
    scale: (...a: unknown[]) => record('scale', ...a),

    fillRect: (...a: unknown[]) => record('fillRect', ...a),
    strokeRect: (...a: unknown[]) => record('strokeRect', ...a),
    clearRect: (...a: unknown[]) => record('clearRect', ...a),
    drawImage: (...a: unknown[]) => record('drawImage', ...a),
    fillText: (...a: unknown[]) => record('fillText', ...a),
    strokeText: (...a: unknown[]) => record('strokeText', ...a),

    beginPath: () => record('beginPath'),
    closePath: () => record('closePath'),
    moveTo: (...a: unknown[]) => record('moveTo', ...a),
    lineTo: (...a: unknown[]) => record('lineTo', ...a),
    arc: (...a: unknown[]) => record('arc', ...a),
    arcTo: (...a: unknown[]) => record('arcTo', ...a),
    ellipse: (...a: unknown[]) => record('ellipse', ...a),
    quadraticCurveTo: (...a: unknown[]) => record('quadraticCurveTo', ...a),
    bezierCurveTo: (...a: unknown[]) => record('bezierCurveTo', ...a),
    rect: (...a: unknown[]) => record('rect', ...a),
    fill: () => record('fill'),
    stroke: () => record('stroke'),
    clip: () => record('clip'),

    createLinearGradient: (...a: unknown[]) => {
      record('createLinearGradient', ...a)
      // Gradients are opaque to layout assertions; a token stand-in keeps the
      // call recorded without pretending to model colour interpolation.
      return { addColorStop: () => {} } as unknown as CanvasGradient
    },

    measureText: (text: string) => ({
      width: text.length * fontSizeOf(recorder.font) * APPROX_GLYPH_RATIO,
    }),
  }

  return {
    ctx: recorder as unknown as CanvasRenderingContext2D,
    calls,
    callsOf: (method) => calls.filter((call) => call.method === method),
  }
}
