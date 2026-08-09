/**
 * "What you get", shown before a photo is chosen.
 *
 * Four lines of prose were doing a job one picture does better — a visitor
 * could not see what the product produces. These are CSS miniatures rather
 * than sample images: no fake stranger's face to explain, no image bytes, and
 * nothing to keep in sync with a real export.
 *
 * Purely decorative, so it is hidden from assistive technology; the adjacent
 * copy already states all three formats.
 */
function Miniature({ variant }: { readonly variant: 'profile' | 'crew' | 'builder' }) {
  const portrait = variant === 'builder'

  return (
    <span
      className={`relative block w-[68px] overflow-hidden border-2 border-ink bg-green-900 shadow-ink-sm ${
        portrait ? 'h-[85px]' : 'h-[68px]'
      }`}
    >
      {variant === 'builder' ? (
        <>
          <i className="absolute top-1 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-cream-dim" />
          <i className="absolute top-3 right-1 left-1 h-[8px] bg-cream" />
          <i className="absolute top-6 left-1 h-[27px] w-[33px] border border-ink bg-green-700" />
          <i className="absolute top-6 right-1 h-[27px] w-[23px] bg-yellow" />
          <i className="absolute top-[54px] left-1 h-[7px] w-5 border border-ink bg-green-500" />
          <i className="absolute right-1 bottom-1 h-[17px] w-[17px] border-2 border-ink bg-cream" />
          <i className="absolute bottom-[14px] left-1 h-[4px] w-8 bg-cream" />
          <i className="absolute bottom-[7px] left-1 h-[3px] w-6 bg-cream-dim" />
        </>
      ) : variant === 'crew' ? (
        <>
          <i className="absolute inset-x-0 top-0 h-3 border-b-2 border-ink bg-cream" />
          <i className="absolute top-[18px] left-[8px] h-[31px] w-[23px] rounded-t-full border border-cream bg-green-700" />
          <i className="absolute top-[18px] right-[8px] h-[31px] w-[23px] rounded-t-full border border-cream bg-pink" />
          <i className="absolute inset-x-0 bottom-0 h-3 border-t-2 border-ink bg-yellow" />
        </>
      ) : (
        <>
          <i className="absolute inset-x-0 top-0 bottom-4 bg-green-700" />
          <i className="absolute inset-x-0 bottom-0 h-4 border-t-2 border-yellow bg-green-900" />
        </>
      )}
    </span>
  )
}

export function FormatShowcase() {
  return (
    <ul aria-hidden className="flex items-end gap-4">
      <li className="flex flex-col gap-2">
        <Miniature variant="profile" />
        <span className="text-[10px] font-bold tracking-[0.14em] text-cream-dim/70 uppercase">
          Profile picture
        </span>
      </li>
      <li className="flex flex-col gap-2">
        <Miniature variant="crew" />
        <span className="text-[10px] font-bold tracking-[0.14em] text-cream-dim/70 uppercase">
          Crew Frame
        </span>
      </li>
      <li className="flex flex-col gap-2">
        <Miniature variant="builder" />
        <span className="text-[10px] font-bold tracking-[0.14em] text-cream-dim/70 uppercase">
          Builder ID
        </span>
      </li>
    </ul>
  )
}
