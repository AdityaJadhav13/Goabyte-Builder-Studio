/**
 * "What you get", shown before a photo is chosen.
 *
 * Four lines of prose were doing a job one picture does better — a visitor
 * could not see what the product produces. These are CSS miniatures rather
 * than sample images: no fake stranger's face to explain, no image bytes, and
 * nothing to keep in sync with a real export.
 *
 * Purely decorative, so it is hidden from assistive technology; the adjacent
 * copy already states both formats.
 */
function Miniature({ portrait }: { readonly portrait?: boolean }) {
  return (
    <span
      className={`relative block w-[68px] overflow-hidden border-2 border-ink bg-green-900 shadow-ink-sm ${
        portrait ? 'h-[85px]' : 'h-[68px]'
      }`}
    >
      {portrait ? (
        <>
          <i className="absolute top-2 right-2 bottom-8 left-2 border border-ink bg-green-700" />
          <i className="absolute bottom-[22px] left-2 h-[5px] w-9 bg-cream" />
          <i className="absolute bottom-[15px] left-2 h-[3px] w-6 bg-cream-dim" />
          <i className="absolute bottom-1.5 left-2 h-[6px] w-5 border border-ink bg-pink" />
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
    <ul aria-hidden className="flex items-end gap-6">
      <li className="flex flex-col gap-2">
        <Miniature />
        <span className="text-[10px] font-bold tracking-[0.14em] text-cream-dim/70 uppercase">
          Profile picture
        </span>
      </li>
      <li className="flex flex-col gap-2">
        <Miniature portrait />
        <span className="text-[10px] font-bold tracking-[0.14em] text-cream-dim/70 uppercase">
          Builder ID
        </span>
      </li>
    </ul>
  )
}
