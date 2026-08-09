'use client'

import { useRef, useState } from 'react'
import type { BuilderFields, CrewFields } from '@/features/render/types'
import { ACCEPTED_FILE_TYPES } from '@/features/upload/accept'
import type { EditorController } from '../use-editor-controller'

export function CrewFieldsPanel({
  fields,
  crew,
  editor,
  disabled,
}: {
  readonly fields: BuilderFields
  readonly crew: CrewFields
  readonly editor: EditorController
  readonly disabled?: boolean
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const memberCount = crew.members.length + 1

  async function addFile(file: File) {
    setAdding(true)
    setError(null)
    const result = await editor.addCrewMember(file)
    setAdding(false)
    if (!result.ok) setError(result.message)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <section className="crew-builder" aria-labelledby="crew-builder-heading">
      <div className="crew-builder-heading">
        <div>
          <p className="editor-section-kicker">Build your crew · 1–4 members</p>
          <h3 id="crew-builder-heading">Crew roster</h3>
        </div>
        <span>{memberCount}/4</span>
      </div>

      <div className="crew-team-fields">
        <label>
          <span>Team / crew name</span>
          <input
            type="text"
            value={crew.teamName}
            maxLength={32}
            disabled={disabled}
            onChange={(event) => editor.setCrewFields({ teamName: event.target.value })}
            placeholder={fields.team || 'GoaByte Crew'}
          />
        </label>
        <label>
          <span>Project URL · becomes QR</span>
          <input
            type="url"
            value={crew.projectUrl}
            maxLength={180}
            disabled={disabled}
            onChange={(event) => editor.setCrewFields({ projectUrl: event.target.value })}
            placeholder="https://your-project.vercel.app"
          />
        </label>
      </div>

      <article className="crew-member-row crew-member-row--leader">
        <span className="crew-member-index">01</span>
        <div>
          <strong>{fields.name.trim() || 'Add your leader name above'}</strong>
          <small>{fields.role.trim() || 'Add the leader role above'}</small>
        </div>
        <span className="crew-leader-pill">Leader</span>
      </article>

      {crew.members.map((member, index) => (
        <article className="crew-member-row" key={member.id}>
          <span className="crew-member-index">0{index + 2}</span>
          <div className="crew-member-inputs">
            <label>
              <span>Name</span>
              <input
                type="text"
                value={member.name}
                maxLength={32}
                disabled={disabled}
                onChange={(event) =>
                  editor.setCrewMember(member.id, { name: event.target.value })
                }
              />
            </label>
            <label>
              <span>Role / title</span>
              <input
                type="text"
                value={member.role}
                maxLength={40}
                disabled={disabled}
                onChange={(event) =>
                  editor.setCrewMember(member.id, { role: event.target.value })
                }
              />
            </label>
          </div>
          <button
            type="button"
            className="crew-remove-button"
            disabled={disabled}
            onClick={() => editor.removeCrewMember(member.id)}
            aria-label={`Remove ${member.name || `crew member ${index + 2}`}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path d="M3 6h18M8 6V4h8v2m-7 4v8m6-8v8M5 6l1 15h12l1-15" />
            </svg>
          </button>
        </article>
      ))}

      <input
        ref={fileRef}
        className="sr-only"
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        disabled={disabled || adding || crew.members.length >= 3}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void addFile(file)
        }}
      />
      <button
        type="button"
        className="crew-add-button"
        disabled={disabled || adding || crew.members.length >= 3}
        onClick={() => fileRef.current?.click()}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
        {adding
          ? 'Preparing teammate…'
          : crew.members.length >= 3
            ? 'Crew complete · 4/4'
            : 'Add teammate photo'}
      </button>
      <p className="crew-builder-note">
        One true 2048×1362 crew graphic. The first photo is your leader; add up to three
        teammates.
      </p>
      {error ? (
        <p className="crew-builder-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}
