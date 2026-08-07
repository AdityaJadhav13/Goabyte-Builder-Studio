'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { ExportedGraphic } from '@/features/editor/editor-state'
import { DEFAULT_CAPTION, REQUIRED_HASHTAG } from '../share-copy'
import { canShareFile, copyCaptionOnly, openIntentWindow, shareFile } from '../share-to-x'

/**
 * Share to X.
 *
 * The one rule this component exists to honour: we describe what ACTUALLY
 * happened, never what we hoped would happen (PRD §10, FR-055). Each branch
 * below sets its own status line, and the "attach it yourself" wording is used
 * whenever we cannot prove the image was attached.
 *
 * PROVISIONAL — SPIKE-3 measures what the X app really does with a shared file
 * and caption. The wording here is written to be true under every outcome the
 * spike can produce, but it should be revisited once there is evidence.
 */
export function SharePanel({ exported }: { readonly exported: ExportedGraphic }) {
  const [status, setStatus] = useState<string | null>(null)
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null)
  const [caption] = useState(DEFAULT_CAPTION)

  const nativeAvailable = canShareFile(exported.file)

  /**
   * Native path. Async, so it cannot open a popup — which is fine, because the
   * share sheet is not a popup. The intent path below stays synchronous.
   */
  async function handleNativeShare() {
    setBlockedUrl(null)
    try {
      const outcome = await shareFile(exported.file, caption)
      if (outcome.kind === 'dismissed') {
        setStatus(null)
        return
      }
      setStatus(
        outcome.captionCopied
          ? 'Shared. Your caption is copied — paste it if X did not fill it in.'
          : 'Shared. Add the caption yourself if X did not fill it in.',
      )
    } catch {
      setStatus('Sharing was not available. Use the X button below instead.')
    }
  }

  /**
   * FR-053: window.open must be called synchronously inside the handler.
   * Safari blocks it after an await, which is why the caption is copied AFTER
   * the window opens rather than before.
   */
  function handleIntent() {
    const { opened, url } = openIntentWindow(caption)
    void copyCaptionOnly(caption).then((copied) => {
      if (opened) {
        setStatus(
          copied
            ? 'Compose window opened and your caption is copied. Attach the image you just downloaded.'
            : 'Compose window opened. Attach the image you just downloaded.',
        )
      }
    })
    if (!opened) {
      setBlockedUrl(url)
      setStatus('Your browser blocked the popup. Use the link below.')
    }
  }

  return (
    <section
      aria-labelledby="share-heading"
      className="border-2 border-cream-dim/25 bg-green-900 p-5"
    >
      <h2
        id="share-heading"
        className="text-xs font-bold tracking-[0.18em] text-yellow uppercase"
      >
        Share it
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-cream-dim">
        Your caption already includes{' '}
        <span className="font-bold text-cream">{REQUIRED_HASHTAG}</span>.
      </p>

      <p className="mt-3 border-l-2 border-green-600 bg-green-800 px-3 py-2 font-mono text-xs leading-relaxed break-words text-cream-dim select-all">
        {caption}
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        {nativeAvailable ? (
          <Button onClick={handleNativeShare}>Share image</Button>
        ) : null}
        <Button
          variant={nativeAvailable ? 'secondary' : 'primary'}
          onClick={handleIntent}
        >
          Post on X
        </Button>
      </div>

      {/* aria-live so the outcome is announced, not just displayed. */}
      <p aria-live="polite" className="mt-3 min-h-5 text-sm text-cream">
        {status}
      </p>

      {blockedUrl ? (
        <a
          href={blockedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold text-yellow underline underline-offset-2"
        >
          Open X in a new tab
        </a>
      ) : null}

      {!nativeAvailable ? (
        <p className="mt-3 text-xs leading-relaxed text-cream-dim/70">
          Your browser can&rsquo;t attach the image to a post automatically, so attach the
          file you just downloaded. We won&rsquo;t pretend otherwise.
        </p>
      ) : null}
    </section>
  )
}
