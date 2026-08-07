'use client'

import { useState } from 'react'
import {
  Button,
  FileButton,
  ResultTable,
  SpikeShell,
  useSpikeLog,
} from '../_components/spike-ui'

const WORKING_MAX_EDGE = 2400 // FR-012 — the cap under test

/**
 * SPIKE-2 — canvas limits, decoded-pixel memory, and repeated normalization.
 *
 * The dangerous failure here is silent: iOS Safari caps canvas area and returns
 * a blank surface rather than throwing. Probing therefore has to WRITE a pixel
 * and READ IT BACK; allocation succeeding proves nothing.
 */
export default function CanvasSpike() {
  const { entries, add, reset } = useSpikeLog()
  const [busy, setBusy] = useState(false)

  /** Fill one pixel and read it back. The only reliable liveness test. */
  function canvasWorks(w: number, h: number): boolean {
    try {
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      if (!ctx) return false
      ctx.fillStyle = '#ff0000'
      ctx.fillRect(w - 1, h - 1, 1, 1)
      const px = ctx.getImageData(w - 1, h - 1, 1, 1).data
      const alive = px[0] === 255 && px[3] === 255
      c.width = 0 // release immediately — these probes are large
      c.height = 0
      return alive
    } catch {
      return false
    }
  }

  function probeLimits() {
    reset()
    add({ label: 'devicePixelRatio', value: String(window.devicePixelRatio) })

    for (const edge of [2048, 4096, 8192, 11180, 16384]) {
      const ok = canvasWorks(edge, edge)
      add({
        label: `Square canvas ${edge}×${edge}`,
        value: `${ok ? 'live' : 'DEAD'} (${((edge * edge) / 1e6).toFixed(1)} MP)`,
        ok,
      })
      if (!ok) break
    }

    const exportOk = canvasWorks(1080, 1350)
    add({
      label: 'Export surface 1080×1350',
      value: exportOk ? 'live' : 'DEAD',
      ok: exportOk,
    })

    const workingOk = canvasWorks(WORKING_MAX_EDGE, WORKING_MAX_EDGE)
    add({
      label: `Working cap ${WORKING_MAX_EDGE}×${WORKING_MAX_EDGE}`,
      value: workingOk ? 'live' : 'DEAD',
      ok: workingOk,
      note: workingOk ? 'FR-012 cap is safe here' : 'FR-012 cap must be lowered',
    })
  }

  /** Stepwise halving — NFR-032. A single large minification aliases badly. */
  function downscale(src: CanvasImageSource, sw: number, sh: number) {
    const ratio = Math.min(1, WORKING_MAX_EDGE / Math.max(sw, sh))
    let cw = sw
    let ch = sh
    let cur = document.createElement('canvas')
    cur.width = cw
    cur.height = ch
    cur.getContext('2d')!.drawImage(src, 0, 0, cw, ch)

    const tw = Math.round(sw * ratio)
    const th = Math.round(sh * ratio)
    let steps = 0
    while (cw > tw * 2) {
      cw = Math.max(tw, Math.round(cw / 2))
      ch = Math.max(th, Math.round(ch / 2))
      const next = document.createElement('canvas')
      next.width = cw
      next.height = ch
      next.getContext('2d')!.drawImage(cur, 0, 0, cw, ch)
      cur.width = 0
      cur.height = 0
      cur = next
      steps++
    }
    const out = document.createElement('canvas')
    out.width = tw
    out.height = th
    out.getContext('2d')!.drawImage(cur, 0, 0, tw, th)
    cur.width = 0
    cur.height = 0
    return { canvas: out, steps }
  }

  async function normalizeOnce(file: File, label: string) {
    const t0 = performance.now()
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const tDecode = performance.now() - t0

    const megapixels = (bmp.width * bmp.height) / 1e6
    add({
      label: `${label} decode`,
      value: `${tDecode.toFixed(0)}ms — ${bmp.width}×${bmp.height} (${megapixels.toFixed(1)} MP ≈ ${(megapixels * 4).toFixed(0)} MB raw)`,
      note: 'decoded pixels, not file size, are the memory risk (FR-061)',
    })

    const t1 = performance.now()
    const { canvas, steps } = downscale(bmp, bmp.width, bmp.height)
    const tScale = performance.now() - t1
    bmp.close()

    add({
      label: `${label} downscale`,
      value: `${tScale.toFixed(0)}ms in ${steps} halving step(s) → ${canvas.width}×${canvas.height}`,
      ok: Math.max(canvas.width, canvas.height) <= WORKING_MAX_EDGE,
    })

    const t2 = performance.now()
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'))
    add({
      label: `${label} toBlob(png)`,
      value: blob
        ? `${(performance.now() - t2).toFixed(0)}ms → ${(blob.size / 1024).toFixed(0)} KB`
        : 'NULL RETURNED',
      ok: !!blob,
    })

    canvas.width = 0
    canvas.height = 0
    return performance.now() - t0
  }

  async function runFile(file: File) {
    setBusy(true)
    reset()
    add({
      label: 'File',
      value: `${file.name} — ${(file.size / 1024 / 1024).toFixed(2)} MB`,
    })
    try {
      await normalizeOnce(file, 'Pass 1')
    } catch (err) {
      add({ label: 'Normalize', value: `FAILED — ${(err as Error).message}`, ok: false })
    }
    setBusy(false)
  }

  /** NFR-007 / S0-12 — five cycles is the acceptance gate, so test five. */
  async function runRepeat(file: File) {
    setBusy(true)
    reset()
    add({ label: 'Repeat-use test', value: `5 cycles of ${file.name}` })
    const mem = () => {
      const p = performance as Performance & { memory?: { usedJSHeapSize: number } }
      return p.memory
        ? `${(p.memory.usedJSHeapSize / 1048576).toFixed(0)} MB heap`
        : 'heap n/a'
    }
    add({ label: 'Heap before', value: mem() })
    for (let i = 1; i <= 5; i++) {
      try {
        const ms = await normalizeOnce(file, `Cycle ${i}`)
        add({ label: `Cycle ${i} total`, value: `${ms.toFixed(0)}ms — ${mem()}` })
      } catch (err) {
        add({
          label: `Cycle ${i}`,
          value: `FAILED — ${(err as Error).message}`,
          ok: false,
        })
        break
      }
    }
    add({
      label: 'Heap after',
      value: mem(),
      note: 'If the tab reloaded instead of reaching here, that IS the result — record it.',
    })
    setBusy(false)
  }

  return (
    <SpikeShell
      id="SPIKE-2"
      title="Canvas limits, memory, normalization"
      question="Where does this device stop allocating usable canvas surfaces, is the 2400px working cap safely inside that, and does five consecutive uploads survive without the tab being killed?"
      decides="FR-012 (2400px cap), FR-061 (decoded-pixel guard), NFR-007, S0-12"
    >
      <div className="flex flex-wrap gap-3">
        <Button onClick={probeLimits} disabled={busy}>
          Probe canvas limits
        </Button>
        <FileButton onFile={runFile} accept="image/*">
          {busy ? 'Running…' : 'Normalize one photo'}
        </FileButton>
        <FileButton onFile={runRepeat} accept="image/*">
          5× repeat-use test
        </FileButton>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-cream-dim/70">
        Use the largest photo on the device for the repeat test. If Safari reloads the tab
        mid-run, that is the finding — note which cycle it died on.
      </p>

      <ResultTable entries={entries} reset={reset} />
    </SpikeShell>
  )
}
