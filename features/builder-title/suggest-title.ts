/**
 * Builder titles. Curated list, deterministic default, no AI.
 *
 * An LLM here would add a network hop, a cost, a rate limit and — worst — a
 * source of non-determinism between preview and export, in exchange for
 * something a good list does better (PRD §2.4).
 *
 * The default is SEEDED FROM THE NAME so it never changes between renders. A
 * random default would make the preview a lie and re-renders unstable
 * (NFR-035, S1-1).
 */

export const BUILDER_TITLES: readonly string[] = [
  'Ships on deadline',
  'Builds in public',
  'Weekend shipper',
  'Prototype merchant',
  'Bug whisperer',
  'Latency hunter',
  'Pixel perfectionist',
  'Backend gremlin',
  'Demo-day survivor',
  'Commits at 3am',
  'Reads the docs',
  'Refactors for fun',
  'First-principles builder',
  'Deploys on Friday',
  'Terminal dweller',
  'Edge-case archaeologist',
  'Makes it work, then fast',
  'Sunrise standups',
  'Beach-office certified',
  'Coconut-powered',
]

/**
 * FNV-1a. Small, dependency-free, and stable across runtimes — which matters,
 * because the same name must produce the same title on every device.
 */
function hash(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** Deterministic suggestion for a given name. Same name ⇒ same title. */
export function suggestTitle(name: string): string {
  const key = name.trim().toLowerCase()
  if (key.length === 0) return BUILDER_TITLES[0]!
  return BUILDER_TITLES[hash(key) % BUILDER_TITLES.length]!
}

/** Next title in the list — used by the shuffle control (S1-1). */
export function nextTitle(current: string): string {
  const index = BUILDER_TITLES.indexOf(current)
  return BUILDER_TITLES[(index + 1) % BUILDER_TITLES.length]!
}
