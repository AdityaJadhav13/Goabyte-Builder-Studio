'use client'

import { useCallback, useState } from 'react'

export interface Entry {
  label: string
  value: string
  /** true = supports our hypothesis, false = contradicts it, null = neutral fact */
  ok?: boolean | null
  note?: string
}

/**
 * Accumulates spike observations and renders them as a copyable Markdown table.
 *
 * The copy button matters more than it looks: the tester is on a phone with no
 * devtools, and the result has to reach `docs/spikes/*.md` intact. Retyping
 * numbers off a screenshot is how spike evidence gets corrupted.
 */
export function useSpikeLog() {
  const [entries, setEntries] = useState<Entry[]>([])
  const add = useCallback((e: Entry) => setEntries((prev) => [...prev, e]), [])
  const reset = useCallback(() => setEntries([]), [])
  return { entries, add, reset }
}

export function ResultTable({ entries, reset }: { entries: Entry[]; reset: () => void }) {
  const [copied, setCopied] = useState(false)

  const markdown = [
    '| Observation | Value | Verdict |',
    '| --- | --- | --- |',
    ...entries.map(
      (e) =>
        `| ${e.label} | \`${e.value}\` | ${
          e.ok === true ? '✅' : e.ok === false ? '❌' : '—'
        }${e.note ? ` ${e.note}` : ''} |`,
    ),
    '',
    `_Captured ${new Date().toISOString()}_`,
    `_UA: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a'}_`,
  ].join('\n')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  if (entries.length === 0) {
    return (
      <p className="mt-6 border-2 border-dashed border-cream-dim/30 p-4 text-sm text-cream-dim/70">
        No observations yet. Run a test above.
      </p>
    )
  }

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold tracking-wider text-yellow uppercase">
          Observations
        </h2>
        <div className="flex gap-2">
          <button
            onClick={copy}
            className="border-2 border-yellow bg-yellow px-3 py-1.5 text-sm font-bold text-ink"
          >
            {copied ? 'Copied' : 'Copy as Markdown'}
          </button>
          <button
            onClick={reset}
            className="border-2 border-cream-dim/40 px-3 py-1.5 text-sm font-semibold text-cream-dim"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto border-2 border-cream-dim/25">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <tbody>
            {entries.map((e, i) => (
              <tr key={i} className="border-b border-cream-dim/15 last:border-0">
                <td className="px-3 py-2 align-top text-cream-dim">{e.label}</td>
                <td className="px-3 py-2 align-top font-mono text-xs break-all text-cream">
                  {e.value}
                </td>
                <td className="px-3 py-2 align-top">
                  {e.ok === true ? '✅' : e.ok === false ? '❌' : '—'}
                  {e.note ? (
                    <span className="block text-xs text-cream-dim/70">{e.note}</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function SpikeShell({
  id,
  title,
  question,
  decides,
  children,
}: {
  id: string
  title: string
  question: string
  decides: string
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <a href="/spikes" className="text-xs text-yellow underline underline-offset-2">
        ← all spikes
      </a>
      <p className="mt-4 font-mono text-xs tracking-widest text-yellow uppercase">{id}</p>
      <h1 className="mt-1 text-3xl font-bold text-cream">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-cream-dim">{question}</p>
      <p className="mt-2 text-xs text-cream-dim/70">
        <strong className="text-cream-dim">Decides:</strong> {decides}
      </p>
      <hr className="my-6 border-cream-dim/20" />
      {children}
    </main>
  )
}

export function Button({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="border-2 border-ink bg-yellow px-4 py-2.5 text-sm font-bold text-ink shadow-ink-sm disabled:opacity-40"
    >
      {children}
    </button>
  )
}

export function FileButton({
  onFile,
  accept,
  children,
}: {
  onFile: (f: File) => void
  accept: string
  children: React.ReactNode
}) {
  return (
    <label className="inline-block cursor-pointer border-2 border-ink bg-yellow px-4 py-2.5 text-sm font-bold text-ink shadow-ink-sm">
      {children}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </label>
  )
}
