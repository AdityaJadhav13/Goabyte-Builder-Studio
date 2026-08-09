'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { CameraCaptureDialog } from '@/components/layout/CameraCaptureDialog'
import { FormatShowcase } from '@/components/layout/FormatShowcase'
import { ACCEPTED_FILE_TYPES } from '@/features/upload/accept'
import { MAX_FILE_BYTES } from '@/features/upload/validate-file'

const MAX_FILE_MB = Math.round(MAX_FILE_BYTES / 1024 / 1024)

function cameraErrorCopy(cause: unknown): string {
  if (!window.isSecureContext) {
    return 'Live camera access requires HTTPS. Use the device camera picker instead.'
  }
  if (cause instanceof DOMException) {
    if (cause.name === 'NotAllowedError' || cause.name === 'SecurityError') {
      return 'Camera permission was blocked. Allow camera access in your browser settings and try again.'
    }
    if (cause.name === 'NotFoundError' || cause.name === 'DevicesNotFoundError') {
      return 'No camera was found on this device.'
    }
    if (cause.name === 'NotReadableError' || cause.name === 'TrackStartError') {
      return 'Another app may be using the camera. Close it and try again.'
    }
  }
  return 'The browser could not start the live camera. Try the device camera picker.'
}

/**
 * The first-step UI. It collects only information the existing editor can
 * consume: one photo plus optional Builder ID fields. Validation, decoding and
 * normalization remain owned by the editor pipeline.
 */
