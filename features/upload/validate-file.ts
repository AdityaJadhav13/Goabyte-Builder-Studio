import { appError, type AppError } from '@/lib/errors/app-error'
import { isSupportedFormat, sniffFile, type ImageFormat } from '@/lib/image/sniff-format'

/**
 * PRE-DECODE validation. Everything knowable from the raw file and nothing else.
 *
 * This stage deliberately makes no claim about pixels. A 2 MB JPEG can decode
 * to 60 megapixels and a 20 MB PNG can be 800×600 — file size is a cheap first
 * filter, not the memory guard (PRD FR-061, D-6). Dimension checks live in
 * `validate-decoded-image.ts` and run after decode, where they are real.
 */

export type ValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: AppError }

export const ok = <T>(value: T): ValidationResult<T> => ({ ok: true, value })
export const fail = <T>(error: AppError): ValidationResult<T> => ({ ok: false, error })

/** FR-004. A first filter against absurd inputs, not a memory guarantee. */
export const MAX_FILE_BYTES = 32 * 1024 * 1024

export async function validateRawFile(
  file: File,
): Promise<ValidationResult<ImageFormat>> {
  if (file.size === 0) {
    return fail(appError('FILE_EMPTY'))
  }

  if (file.size > MAX_FILE_BYTES) {
    return fail(
      appError('FILE_TOO_LARGE', { actualBytes: file.size, limitBytes: MAX_FILE_BYTES }),
    )
  }

  const format = await sniffFile(file)
  if (!isSupportedFormat(format)) {
    return fail(appError('UNSUPPORTED_TYPE', { cause: `sniffed as ${format}` }))
  }

  return ok(format)
}
