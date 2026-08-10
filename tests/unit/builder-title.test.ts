import { describe, expect, it } from 'vitest'
import {
  BUILDER_TITLES,
  nextTitle,
  suggestTitle,
} from '@/features/builder-title/suggest-title'

/**
 * S1-1, NFR-035. The default title must be deterministic: a random one would
 * change between the preview and the export, making the preview a lie.
 */
describe('suggestTitle', () => {
  it('is deterministic for a given name', () => {
    expect(suggestTitle('Aditya')).toBe(suggestTitle('Aditya'))
    expect(suggestTitle('Nitin Gupta')).toBe(suggestTitle('Nitin Gupta'))
  })

  it('ignores case and surrounding whitespace', () => {
    expect(suggestTitle('  ADITYA  ')).toBe(suggestTitle('aditya'))
  })

  it('always returns a title from the curated list', () => {
    const labels = BUILDER_TITLES.map(({ label }) => label)
    for (const name of ['Aditya', 'आदित्य', '🚀', '', 'x'.repeat(200)]) {
      expect(labels).toContain(suggestTitle(name))
    }
  })

  it('spreads across the list rather than collapsing onto one entry', () => {
    const names = Array.from({ length: 200 }, (_, i) => `builder${i}`)
    const distinct = new Set(names.map(suggestTitle))
    expect(distinct.size).toBeGreaterThan(BUILDER_TITLES.length / 2)
  })

  it('handles an empty name without throwing', () => {
    expect(suggestTitle('')).toBe(BUILDER_TITLES[0].label)
  })
})

describe('nextTitle', () => {
  it('advances through the list and wraps', () => {
    expect(nextTitle(BUILDER_TITLES[0].label)).toBe(BUILDER_TITLES[1].label)
    expect(nextTitle(BUILDER_TITLES.at(-1)!.label)).toBe(BUILDER_TITLES[0].label)
  })

  it('falls back to the first entry for an unknown value', () => {
    // A user who typed their own title then hits "Try another".
    expect(nextTitle('something bespoke')).toBe(BUILDER_TITLES[0].label)
  })
})

describe('the list itself', () => {
  it('contains the exact canonical 14 title records', () => {
    expect(BUILDER_TITLES).toEqual([
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
    ])
    expect(BUILDER_TITLES).toHaveLength(14)
  })

  it('has no duplicate ids or labels', () => {
    expect(new Set(BUILDER_TITLES.map(({ id }) => id)).size).toBe(BUILDER_TITLES.length)
    expect(new Set(BUILDER_TITLES.map(({ label }) => label)).size).toBe(
      BUILDER_TITLES.length,
    )
  })

  it('stays within the card chip budget of 28 characters', () => {
    for (const { label } of BUILDER_TITLES) {
      expect(label.length, `"${label}" is too long for the chip`).toBeLessThanOrEqual(28)
    }
  })
})
