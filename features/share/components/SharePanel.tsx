'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { ExportedGraphic } from '@/features/editor/editor-state'
import type { PreparationStatus } from '@/features/editor/use-prepared-graphic'
import { saveBlob } from '@/features/export/download'
import { DESIGN, type OutputFormat } from '@/features/render/types'
import { captionForFormat, REQUIRED_HASHTAG } from '../share-copy'
import {
  canCopyPngToClipboard,
  canShareFile,
  copyCaptionOnly,
  copyPngToClipboard,
  openIntentWindow,
  shareFile,
} from '../share-to-x'

/** Always-visible, capability-based share controls for the current canvas. */
export function SharePanel({
  graphic,
  format,
  preparation,
  error,
  name,
  team,
}: {
  readonly graphic: ExportedGraphic | null
  readonly format: OutputFormat
  readonly preparation: PreparationStatus
  readonly error?: string | null
  readonly name?: string
  readonly team?: string
}) {
  const [status, setStatus] = useState<string | null>(null)
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null)
  const [captionCopied, setCaptionCopied] = useState(false)
  const [pngCopied, setPngCopied] = useState(false)
  const caption = captionForFormat(format, { name, team })
  const nativeAvailable = graphic ? canShareFile(graphic.file, caption) : false
  const pngClipboardAvailable = graphic ? canCopyPngToClipboard(graphic.file) : false
  const ready = preparation === 'ready' && graphic !== null

  useEffect(() => {
    setStatus(null)
    setBlockedUrl(null)
  }, [graphic?.objectUrl, format])

  async function handleNativeShare() {
    if (!graphic) return
    setBlockedUrl(null)
    try {
      const outcome = await shareFile(graphic.file, caption)
      if (outcome.kind === 'dismissed') {
        setStatus('Share cancelled. Your image and caption are still ready here.')
        return
      }
      setStatus(
        outcome.captionCopied
          ? 'Image sent to the app you chose. The caption is copied as a backup.'
          : 'Image sent to the app you chose. The caption remains below as a backup.',
      )
    } catch {
      setStatus('The share sheet could not open. Use the X compose button instead.')
    }
  }

  /** Open X synchronously, then use the same activation to copy the PNG. */
  function handleIntent() {
    if (!graphic) return
    const { opened, url } = openIntentWindow(caption)
    setBlockedUrl(opened ? null : url)

    if (pngClipboardAvailable) {
      void copyPngToClipboard(graphic.file).then((copied) => {
        setPngCopied(copied)
        setStatus(
          opened
            ? copied
              ? 'X compose is ready with your caption. Paste once to attach the copied PNG.'
              : `X compose is ready. Attach ${graphic.file.name} before posting.`
            : copied
              ? 'The X window was blocked, but the PNG is copied. Use the direct link below.'
              : 'The X window was blocked. Use the direct link and attach the prepared PNG.',
        )
      })
      return
    }

    void copyCaptionOnly(caption).then((copied) => {
      setCaptionCopied(copied)
      setStatus(
        opened
          ? `X compose is ready with your caption. Attach ${graphic.file.name} before posting.`
          : copied
            ? 'The X window was blocked, but your caption is copied. Use the link below.'
            : 'Your browser blocked the X window. Use the direct link below.',
      )
    })
  }

  function handleCaptionCopy() {
    void copyCaptionOnly(caption).then((copied) => {
      setCaptionCopied(copied)
      setStatus(
        copied
          ? 'Caption copied.'
          : 'Copying is blocked here — select the caption above instead.',
      )
      if (copied) setTimeout(() => setCaptionCopied(false), 2500)
    })
  }

  function handlePngCopy() {
    if (!graphic) return
    void copyPngToClipboard(graphic.file).then((copied) => {
      setPngCopied(copied)
      setStatus(
        copied
          ? 'PNG copied. Open X and paste it into the compose window.'
          : 'The PNG could not be copied. Download it and attach the file instead.',
      )
      if (copied) setTimeout(() => setPngCopied(false), 2500)
    })
  }

  return (
    <section aria-labelledby="share-heading" className="share-panel">
      <div className="share-panel-heading">
        <div>
          <p className="editor-section-kicker">Share without downloading</p>
          <h2 id="share-heading">Post your build</h2>
        </div>
        <span data-ready={ready ? 'true' : 'false'}>
          {preparation === 'preparing' ? 'Preparing' : ready ? 'Image ready' : 'Waiting'}
        </span>
      </div>

      <div className="share-panel-preview">
        {graphic ? (
          // A same-origin blob URL stays entirely on-device.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={graphic.objectUrl}
            alt={`Prepared ${graphic.file.name}`}
            width={DESIGN[format].width}
            height={DESIGN[format].height}
          />
        ) : (
          <div className="share-panel-placeholder" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 4h16v16H4zM7 15l3-3 2 2 2-2 3 3M8 9h.01" />
            </svg>
          </div>
        )}
        <div>
          <strong>
            {preparation === 'preparing'
              ? 'Rendering the latest edit…'
              : graphic?.file.name || 'Complete the required details'}
          </strong>
          <p>
            Native share sends the real PNG and caption together. Desktop X opens with the
            caption ready and copies the PNG when the browser allows it.
          </p>
        </div>
      </div>

      <p className="share-panel-caption select-all">{caption}</p>
      <p className="share-panel-hashtag">
        Required tag: <strong>{REQUIRED_HASHTAG}</strong>
      </p>

      <div className="share-panel-actions">
        {nativeAvailable ? (
          <Button onClick={handleNativeShare} disabled={!ready}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path d="M12 16V3m0 0L7 8m5-5 5 5M5 13v7h14v-7" />
            </svg>
            Share image
          </Button>
        ) : null}
        <Button onClick={handleIntent} disabled={!ready}>
          <span aria-hidden="true" className="share-x-mark">
            X
          </span>
          {ready ? 'Post on X' : 'Preparing X post…'}
        </Button>
        {pngClipboardAvailable ? (
          <Button variant="secondary" onClick={handlePngCopy} disabled={!ready}>
            {pngCopied ? 'PNG copied' : 'Copy PNG'}
          </Button>
        ) : null}
        <Button variant="secondary" onClick={handleCaptionCopy}>
          {captionCopied ? 'Caption copied' : 'Copy caption'}
        </Button>
        {graphic ? (
          <Button
            variant="secondary"
            onClick={() => saveBlob(graphic.file, graphic.file.name)}
          >
            Download PNG
          </Button>
        ) : null}
      </div>

      {preparation === 'error' ? (
        <p className="share-panel-error" role="alert">
          {error}
        </p>
      ) : null}
      <p aria-live="polite" className="share-panel-status">
        {status}
      </p>
      {blockedUrl ? (
        <a href={blockedUrl} target="_blank" rel="noopener noreferrer">
          Open X in a new tab
        </a>
      ) : null}
    </section>
  )
}
