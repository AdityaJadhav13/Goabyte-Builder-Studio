'use client'

import { useEffect, useState } from 'react'
import { can } from '@/lib/browser/capabilities'

const SPIKES = [
  {
    id: 'SPIKE-1',
    href: '/spikes/heic',
    title: 'HEIC / decode pipeline',
    decides: 'FR-009, FR-010',
  },
  {
    id: 'SPIKE-2',
    href: '/spikes/canvas',
    title: 'Canvas limits, memory, normalization',
    decides: 'FR-012, FR-061, NFR-007',
  },
  {
    id: 'SPIKE-3',
    href: '/spikes/share',
    title: 'Web Share behaviour & download',
    decides: 'FR-051, FR-055, FR-056, FR-046',
  },
  {
    id: 'SPIKE-4',
    href: '/spikes/fonts',
    title: 'Canvas fonts & asset preparation',
    decides: 'FR-043, FR-044, ADR-4',
  },
] as const

export default function SpikeIndex() {
  const [env, setEnv] = useState<Array<[string, string]>>([])

  useEffect(() => {
    // UA is recorded here purely as spike EVIDENCE — it identifies which device
    // produced a measurement. No application logic ever branches on it
    // (NFR-028).
    setEnv([
      ['User agent', navigator.userAgent],
      ['Viewport', `${window.innerWidth}×${window.innerHeight}`],
      ['Screen', `${screen.width}×${screen.height}`],
      ['devicePixelRatio', String(window.devicePixelRatio)],
      ['CPU cores', String(navigator.hardwareConcurrency ?? 'n/a')],
      ['Device memory (GB)', String(can.deviceMemoryGb() ?? 'n/a')],
      ['Touch points', String(navigator.maxTouchPoints)],
      ['createImageBitmap', String(can.createImageBitmap())],
      ['OffscreenCanvas', String(can.offscreenCanvas())],
      ['navigator.share', String(can.share())],
      ['navigator.canShare', String(typeof navigator.canShare === 'function')],
      ['Clipboard API', String(can.clipboard())],
      ['Intl.Segmenter', String(can.segmenter())],
    ])
  }, [])

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <p className="font-mono text-xs tracking-widest text-yellow uppercase">
        GoaByte · Day 0
      </p>
      <h1 className="mt-2 text-3xl font-bold text-cream">Technical spikes</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream-dim">
        These pages answer browser questions with measurements instead of assumptions.
        Open this URL on a real device, run each spike, and paste the copied Markdown into
        the matching file in <code className="text-yellow">docs/spikes/</code>.
      </p>

      <ul className="mt-8 space-y-3">
        {SPIKES.map((s) => (
          <li key={s.id}>
            <a
              href={s.href}
              className="block border-2 border-cream-dim/25 p-4 hover:border-yellow"
            >
              <span className="font-mono text-xs tracking-widest text-yellow">
                {s.id}
              </span>
              <span className="mt-1 block font-bold text-cream">{s.title}</span>
              <span className="mt-1 block text-xs text-cream-dim/70">
                Decides {s.decides}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-sm font-bold tracking-wider text-yellow uppercase">
        This device
      </h2>
      <div className="mt-3 overflow-x-auto border-2 border-cream-dim/25">
        <table className="w-full min-w-[30rem] text-left text-sm">
          <tbody>
            {env.map(([k, v]) => (
              <tr key={k} className="border-b border-cream-dim/15 last:border-0">
                <td className="px-3 py-2 text-cream-dim">{k}</td>
                <td className="px-3 py-2 font-mono text-xs break-all text-cream">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
