import { describe, expect, it, vi } from 'vitest'
import { createNormalizedImage } from '@/lib/image/normalized-image'
import { ResourceSlot } from '@/lib/resource/resource-slot'

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
