'use client'

import { useRef, useState } from 'react'
import { FileButton, ResultTable, SpikeShell, useSpikeLog } from '../_components/spike-ui'

/**
 * SPIKE-1 — does native decode handle HEIC, and is heic2any ever needed?
 *
 * The architecture proposes native-first with a lazy heic2any fallback
 * (FR-009, FR-010). That ordering is a hypothesis about createImageBitmap
 * behaviour, not a fact. This page tests it with real camera originals.
 */
export default function HeicSpike() {
  const { entries, add, reset } = useSpikeLog()
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  async function run(file: File) {
    setBusy(true)
    reset()

    add({ label: 'File name', value: file.name })
    add({ label: 'Reported MIME', value: file.type || '(empty)' })
    add({ label: 'Size', value: `${(file.size / 1024 / 1024).toFixed(2)} MB` })

    // Magic-byte sniff — FR-003. HEIC/HEIF carry an ISO-BMFF 'ftyp' box with a
    // heic/heif/mif1 brand at byte 4. Extension and MIME both lie routinely,
    // and iOS often reports an empty type string.
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer())
    const brand = String.fromCharCode(...head.slice(4, 12))
    add({ label: 'ftyp brand (bytes 4-12)', value: brand })
    const looksHeic = /ftyp(heic|heix|hevc|mif1|msf1|heif)/i.test(brand)
    add({ label: 'Sniffed as HEIC/HEIF', value: String(looksHeic) })

    // ── Attempt 1: native decode ────────────────────────────────────────────
    let bitmap: ImageBitmap | null = null
    const t0 = performance.now()
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      const ms = performance.now() - t0
      add({
        label: 'Native createImageBitmap',
        value: `OK in ${ms.toFixed(0)}ms — ${bitmap.width}×${bitmap.height}`,
        ok: true,
        note: 'heic2any not needed on this browser',
      })
    } catch (err) {
      const ms = performance.now() - t0
      add({
        label: 'Native createImageBitmap',
        value: `FAILED after ${ms.toFixed(0)}ms — ${(err as Error).name}: ${(err as Error).message}`,
        ok: false,
      })
    }

    // ── Attempt 2: heic2any fallback, lazily imported ───────────────────────
    if (!bitmap && looksHeic) {
      const tImport = performance.now()
      try {
        const { default: heic2any } = await import('heic2any')
        add({
          label: 'heic2any dynamic import',
          value: `${(performance.now() - tImport).toFixed(0)}ms`,
          note: 'cost paid only on this path',
        })

        const tConv = performance.now()
        const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
        const jpeg = Array.isArray(out) ? out[0]! : out
        add({
          label: 'heic2any conversion',
          value: `${(performance.now() - tConv).toFixed(0)}ms → ${(jpeg.size / 1024 / 1024).toFixed(2)} MB JPEG`,
          ok: true,
        })

        const tRe = performance.now()
        bitmap = await createImageBitmap(jpeg, { imageOrientation: 'from-image' })
        add({
          label: 'Re-decode after conversion',
          value: `${(performance.now() - tRe).toFixed(0)}ms — ${bitmap.width}×${bitmap.height}`,
          ok: true,
        })
      } catch (err) {
        add({
          label: 'heic2any fallback',
          value: `FAILED — ${(err as Error).message}`,
          ok: false,
          note: 'HEIC_UNSUPPORTED path required',
        })
      }
    }

    // Resource timing tells us what heic2any actually cost over the wire.
    const res = performance
      .getEntriesByType('resource')
      .filter((r) => r.name.includes('heic'))
    for (const r of res) {
      const t = r as PerformanceResourceTiming
      add({
        label: 'heic2any transfer',
        value: `${(t.transferSize / 1024).toFixed(0)} KB over ${t.duration.toFixed(0)}ms`,
        note: t.transferSize === 0 ? 'cached or inlined' : undefined,
      })
    }

    // ── Orientation check — draw it so a human can confirm it is upright ────
    if (bitmap) {
      add({
        label: 'Aspect',
        value: bitmap.width > bitmap.height ? 'landscape' : 'portrait',
        note: 'compare against how the photo looks in your gallery',
      })
      const c = canvasRef.current
      if (c) {
        const scale = Math.min(320 / bitmap.width, 320 / bitmap.height)
        c.width = Math.round(bitmap.width * scale)
        c.height = Math.round(bitmap.height * scale)
        c.getContext('2d')?.drawImage(bitmap, 0, 0, c.width, c.height)
      }
      bitmap.close()
      add({ label: 'ImageBitmap.close()', value: 'called', ok: true })
    }

    setBusy(false)
  }

  return (
    <SpikeShell
      id="SPIKE-1"
      title="HEIC / decode pipeline"
      question="Does createImageBitmap decode a real iPhone HEIC on this browser? If not, does the lazy heic2any fallback work, how long does it take, and what does it cost to download?"
      decides="FR-009 (native decode), FR-010 (lazy heic2any) — currently PROVISIONAL"
    >
      <p className="mb-4 text-sm text-cream-dim">
        Use a <strong className="text-cream">camera original</strong>, not a re-exported
        or AirDropped copy — iOS silently transcodes HEIC to JPEG on some export paths,
        which would make this test pass for the wrong reason.
      </p>

      <div className="flex flex-wrap gap-3">
        <FileButton onFile={run} accept="image/*,.heic,.heif">
          {busy ? 'Running…' : 'Choose a photo'}
        </FileButton>
      </div>

      <p className="mt-3 text-xs text-cream-dim/70">
        Run this three times: a HEIC camera original, a normal JPG, and a PNG.
      </p>

      <canvas
        ref={canvasRef}
        className="mt-6 max-w-full border-2 border-cream-dim/25"
        aria-label="Decoded image preview — check that it is upright"
      />

      <ResultTable entries={entries} reset={reset} />
    </SpikeShell>
  )
}
