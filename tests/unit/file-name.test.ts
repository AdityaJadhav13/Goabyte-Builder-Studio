import { describe, expect, it } from 'vitest'
import { buildFileName, slugify } from '@/features/export/file-name'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Aditya Jadhav')).toBe('aditya-jadhav')
  })

  it('strips diacritics rather than dropping the name', () => {
    expect(slugify('José Ángel')).toBe('jose-angel')
  })

  it('falls back for scripts with no Latin decomposition', () => {
    // A Devanagari name must still produce a working download — just not a
    // transliterated one.
    expect(slugify('आदित्य')).toBe('builder')
  })

  it('falls back for emoji-only input', () => {
    expect(slugify('🚀🔥')).toBe('builder')
  })

  it('falls back for whitespace-only input', () => {
    expect(slugify('   ')).toBe('builder')
  })

  it('neutralises path traversal', () => {
    const slug = slugify('../../etc/passwd')
    expect(slug).not.toContain('/')
    expect(slug).not.toContain('..')
    expect(slug).toBe('etc-passwd')
  })

  it('strips characters that break filesystems', () => {
    expect(slugify('a:b*c?d"e<f>g|h')).toBe('a-b-c-d-e-f-g-h')
  })

  it('truncates long input without leaving a trailing hyphen', () => {
    const slug = slugify('a'.repeat(100))
    expect(slug.length).toBeLessThanOrEqual(32)
    expect(slug.endsWith('-')).toBe(false)
  })

  it('does not leave a trailing hyphen when truncation lands on a separator', () => {
    const slug = slugify('abcdefghij klmnopqrst uvwxyzabcd efghij')
    expect(slug.endsWith('-')).toBe(false)
    expect(slug.length).toBeLessThanOrEqual(32)
  })
})

describe('buildFileName', () => {
  it('produces a stable, descriptive name', () => {
    expect(buildFileName('pfp', 'Aditya')).toBe('hhgoa-2026-aditya-pfp.png')
  })

  it('uses the fallback when no subject is supplied — Slice 1 has no name field', () => {
    expect(buildFileName('pfp')).toBe('hhgoa-2026-builder-pfp.png')
    expect(buildFileName('pfp', null)).toBe('hhgoa-2026-builder-pfp.png')
  })

  it('always ends in .png', () => {
    expect(buildFileName('pfp', '🚀')).toMatch(/\.png$/)
  })

  it('identifies Crew Frame exports without changing the team slug', () => {
    expect(buildFileName('crew', 'GoaByte')).toBe('hhgoa-2026-goabyte-crew.png')
  })

  it('identifies the visible Builder ID side', () => {
    expect(buildFileName('builder-card', 'Aditya Jadhav', 'front')).toBe(
      'hhgoa-2026-aditya-jadhav-builder-id-front.png',
    )
    expect(buildFileName('builder-card', 'Aditya Jadhav', 'back')).toBe(
      'hhgoa-2026-aditya-jadhav-builder-id-back.png',
    )
  })
})
