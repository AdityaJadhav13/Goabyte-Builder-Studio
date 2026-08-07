'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, ResultTable, SpikeShell, useSpikeLog } from '../_components/spike-ui'
import { can } from '@/lib/browser/capabilities'

const HASHTAG = '#FrameInGoa'
const CAPTION = `Just made my Hacker House Goa 2026 builder identity. Built by @GoaByte. ${HASHTAG}`

/**
 * SPIKE-3 — what does the receiving app ACTUALLY do with a shared file + text?
 *
 * Web Share Level 2 lets us hand over both. It does not oblige the target
 * application to use both, and iOS is known to drop text when a file is
 * attached. Everything about the share UI copy depends on what is observed
 * here, not on what the spec permits.
 */
export default function ShareSpike() {
  const { entries, add, reset } = useSpikeLog()
  const [png, setPng] = useState<File | null>(null)

  /** Build a real PNG so we are sharing a genuine file, not a stub. */
  const makePng = useCallback(async (): Promise<File> => {
    const c = document.createElement('canvas')
    c.width = 1080
    c.height = 1080
    const ctx = c.getContext('2d', { alpha: false })!
    ctx.fillStyle = '#0a3527'
    ctx.fillRect(0, 0, 1080, 1080)
    ctx.fillStyle = '#f9c22e'
    ctx.fillRect(60, 60, 960, 960)
    ctx.fillStyle = '#14110e'
    ctx.font = 'bold 72px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('SPIKE-3', 540, 520)
    ctx.font = '40px sans-serif'
    ctx.fillText(HASHTAG, 540, 600)
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'))
    if (!blob) throw new Error('toBlob returned null')
    return new File([blob], 'hhgoa-2026-spike-test.png', { type: 'image/png' })
  }, [])

  useEffect(() => {
    makePng()
      .then(setPng)
      .catch(() => setPng(null))
  }, [makePng])

  function probe() {
    reset()
    add({ label: 'navigator.share exists', value: String(can.share()), ok: can.share() })
    add({
      label: 'navigator.canShare exists',
      value: String(typeof navigator.canShare === 'function'),
    })
    add({
      label: 'PNG built',
      value: png ? `${(png.size / 1024).toFixed(0)} KB` : 'not ready',
    })
    if (png) {
      const filesOk = can.shareFiles([png])
      add({
        label: 'canShare({ files })',
        value: String(filesOk),
        ok: filesOk,
        note: filesOk ? 'Level 2 available' : 'Level 1 only — fallback ladder required',
      })
      add({
        label: 'canShare({ files, text })',
        value: String(
          typeof navigator.canShare === 'function' &&
            navigator.canShare({ files: [png], text: CAPTION }),
        ),
      })
    }
    add({ label: 'Clipboard API', value: String(can.clipboard()), ok: can.clipboard() })
    add({
      label: 'Caption contains hashtag',
      value: String(CAPTION.includes(HASHTAG)),
      ok: true,
    })
  }

  async function tryShare(mode: 'text' | 'file' | 'file+text') {
    if (!png && mode !== 'text') return
    const payload: ShareData =
      mode === 'text'
        ? { text: CAPTION }
        : mode === 'file'
          ? { files: [png!] }
          : { files: [png!], text: CAPTION }

    try {
      await navigator.share(payload)
      add({
        label: `share(${mode}) — resolved`,
        value: 'no error',
        ok: true,
        note: 'NOW CHECK THE TARGET APP: did the image attach? did the caption survive?',
      })
    } catch (err) {
      const e = err as Error
      add({
        label: `share(${mode})`,
        value: `${e.name}: ${e.message}`,
        ok: false,
        note: e.name === 'AbortError' ? 'user dismissed — not a failure' : undefined,
      })
    }
  }

  /**
   * FR-053 — the window must open synchronously inside the click handler.
   * Safari blocks window.open that follows an await, which is exactly why
   * export finishes before the share control enables.
   */
  function openIntent() {
    const url = `https://x.com/intent/post?text=${encodeURIComponent(CAPTION)}`
    const w = window.open(url, '_blank', 'noopener,noreferrer')
    add({
      label: 'X intent (synchronous open)',
      value: w ? 'window opened' : 'BLOCKED (returned null)',
      ok: !!w,
      note: w
        ? 'confirm #FrameInGoa is present in the compose box'
        : 'FR-054 fallback needed',
    })
    add({ label: 'Encoded hashtag', value: encodeURIComponent(HASHTAG) })
  }

  function testDownload() {
    if (!png) return
    const url = URL.createObjectURL(png)
    const a = document.createElement('a')
    a.href = url
    a.download = png.name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    add({
      label: '<a download> triggered',
      value: png.name,
      note: 'Did a FILE save, or did it open in a new tab? Check the saved filename (SPIKE-4 of PRD §11.1).',
    })
  }

  return (
    <SpikeShell
      id="SPIKE-3"
      title="Web Share behaviour & download"
      question="When we hand X a PNG and a caption together, what actually arrives? And does <a download> save a real file on iOS?"
      decides="FR-051, FR-055, FR-056 (share copy must match observed reality), FR-046, J9 ladder"
    >
      <div className="flex flex-wrap gap-3">
        <Button onClick={probe}>Probe capabilities</Button>
        <Button onClick={() => tryShare('text')}>Share: text only</Button>
        <Button onClick={() => tryShare('file')} disabled={!png}>
          Share: file only
        </Button>
        <Button onClick={() => tryShare('file+text')} disabled={!png}>
          Share: file + text
        </Button>
        <Button onClick={openIntent}>Open X intent</Button>
        <Button onClick={testDownload} disabled={!png}>
          Test download
        </Button>
      </div>

      <div className="mt-5 border-2 border-yellow/50 p-4">
        <p className="text-sm font-bold text-yellow">Record for each share attempt</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-cream-dim">
          <li>Did the share sheet list the X app?</li>
          <li>Did the image attach to the compose screen?</li>
          <li>
            Did the caption text appear — and did{' '}
            <code className="text-yellow">{HASHTAG}</code> survive intact?
          </li>
          <li>
            If text was dropped, was it dropped for file-only or also for file+text?
          </li>
          <li>
            Repeat for WhatsApp to see whether the behaviour is X-specific or OS-wide.
          </li>
        </ol>
      </div>

      <p className="mt-4 text-xs text-cream-dim/70">
        The fallback ladder stays regardless of the outcome here. Even if native sharing
        works perfectly, download + intent + copyable caption remains the floor.
      </p>

      <ResultTable entries={entries} reset={reset} />
    </SpikeShell>
  )
}
