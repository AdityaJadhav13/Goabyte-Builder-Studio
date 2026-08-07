import type { AppError } from '@/lib/errors/app-error'

/**
 * Errors are signalled three independent ways — a rule, an icon, and the text
 * itself — never by colour alone (NFR-019).
 *
 * The text is `ink` on `cream` at 16.47:1. Pink appears only as the rule and
 * the glyph, because `pink-dim` on `cream` measures 4.34:1 and fails AA for
 * body text (DESIGN_SYSTEM §3.4).
 */
export function InlineError({
  error,
  action,
}: {
  readonly error: AppError
  readonly action?: React.ReactNode
}) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-l-[3px] border-pink-dim bg-cream px-4 py-3"
    >
      <span aria-hidden className="mt-0.5 text-lg leading-none text-pink-dim">
        ⚠
      </span>
      <div className="flex-1">
        <p className="text-sm leading-relaxed text-ink">{error.userMessage}</p>
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  )
}
