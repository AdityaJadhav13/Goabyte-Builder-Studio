'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TextField } from '@/components/ui/TextField'
import { nextTitle, suggestTitle } from '@/features/builder-title/suggest-title'
import type { BuilderFields } from '@/features/render/types'

/**
 * Builder ID fields. React Hook Form + Zod, per the locked stack.
 *
 * Lazy-loaded by EditorShell: RHF and Zod are ~20 kB gzipped between them and
 * only matter to users who choose the card format. The landing view — which is
 * the only view most visitors see — must not pay for them (NFR-002).
 *
 * Validation is deliberately permissive about CHARACTERS and strict only about
 * length. Rejecting non-ASCII would exclude most Indian names, which NITIN.md
 * §7 calls out explicitly.
 */

const MAX_NAME = 32
const MAX_ROLE = 40
const MAX_TEAM = 32
const MAX_TITLE = 28

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Add your name so the card has something to say.')
    .max(MAX_NAME, `Keep it under ${MAX_NAME} characters so it fits the card.`),
  role: z
    .string()
    .trim()
    .min(1, 'Add what you build — a Builder ID without it is half a card.')
    .max(MAX_ROLE, `Keep it under ${MAX_ROLE} characters so it fits the card.`),
  team: z
    .string()
    .trim()
    .min(1, 'Add your team name so the Builder ID is complete.')
    .max(MAX_TEAM, `Keep it under ${MAX_TEAM} characters so it fits the card.`),
  title: z.string().trim().max(MAX_TITLE),
})

type FormValues = z.infer<typeof schema>

export function BuilderFieldsForm({
  fields,
  onChange,
  disabled,
}: {
  readonly fields: BuilderFields
  readonly onChange: (fields: Partial<BuilderFields>) => void
  readonly disabled?: boolean
}) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: fields.name,
      role: fields.role,
      team: fields.team,
      title: fields.title ?? '',
    },
  })

  const values = watch()

  /**
   * Push valid values up to the editor. Debounced because the preview
   * re-renders on every change and a keystroke-rate canvas repaint is wasted
   * work on a phone (FR-040).
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({
        name: values.name,
        role: values.role,
        team: values.team,
        title: values.title.trim() === '' ? null : values.title.trim(),
      })
    }, 160)
    return () => clearTimeout(timer)
  }, [values.name, values.role, values.team, values.title, onChange])

  /**
   * Offer a deterministic suggestion once there is a name to seed it from.
   * Seeded rather than random so it never changes underfoot between the
   * preview and the download (S1-1, NFR-035).
   */
  const suggestion = suggestTitle(values.name)

  return (
    <div className="space-y-5">
      <TextField
        label="Your name"
        value={values.name}
        onChange={(v) => setValue('name', v, { shouldValidate: true })}
        error={errors.name?.message}
        maxLength={MAX_NAME}
        placeholder="Aditya Jadhav"
        disabled={disabled}
      />

      <TextField
        label="What you build"
        value={values.role}
        onChange={(v) => setValue('role', v, { shouldValidate: true })}
        error={errors.role?.message}
        maxLength={MAX_ROLE}
        placeholder="Backend · Architecture"
        disabled={disabled}
      />

      <TextField
        label="Team name"
        value={values.team}
        onChange={(v) => setValue('team', v, { shouldValidate: true })}
        error={errors.team?.message}
        maxLength={MAX_TEAM}
        placeholder="GoaByte"
        disabled={disabled}
      />

      <TextField
        label="Builder title"
        hint="Optional. Pick one, or write your own."
        value={values.title}
        onChange={(v) => setValue('title', v, { shouldValidate: true })}
        error={errors.title?.message}
        maxLength={MAX_TITLE}
        placeholder={suggestion}
        disabled={disabled}
        action={
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              setValue(
                'title',
                values.title.trim() === '' ? suggestion : nextTitle(values.title.trim()),
                { shouldValidate: true },
              )
            }
            className="text-xs font-bold tracking-wide text-yellow underline underline-offset-2 disabled:opacity-40"
          >
            {values.title.trim() === '' ? 'Suggest one' : 'Try another'}
          </button>
        }
      />
    </div>
  )
}
