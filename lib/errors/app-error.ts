/**
 * Typed failures. Every error carries its own user-facing copy and a recovery
 * path, so no call site has to invent either.
 *
 * Copy lives here rather than in components deliberately: keeping the whole set
 * in one place is how you end up writing "That photo is 41 MB. The limit is
 * 32 MB." instead of "Upload failed."
 *
 * ARCHITECTURE §13. PRD NFR-025, FR-049.
 */

export type AppErrorCode =
  | 'FILE_EMPTY'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_TYPE'
  | 'IMAGE_TOO_SMALL'
  | 'IMAGE_TOO_LARGE'
  | 'DECODE_FAILED'
  | 'HEIC_UNSUPPORTED'
  | 'CANVAS_UNAVAILABLE'
  | 'RENDER_FAILED'
  | 'EXPORT_FAILED'

/** What the user can do next. Drives which action the error UI offers. */
export type RecoveryAction = 'choose-another-file' | 'retry' | 'none'

export interface AppError {
  readonly code: AppErrorCode
  readonly userMessage: string
  readonly recovery: RecoveryAction
  /** Developer detail. Never rendered, never transmitted — NFR-037. */
  readonly cause?: unknown
}

interface ErrorContext {
  readonly actualBytes?: number
  readonly limitBytes?: number
  readonly width?: number
  readonly height?: number
  readonly minEdge?: number
  readonly cause?: unknown
}

const megabytes = (bytes: number): string => `${(bytes / 1024 / 1024).toFixed(1)} MB`

function messageFor(code: AppErrorCode, ctx: ErrorContext): string {
  switch (code) {
    case 'FILE_EMPTY':
      return 'That file is empty. Try choosing the photo again.'
    case 'FILE_TOO_LARGE':
      return ctx.actualBytes !== undefined && ctx.limitBytes !== undefined
        ? `That photo is ${megabytes(ctx.actualBytes)}. The limit is ${megabytes(ctx.limitBytes)}.`
        : 'That photo is too large.'
    case 'UNSUPPORTED_TYPE':
      return "That file type isn't supported. Try a JPG, PNG, WebP or HEIC."
    case 'IMAGE_TOO_SMALL':
      return ctx.width !== undefined &&
        ctx.height !== undefined &&
        ctx.minEdge !== undefined
        ? `That photo is ${ctx.width}×${ctx.height}. We need at least ${ctx.minEdge}×${ctx.minEdge} for a sharp result.`
        : 'That photo is too small for a sharp result.'
    case 'IMAGE_TOO_LARGE':
      return 'That photo is too large for this browser to process. Try a smaller version.'
    case 'DECODE_FAILED':
      return "We couldn't read that photo. It may be damaged — try another one."
    case 'HEIC_UNSUPPORTED':
      return "Your browser can't read HEIC files. Open the photo in Photos, share it as JPEG, and try again."
    case 'CANVAS_UNAVAILABLE':
      return 'This browser cannot render images. Try Chrome or Safari.'
    case 'RENDER_FAILED':
      return 'Something went wrong building your image. Try again.'
    case 'EXPORT_FAILED':
      return "We couldn't save your image. Try again."
  }
}

const RECOVERY: Record<AppErrorCode, RecoveryAction> = {
  FILE_EMPTY: 'choose-another-file',
  FILE_TOO_LARGE: 'choose-another-file',
  UNSUPPORTED_TYPE: 'choose-another-file',
  IMAGE_TOO_SMALL: 'choose-another-file',
  IMAGE_TOO_LARGE: 'choose-another-file',
  DECODE_FAILED: 'choose-another-file',
  HEIC_UNSUPPORTED: 'choose-another-file',
  CANVAS_UNAVAILABLE: 'none',
  RENDER_FAILED: 'retry',
  EXPORT_FAILED: 'retry',
}

export function appError(code: AppErrorCode, ctx: ErrorContext = {}): AppError {
  const error: AppError = {
    code,
    userMessage: messageFor(code, ctx),
    recovery: RECOVERY[code],
  }
  return ctx.cause === undefined ? error : { ...error, cause: ctx.cause }
}

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'userMessage' in value &&
    'recovery' in value
  )
}
