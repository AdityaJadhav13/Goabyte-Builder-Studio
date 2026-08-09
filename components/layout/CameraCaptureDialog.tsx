'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export function CameraCaptureDialog({
  open,
  stream,
  isStarting,
  error,
  onClose,
  onRetry,
  onFallback,
  onCapture,
}: {
  readonly open: boolean
  readonly stream: MediaStream | null
  readonly isStarting: boolean
  readonly error: string | null
  readonly onClose: () => void
  readonly onRetry: () => void
  readonly onFallback: () => void
  readonly onCapture: (file: File) => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoReady, setVideoReady] = useState(false)
  const [captureError, setCaptureError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    dialogRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    const video = videoRef.current
    setVideoReady(false)
    setCaptureError(null)
    if (!video || !stream) return

    video.srcObject = stream
    void video.play().catch(() => {
      setCaptureError('The camera started, but the preview could not play. Try again.')
    })

    return () => {
      video.srcObject = null
    }
  }, [stream])

  if (!open) return null

  function captureFrame() {
    const video = videoRef.current
    if (!video || !isVideoReady || video.videoWidth === 0 || video.videoHeight === 0) {
      setCaptureError('The camera is still getting ready. Try again in a moment.')
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    if (!context) {
      setCaptureError('This browser could not capture the photo. Use the camera picker.')
      return
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        canvas.width = 0
        canvas.height = 0
        if (!blob) {
          setCaptureError('The photo could not be captured. Please try again.')
          return
        }
        onCapture(
          new File([blob], `hhgoa-camera-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          }),
        )
      },
      'image/jpeg',
      0.92,
    )
  }

  return createPortal(
    <div className="camera-dialog-backdrop" role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="camera-dialog-title"
        aria-describedby="camera-dialog-description"
        tabIndex={-1}
        className="camera-dialog"
      >
        <div className="camera-dialog-header">
          <div>
            <p className="camera-dialog-kicker">On-device camera</p>
            <h2 id="camera-dialog-title" className="camera-dialog-title">
              Take your photo
            </h2>
          </div>
          <button
            type="button"
            className="camera-close-button"
            onClick={onClose}
            aria-label="Close camera"
          >
            ×
          </button>
        </div>

        <p id="camera-dialog-description" className="camera-dialog-description">
          Centre yourself in the frame. The camera stream and captured photo stay on this
          device.
        </p>

        <div className="camera-viewport">
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="camera-video"
              onCanPlay={() => setVideoReady(true)}
              aria-label="Live camera preview"
            />
          ) : null}

          {isStarting ? (
            <div className="camera-status" role="status">
              <span className="camera-spinner" aria-hidden />
              <strong>Starting camera…</strong>
              <span>Your browser may ask for permission.</span>
            </div>
          ) : null}

          {error ? (
            <div className="camera-status camera-status--error" role="alert">
              <strong>Camera unavailable</strong>
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        {captureError ? (
          <p className="camera-inline-error" role="alert">
            {captureError}
          </p>
        ) : null}

        <div className="camera-actions">
          <button
            type="button"
            className="camera-action camera-action--quiet"
            onClick={onClose}
          >
            Cancel
          </button>

          {error ? (
            <>
              <button type="button" className="camera-action" onClick={onRetry}>
                Try again
              </button>
              <button
                type="button"
                className="camera-action camera-action--primary"
                onClick={onFallback}
              >
                Device camera picker
              </button>
            </>
          ) : (
            <button
              type="button"
              className="camera-action camera-action--primary"
              onClick={captureFrame}
              disabled={!stream || !isVideoReady || isStarting}
            >
              Capture photo
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
