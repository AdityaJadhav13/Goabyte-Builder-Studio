import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: Variant
}

/**
 * Hard offset shadow, no blur, tight radius — DESIGN_SYSTEM §5. A blurred
 * shadow anywhere in this product is a bug.
 *
 * Min height 48px keeps it above the 44px tap-target floor (NFR-010).
 */
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-yellow text-ink border-ink shadow-ink-sm hover:bg-yellow-dim active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
  secondary:
    'bg-transparent text-cream border-cream-dim/50 hover:border-yellow hover:text-yellow',
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      // Explicit: a bare <button> inside a form defaults to submit, which
      // would make Download reload the page the day one of these moves into
      // the fields form.
      type="button"
      {...props}
      className={cn(
        'inline-flex min-h-12 items-center justify-center border-2 px-5 py-3',
        'text-base font-bold tracking-[0.02em] transition-[background-color,color,border-color,transform,box-shadow] duration-150',
        'disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none',
        VARIANTS[variant],
        className,
      )}
    />
  )
}
