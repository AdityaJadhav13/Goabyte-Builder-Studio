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

export const BUILDER_TITLES = [
  {
    id: 'protocol-builder',
    label: 'Protocol Builder',
    description: 'Blockchain protocols, smart contracts, infrastructure',
  },
  {
    id: 'smart-contract-engineer',
    label: 'Smart Contract Engineer',
    description: 'Solidity/EVM contracts and on-chain logic',
  },
  {
    id: 'web3-developer',
    label: 'Web3 Developer',
    description: 'DApps and blockchain integrations',
  },
  {
    id: 'blockchain-architect',
    label: 'Blockchain Architect',
    description: 'Designing the technical architecture',
  },
  {
    id: 'defi-builder',
    label: 'DeFi Builder',
    description: 'Decentralized finance protocols and applications',
  },
  {
    id: 'dapp-builder',
    label: 'dApp Builder',
    description: 'Building decentralized applications',
  },
  {
    id: 'web3-security-researcher',
    label: 'Web3 Security Researcher',
    description: 'Smart-contract security, exploits, audits',
  },
  {
    id: 'ai-web3-builder',
    label: 'AI × Web3 Builder',
    description: 'Combining AI with blockchain',
  },
  {
    id: 'frontend-engineer',
    label: 'Frontend Engineer',
    description: 'DApp interfaces and user experience',
  },
  {
    id: 'backend-engineer',
    label: 'Backend Engineer',
    description: 'APIs, databases, indexing and off-chain systems',
  },
  {
    id: 'product-builder',
    label: 'Product Builder',
    description: 'Turning the idea into a usable product',
  },
  {
    id: 'protocol-researcher',
    label: 'Protocol Researcher',
    description: 'Cryptography, mechanisms, protocol research',
  },
  {
    id: 'growth-community',
    label: 'Growth & Community',
    description: 'Community, adoption, partnerships',
  },
  {
    id: 'founder',
    label: 'Founder',
    description: 'Product vision, business model and team direction',
  },
] as const

export type BuilderTitle = (typeof BUILDER_TITLES)[number]
export type BuilderTitleId = BuilderTitle['id']
export type BuilderTitleLabel = BuilderTitle['label']

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
export function suggestTitle(name: string): BuilderTitleLabel {
  const key = name.trim().toLowerCase()
  if (key.length === 0) return BUILDER_TITLES[0].label
  return BUILDER_TITLES[hash(key) % BUILDER_TITLES.length]!.label
}

/** Next title in the list — used by the shuffle control (S1-1). */
export function nextTitle(current: string): BuilderTitleLabel {
  const index = BUILDER_TITLES.findIndex(({ label }) => label === current)
  return BUILDER_TITLES[(index + 1) % BUILDER_TITLES.length]!.label
}
