'use client'

import { useRef, useState } from 'react'
import { Button, ResultTable, SpikeShell, useSpikeLog } from '../_components/spike-ui'

const TEST_FAMILY = 'HHG Display'
const FONT_URL = '/fonts/hhg-display.woff2'
const SAMPLE = 'Builder Studio 2026'

/**
 * SPIKE-4 — canvas font readiness and asset preparation.
 *
 * Two things are being proven:
 *   1. `document.fonts.ready` is NOT sufficient before canvas text (FR-043).
 *      CSS font loading is lazy per face; `ready` can resolve while a face the
 *      canvas needs has never been requested. This is the single most common
 *      cause of "preview looks right, export is in Times New Roman".
 *   2. The prepare-then-render-synchronously boundary works (ADR-4).
 */
export default function FontSpike() {
  const { entries, add, reset } = useSpikeLog()
  const beforeRef = useRef<HTMLCanvasElement>(null)
  const afterRef = useRef<HTMLCanvasElement>(null)
  const [busy, setBusy] = useState(false)

  function measure(family: string): number {
    const c = document.createElement('canvas')
    const ctx = c.getContext('2d')!
    ctx.font = `700 64px "${family}", serif`
    return ctx.measureText(SAMPLE).width
  }

  function paint(
    ref: React.RefObject<HTMLCanvasElement | null>,
    family: string,
    label: string,
  ) {
    const c = ref.current
    if (!c) return
    c.width = 640
    c.height = 120
    const ctx = c.getContext('2d', { alpha: false })!
    ctx.fillStyle = '#f7efe1'
    ctx.fillRect(0, 0, 640, 120)
    ctx.fillStyle = '#14110e'
    ctx.font = `700 44px "${family}", serif`
    ctx.fillText(SAMPLE, 20, 60)
    ctx.font = '16px sans-serif'
    ctx.fillStyle = '#0a3527'
    ctx.fillText(label, 20, 100)
  }

  async function run() {
    setBusy(true)
    reset()

    // ── 1. The trap: fonts.ready resolves regardless ────────────────────────
    const t0 = performance.now()
    await document.fonts.ready
    add({
      label: 'await document.fonts.ready',
      value: `resolved in ${(performance.now() - t0).toFixed(1)}ms`,
      note: 'resolves even when a face the canvas needs is absent — this is the trap',
    })

    const checkedBefore = document.fonts.check(`700 64px "${TEST_FAMILY}"`)
    add({
      label: `fonts.check("${TEST_FAMILY}") after ready`,
      value: String(checkedBefore),
      ok: !checkedBefore ? false : null,
      note: !checkedBefore
        ? 'CONFIRMS the trap: ready resolved but the face is unavailable'
        : 'face already present',
    })

    const widthBefore = measure(TEST_FAMILY)
    add({
      label: 'measureText width (before load)',
      value: `${widthBefore.toFixed(1)}px`,
    })
    paint(beforeRef, TEST_FAMILY, 'BEFORE prepare — fallback metrics')

    // ── 2. Is a real brand font available yet? ──────────────────────────────
    let fontPresent = false
    try {
      const head = await fetch(FONT_URL, { method: 'HEAD' })
      fontPresent = head.ok
      add({
        label: 'Brand font file present',
        value: `${FONT_URL} → ${head.status}`,
        ok: head.ok,
        note: head.ok ? undefined : 'awaiting Lavitra handoff — re-run this spike then',
      })
    } catch {
      add({ label: 'Brand font file present', value: 'fetch failed', ok: false })
    }

    // ── 3. Explicit per-face load — the actual fix (FR-043) ─────────────────
    if (fontPresent) {
      const tLoad = performance.now()
      try {
        const face = new FontFace(TEST_FAMILY, `url(${FONT_URL}) format('woff2')`, {
          weight: '700',
        })
        await face.load()
        document.fonts.add(face)
        add({
          label: 'FontFace.load() + fonts.add()',
          value: `${(performance.now() - tLoad).toFixed(0)}ms`,
          ok: true,
        })
      } catch (err) {
        add({
          label: 'FontFace.load()',
          value: `FAILED — ${(err as Error).message}`,
          ok: false,
        })
      }

      const tExplicit = performance.now()
      await document.fonts.load(`700 64px "${TEST_FAMILY}"`)
      add({
        label: 'document.fonts.load(per-face)',
        value: `${(performance.now() - tExplicit).toFixed(1)}ms`,
        ok: true,
        note: 'this is what must be awaited before every export',
      })

      const widthAfter = measure(TEST_FAMILY)
      add({
        label: 'measureText width (after load)',
        value: `${widthAfter.toFixed(1)}px`,
        ok: widthAfter !== widthBefore,
        note:
          widthAfter !== widthBefore
            ? 'metrics changed — proves the divergence is real and the fix works'
            : 'identical width: font may have failed to apply',
      })
      paint(afterRef, TEST_FAMILY, 'AFTER prepare — real face')
    } else {
      paint(afterRef, 'serif', 'no brand font yet — mechanism test only')
    }

    // ── 4. Asset decode, then a purely synchronous render (ADR-4) ───────────
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><circle cx="100" cy="100" r="90" fill="%23ef3e76"/></svg>`
    const tAsset = performance.now()
    try {
      const img = new Image()
      img.src = `data:image/svg+xml;utf8,${svg}`
      await img.decode()
      const tDecoded = performance.now() - tAsset

      // Everything above was async PREPARATION. The render below is synchronous
      // and touches nothing but already-resolved inputs — the whole point of
      // the prepareRenderAssets() boundary.
      const tRender = performance.now()
      const c = document.createElement('canvas')
      c.width = 200
      c.height = 200
      c.getContext('2d')!.drawImage(img, 0, 0)
      add({
        label: 'SVG asset decode() → sync drawImage',
        value: `decode ${tDecoded.toFixed(1)}ms, render ${(performance.now() - tRender).toFixed(2)}ms`,
        ok: true,
        note: 'render is synchronous once assets are prepared',
      })
    } catch (err) {
      add({
        label: 'Asset decode',
        value: `FAILED — ${(err as Error).message}`,
        ok: false,
      })
    }

    add({ label: 'fonts.status', value: document.fonts.status })
    setBusy(false)
  }

  return (
    <SpikeShell
      id="SPIKE-4"
      title="Canvas fonts & asset preparation"
      question="Does document.fonts.ready leave a canvas-needed face unloaded, does explicit per-face load fix it, and does the prepare-then-render-sync boundary hold?"
      decides="FR-043 (per-face font load), FR-044 (asset preload), ADR-4 (synchronous renderer)"
    >
      <Button onClick={run} disabled={busy}>
        {busy ? 'Running…' : 'Run font & asset spike'}
      </Button>

      <p className="mt-3 text-xs leading-relaxed text-cream-dim/70">
        Until Lavitra ships <code className="text-yellow">{FONT_URL}</code> this proves
        the mechanism and the trap. Re-run it after the font lands to confirm the fix end
        to end.
      </p>

      <div className="mt-6 space-y-3">
        <canvas ref={beforeRef} className="max-w-full border-2 border-cream-dim/25" />
        <canvas ref={afterRef} className="max-w-full border-2 border-cream-dim/25" />
      </div>
      <p className="mt-2 text-xs text-cream-dim/70">
        If these two render identically once the brand font exists, font preparation is
        not working — and every export would ship in a fallback face.
      </p>

      <ResultTable entries={entries} reset={reset} />
    </SpikeShell>
  )
}