export function LandingForm({
  onSubmit,
}: {
  readonly onSubmit: (data: {
    file: File
    name: string
    role: string
    team: string
  }) => void
}) {
  const fileInputId = useId()
  const cameraInputId = useId()

  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string | null>(null)
  const dragDepth = useRef(0)
  const cameraRequestIdRef = useRef(0)
  const cameraStreamRef = useRef<MediaStream | null>(null)

  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [team, setTeam] = useState('GoaByte')
  const [isDragActive, setDragActive] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraStarting, setCameraStarting] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      cameraRequestIdRef.current += 1
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
      cameraStreamRef.current = null
    },
    [],
  )

  const handleFileSelected = useCallback((file: File) => {
    setPhoto(file)
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(file)
    previewUrlRef.current = url
    setPhotoPreviewUrl(url)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!photo) return
    onSubmit({ file: photo, name, role, team })
  }, [photo, name, role, team, onSubmit])

  const closeCamera = useCallback(() => {
    cameraRequestIdRef.current += 1
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
    cameraStreamRef.current = null
    setCameraStream(null)
    setCameraStarting(false)
    setCameraError(null)
    setCameraOpen(false)
  }, [])

  const openCamera = useCallback(async () => {
    const requestId = cameraRequestIdRef.current + 1
    cameraRequestIdRef.current = requestId
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
    cameraStreamRef.current = null
    setCameraStream(null)
    setCameraError(null)
    setCameraStarting(true)
    setCameraOpen(true)

    if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      if (cameraRequestIdRef.current === requestId) {
        setCameraStarting(false)
        setCameraError(cameraErrorCopy(null))
      }
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
      })

      if (cameraRequestIdRef.current !== requestId) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      cameraStreamRef.current = stream
      setCameraStream(stream)
    } catch (cause) {
      if (cameraRequestIdRef.current === requestId) {
        setCameraError(cameraErrorCopy(cause))
      }
    } finally {
      if (cameraRequestIdRef.current === requestId) setCameraStarting(false)
    }
  }, [])

  const handleCameraCapture = useCallback(
    (file: File) => {
      handleFileSelected(file)
      closeCamera()
    },
    [closeCamera, handleFileSelected],
  )

  const openDeviceCameraPicker = useCallback(() => {
    closeCamera()
    cameraRef.current?.click()
  }, [closeCamera])

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      dragDepth.current = 0
      setDragActive(false)

      /*
       * Take the first file and let the canonical pipeline judge it (FR-003).
       * Filtering on `candidate.type` here rejected HEIC outright: macOS and
       * iOS routinely report an EMPTY type string for it, so a dropped iPhone
       * photo matched nothing and the drop silently did nothing — no error, no
       * feedback. Reported MIME is exactly the signal our magic-byte sniffing
       * exists to distrust, and type decisions belong to validation, not here.
       * A genuinely unsupported file now produces a specific, recoverable
       * error instead of silence.
       */
      const file = event.dataTransfer.files.item(0)
      if (file) handleFileSelected(file)
    },
    [handleFileSelected],
  )

  const canSubmit = photo !== null

  return (
    <div className="form-card animate-fade-up animate-delay-3">
      <div className="form-output-proof">
        <div>
          <p className="form-section-label">Three ready-to-post formats</p>
          <p className="form-helper">Profile picture, Crew Frame and Builder ID.</p>
        </div>
        <FormatShowcase />
      </div>

      <div
        className="landing-upload-zone"
        data-dragging={isDragActive ? 'true' : 'false'}
        onDragEnter={(event) => {
          event.preventDefault()
          dragDepth.current += 1
          setDragActive(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => {
          dragDepth.current -= 1
          if (dragDepth.current <= 0) setDragActive(false)
        }}
        onDrop={handleDrop}
      >
        <div className="form-section-heading">
          <p className="form-section-label">1 · Add your photo</p>
          <span className="form-step-status">
            JPG · PNG · WEBP · HEIC · {MAX_FILE_MB} MB
          </span>
        </div>

        {photoPreviewUrl ? (
          <div className="photo-preview-wrapper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreviewUrl} alt="Selected photo" className="photo-preview" />
            <span className="photo-preview-name">
              <strong>Photo ready</strong>
              <small>{photo?.name}</small>
            </span>
            <button
              type="button"
              className="photo-change-btn"
              onClick={() => fileRef.current?.click()}
            >
              Change
            </button>
          </div>
        ) : (
          <div className="photo-empty-state">
            <p className="photo-drop-copy">
              {isDragActive ? 'Drop your photo here' : 'Drag and drop a photo here'}
            </p>
            <p className="form-helper">or choose how you want to add it</p>

            <div className="photo-buttons">
              <button
                type="button"
                className="photo-btn photo-btn--primary"
                onClick={() => fileRef.current?.click()}
                id="upload-photo-btn"
                aria-label="Upload photo from device"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Browse photos
              </button>
              <button
                type="button"
                className="photo-btn"
                onClick={() => void openCamera()}
                id="take-photo-btn"
                aria-label="Take photo with camera"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Use camera
              </button>
            </div>
          </div>
        )}

        <p className="privacy-note">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          Processed in your browser. Your photo is never uploaded.
        </p>
        <p className="upload-format-note">
          JPG, PNG, WebP or HEIC · up to {MAX_FILE_MB} MB
        </p>
      </div>

      <div className="builder-details-group">
        <div className="form-section-heading">
          <div>
            <p className="form-section-label">2 · Builder details</p>
            <p className="form-helper">Used only for your Builder ID.</p>
          </div>
          <span className="form-optional-badge">Optional</span>
        </div>

        <div className="builder-fields-grid">
          <div>
            <label htmlFor="landing-name" className="form-field-label">
              Name
            </label>
            <input
              id="landing-name"
              type="text"
              className="form-input"
              placeholder="Your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={32}
            />
          </div>

          <div>
            <label htmlFor="landing-role" className="form-field-label">
              Role / stack
            </label>
            <input
              id="landing-role"
              type="text"
              className="form-input"
              placeholder="e.g. AI · React"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              maxLength={40}
            />
          </div>

          <div className="builder-team-field">
            <label htmlFor="landing-team" className="form-field-label">
              Team name
            </label>
            <input
              id="landing-team"
              type="text"
              className="form-input"
              placeholder="Your team"
              value={team}
              onChange={(event) => setTeam(event.target.value)}
              maxLength={32}
            />
          </div>
        </div>
      </div>

      <p className="form-validation" aria-live="polite">
        {photo
          ? 'Photo ready — we’ll frame it automatically.'
          : 'Add a photo to create your graphic.'}
      </p>

      <button
        type="button"
        className="form-submit"
        disabled={!canSubmit}
        onClick={handleSubmit}
        id="continue-btn"
      >
        <span>Create my graphic</span>
        <span aria-hidden>→</span>
      </button>

      <input
        ref={fileRef}
        id={fileInputId}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) handleFileSelected(file)
          event.target.value = ''
        }}
      />
      <input
        ref={cameraRef}
        id={cameraInputId}
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            handleFileSelected(file)
            closeCamera()
          }
          event.target.value = ''
        }}
      />

      <CameraCaptureDialog
        open={cameraOpen}
        stream={cameraStream}
        isStarting={cameraStarting}
        error={cameraError}
        onClose={closeCamera}
        onRetry={() => void openCamera()}
        onFallback={openDeviceCameraPicker}
        onCapture={handleCameraCapture}
      />
    </div>
  )
}
