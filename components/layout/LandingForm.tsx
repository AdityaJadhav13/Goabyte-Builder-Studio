'use client'

import { useId, useRef, useState, useCallback } from 'react'
import { ACCEPTED_FILE_TYPES } from '@/features/upload/accept'

/**
 * The landing form card — right column of the split-screen hero.
 *
 * Replicates the ID card generator reference: photo upload buttons at top,
 * name and designation/stack inputs, a validation hint, and a full-width
 * yellow Continue button.
 *
 * Once the user fills in the form and clicks Continue, it calls `onSubmit`
 * with the collected data, which the parent routes into the existing editor
 * pipeline.
 */
export function LandingForm({
  onSubmit,
}: {
  readonly onSubmit: (data: { file: File; name: string; role: string }) => void
}) {
  const fileInputId = useId()
  const cameraInputId = useId()

  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')

  const handleFileSelected = useCallback((file: File) => {
    setPhoto(file)
    // Create a URL for the preview thumbnail
    const url = URL.createObjectURL(file)
    setPhotoPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
  }, [])

  const handleUploadClick = useCallback(() => {
    fileRef.current?.click()
  }, [])

  const handleCameraClick = useCallback(() => {
    cameraRef.current?.click()
  }, [])

  const handleSubmit = useCallback(() => {
    if (!photo) return
    onSubmit({ file: photo, name, role })
  }, [photo, name, role, onSubmit])

  const canSubmit = photo !== null

  return (
    <div className="form-card animate-fade-up animate-delay-3">
      {/* ── Photo section ─────────────────────────────────────────── */}
      <div>
        <p className="form-section-label">Photo</p>
        {photoPreviewUrl ? (
          <div className="photo-preview-wrapper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreviewUrl} alt="Selected photo" className="photo-preview" />
            <span className="photo-preview-name">{photo?.name}</span>
            <button
              type="button"
              className="photo-change-btn"
              onClick={handleUploadClick}
            >
              Change
            </button>
          </div>
        ) : (
          <div className="photo-buttons">
            <button
              type="button"
              className="photo-btn"
              onClick={handleUploadClick}
              id="upload-photo-btn"
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
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload photo
            </button>
            <button
              type="button"
              className="photo-btn"
              onClick={handleCameraClick}
              id="take-photo-btn"
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
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Take photo
            </button>
          </div>
        )}
      </div>

      {/* ── Name field ────────────────────────────────────────────── */}
      <div>
        <label htmlFor="landing-name" className="form-section-label">
          Name
        </label>
        <input
          id="landing-name"
          type="text"
          className="form-input"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
        />
      </div>

      {/* ── Designation / Stack field ─────────────────────────────── */}
      <div>
        <label htmlFor="landing-role" className="form-section-label">
          Designation / Stack
        </label>
        <input
          id="landing-role"
          type="text"
          className="form-input"
          placeholder="e.g. Full-stack builder"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          maxLength={50}
        />
      </div>

      {/* ── Validation hint ───────────────────────────────────────── */}
      {!photo ? <p className="form-validation">Add a photo to continue.</p> : null}

      {/* ── Continue button ───────────────────────────────────────── */}
      <button
        type="button"
        className="form-submit"
        disabled={!canSubmit}
        onClick={handleSubmit}
        id="continue-btn"
      >
        Continue
      </button>

      {/* ── Hidden file inputs ────────────────────────────────────── */}
      <input
        ref={fileRef}
        id={fileInputId}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelected(file)
          e.target.value = ''
        }}
      />
      <input
        ref={cameraRef}
        id={cameraInputId}
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelected(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
