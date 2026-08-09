import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  canCopyPngToClipboard,
  canShareFile,
  copyCaptionOnly,
  copyPngToClipboard,
  openIntentWindow,
  shareFile,
} from '@/features/share/share-to-x'
import { REQUIRED_HASHTAG } from '@/features/share/share-copy'

const CAPTION = `My builder identity is ready. ${REQUIRED_HASHTAG}`

const pngFile = () =>
  new File([new Uint8Array([137, 80, 78, 71])], 'builder.png', {
    type: 'image/png',
  })

interface BrowserStubs {
  readonly share?: (data: ShareData) => Promise<void>
  readonly canShare?: (data?: ShareData) => boolean
  readonly writeText?: (text: string) => Promise<void>
  readonly write?: (data: ClipboardItems) => Promise<void>
  readonly open?: (url?: string | URL, target?: string) => Window | null
  readonly secure?: boolean
}

function stubBrowser(stubs: BrowserStubs = {}) {
  vi.stubGlobal('window', {
    isSecureContext: stubs.secure ?? true,
    open: stubs.open ?? vi.fn(() => null),
  })
  vi.stubGlobal('navigator', {
    share: stubs.share,
    canShare: stubs.canShare,
    clipboard: {
      writeText: stubs.writeText,
      write: stubs.write,
    },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('native PNG sharing', () => {
  it('starts share and clipboard work before awaiting either operation', async () => {
    const order: string[] = []
    let releaseClipboard!: () => void
    const writeText = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          order.push('clipboard')
          releaseClipboard = resolve
        }),
    )
    const share = vi.fn(() => {
      order.push('share')
      return Promise.resolve()
    })
    stubBrowser({ share, writeText })

    const file = pngFile()
    const pending = shareFile(file, CAPTION)

    expect(order).toEqual(['share', 'clipboard'])
    expect(share).toHaveBeenCalledWith({ files: [file], text: CAPTION })
    releaseClipboard()
    await expect(pending).resolves.toEqual({ kind: 'shared-file', captionCopied: true })
  })

  it('reports a dismissed share sheet without treating it as a failure', async () => {
    const abort = new Error('cancelled')
    abort.name = 'AbortError'
    stubBrowser({
      share: vi.fn(() => Promise.reject(abort)),
      writeText: vi.fn(() => Promise.resolve()),
    })

    await expect(shareFile(pngFile(), CAPTION)).resolves.toEqual({ kind: 'dismissed' })
  })

  it('surfaces real share failures to the UI', async () => {
    stubBrowser({
      share: vi.fn(() => Promise.reject(new Error('share unavailable'))),
      writeText: vi.fn(() => Promise.resolve()),
    })

    await expect(shareFile(pngFile(), CAPTION)).rejects.toThrow('share unavailable')
  })

  it('probes the exact file-and-caption payload that will be shared', () => {
    const canShare = vi.fn(() => true)
    stubBrowser({ share: vi.fn(() => Promise.resolve()), canShare })
    const file = pngFile()

    expect(canShareFile(file, CAPTION)).toBe(true)
    expect(canShare).toHaveBeenCalledWith({ files: [file], text: CAPTION })
  })

  it('degrades when canShare rejects an otherwise valid-looking payload', () => {
    stubBrowser({
      share: vi.fn(() => Promise.resolve()),
      canShare: vi.fn(() => {
        throw new TypeError('unsupported')
      }),
    })

    expect(canShareFile(pngFile(), CAPTION)).toBe(false)
  })
})

describe('X compose fallback', () => {
  it('detects an opened window, detaches its opener, and navigates to X', () => {
    const replace = vi.fn()
    const popup = { opener: {}, location: { replace } } as unknown as Window
    const open = vi.fn(() => popup)
    stubBrowser({ open })

    const outcome = openIntentWindow(CAPTION)

    expect(open).toHaveBeenCalledWith('about:blank', '_blank')
    expect(popup.opener).toBeNull()
    expect(replace).toHaveBeenCalledWith(outcome.url)
    expect(outcome.opened).toBe(true)
    expect(outcome.url).toContain('https://x.com/intent/post?text=')
    expect(decodeURIComponent(outcome.url.split('?text=')[1]!)).toBe(CAPTION)
  })

  it('returns a usable direct link when the popup is genuinely blocked', () => {
    stubBrowser({ open: vi.fn(() => null) })

    const outcome = openIntentWindow(CAPTION)

    expect(outcome.opened).toBe(false)
    expect(outcome.url).toContain('%23FrameInGoa')
  })

  it('closes an opened tab and returns the link if navigation is denied', () => {
    const close = vi.fn()
    const popup = {
      opener: {},
      close,
      location: {
        replace: vi.fn(() => {
          throw new Error('navigation denied')
        }),
      },
    } as unknown as Window
    stubBrowser({ open: vi.fn(() => popup) })

    const outcome = openIntentWindow(CAPTION)

    expect(outcome.opened).toBe(false)
    expect(close).toHaveBeenCalledOnce()
    expect(outcome.url).toContain('%23FrameInGoa')
  })
})

describe('clipboard recovery', () => {
  it('copies the caption when text clipboard access is available', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    stubBrowser({ writeText })

    await expect(copyCaptionOnly(CAPTION)).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith(CAPTION)
  })

  it('offers PNG copy only in a secure context with image clipboard support', async () => {
    const supports = vi.fn((type: string) => type === 'image/png')
    class FakeClipboardItem {
      static supports = supports
      constructor(readonly data: Record<string, Blob>) {}
    }
    vi.stubGlobal('ClipboardItem', FakeClipboardItem)
    const write = vi.fn<(items: ClipboardItems) => Promise<void>>()
    write.mockResolvedValue(undefined)
    stubBrowser({ write })
    const file = pngFile()

    expect(canCopyPngToClipboard(file)).toBe(true)
    await expect(copyPngToClipboard(file)).resolves.toBe(true)
    expect(write).toHaveBeenCalledOnce()
    const item = write.mock.calls[0]![0][0]! as unknown as FakeClipboardItem
    expect(item.data['image/png']).toBe(file)
  })

  it('hides PNG copy outside a secure context or for a non-PNG file', () => {
    class FakeClipboardItem {
      static supports() {
        return true
      }
    }
    vi.stubGlobal('ClipboardItem', FakeClipboardItem)
    stubBrowser({ secure: false, write: vi.fn(() => Promise.resolve()) })

    expect(canCopyPngToClipboard(pngFile())).toBe(false)

    stubBrowser({ secure: true, write: vi.fn(() => Promise.resolve()) })
    const jpeg = new File([], 'photo.jpg', { type: 'image/jpeg' })
    expect(canCopyPngToClipboard(jpeg)).toBe(false)
  })
})
