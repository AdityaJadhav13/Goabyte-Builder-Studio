import { describe, expect, it, vi } from 'vitest'
import { createNormalizedImage } from '@/lib/image/normalized-image'
import { ResourceSlot, reviveSlot } from '@/lib/resource/resource-slot'

/**
 * Resource ownership. The reducer is pure and never disposes, so these tests
 * cover the layer that actually does.
 */

function stubImage(dispose: () => void) {
  return createNormalizedImage({
    source: {} as CanvasImageSource,
    width: 1000,
    height: 1000,
    provenance: {
      originalWidth: 1000,
      originalHeight: 1000,
      mimeType: 'image/jpeg',
      byteSize: 1,
      heicConverted: false,
      downscaled: false,
    },
    dispose,
  })
}

describe('NormalizedImage.release() is idempotent', () => {
  it('disposes underlying resources exactly once across repeated calls', () => {
    const dispose = vi.fn()
    const image = stubImage(dispose)

    image.release()
    image.release()
    image.release()

    expect(dispose).toHaveBeenCalledTimes(1)
  })

  it('reports its released state', () => {
    const image = stubImage(vi.fn())
    expect(image.isReleased).toBe(false)
    image.release()
    expect(image.isReleased).toBe(true)
  })
})

describe('ResourceSlot', () => {
  it('releases the previous image exactly once when replaced', () => {
    const disposeFirst = vi.fn()
    const disposeSecond = vi.fn()
    const slot = new ResourceSlot()

    const first = stubImage(disposeFirst)
    slot.adopt(first)
    expect(disposeFirst).not.toHaveBeenCalled()

    slot.adopt(stubImage(disposeSecond))

    expect(disposeFirst).toHaveBeenCalledTimes(1)
    expect(disposeSecond).not.toHaveBeenCalled()
    expect(first.isReleased).toBe(true)
  })

  it('start-over releases the current image exactly once', () => {
    const dispose = vi.fn()
    const slot = new ResourceSlot()
    slot.adopt(stubImage(dispose))

    slot.adopt(null) // start-over

    expect(dispose).toHaveBeenCalledTimes(1)
    expect(slot.peek()).toBeNull()
  })

  it('does not release when the same image is adopted twice', () => {
    const dispose = vi.fn()
    const slot = new ResourceSlot()
    const image = stubImage(dispose)

    slot.adopt(image)
    slot.adopt(image)

    expect(dispose).not.toHaveBeenCalled()
    expect(slot.peek()).toBe(image)
  })

  it('dispose() is idempotent — explicit disposal then unmount safety net', () => {
    const dispose = vi.fn()
    const slot = new ResourceSlot()
    slot.adopt(stubImage(dispose))

    slot.dispose()
    slot.dispose()

    expect(dispose).toHaveBeenCalledTimes(1)
    expect(slot.isDisposed).toBe(true)
  })

  it('releases anything adopted after disposal rather than leaking it', () => {
    // An in-flight decode resolving after the editor unmounts.
    const dispose = vi.fn()
    const slot = new ResourceSlot()
    slot.dispose()

    slot.adopt(stubImage(dispose))

    expect(dispose).toHaveBeenCalledTimes(1)
    expect(slot.peek()).toBeNull()
  })

  it('survives a five-cycle upload sequence with no live resource left over', () => {
    // Mirrors acceptance gate S0-12.
    const disposals: ReturnType<typeof vi.fn>[] = []
    const slot = new ResourceSlot()

    for (let i = 0; i < 5; i++) {
      const dispose = vi.fn()
      disposals.push(dispose)
      slot.adopt(stubImage(dispose))
    }
    slot.dispose()

    expect(disposals.every((d) => d.mock.calls.length === 1)).toBe(true)
    expect(slot.peek()).toBeNull()
  })
})

describe('reviveSlot — the Strict Mode blank-preview defect', () => {
  it('replaces a disposed slot instead of handing back the corpse', () => {
    // React refs survive a remount. Strict Mode runs mount → cleanup → mount
    // on the same instance, so the cleanup's dispose() leaves a dead slot that
    // render-time creation never replaces.
    const slot = new ResourceSlot()
    slot.dispose()

    const revived = reviveSlot(slot)

    expect(revived).not.toBe(slot)
    expect(revived.isDisposed).toBe(false)
  })

  it('keeps a live slot, so ownership is never silently reset mid-session', () => {
    const slot = new ResourceSlot()
    const image = stubImage(vi.fn())
    slot.adopt(image)

    expect(reviveSlot(slot)).toBe(slot)
    expect(reviveSlot(slot).peek()).toBe(image)
  })

  it('creates a slot from nothing on first use', () => {
    expect(reviveSlot(null).isDisposed).toBe(false)
  })

  it('an image adopted after revival stays live — the actual bug', () => {
    // Before the fix: the in-flight decode adopted into a disposed slot, which
    // released the image on the spot, and the editor published a released
    // canvas. The preview was blank.
    const dispose = vi.fn()
    let slot: ResourceSlot<ReturnType<typeof stubImage>> | null = new ResourceSlot()
    slot.dispose() // simulated unmount

    slot = reviveSlot(slot)
    const image = stubImage(dispose)
    slot.adopt(image)

    expect(dispose).not.toHaveBeenCalled()
    expect(image.isReleased).toBe(false)
    expect(slot.peek()).toBe(image)
  })
})
