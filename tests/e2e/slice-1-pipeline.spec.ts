import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * SLICE 1 GATE.
 *
 * Exercises: photo → raw validation → decode → decoded validation → normalize
 * → automatic framing/manual positioning → prepare dependencies → synchronous renderer → canvas
 * preview → 1080×1080 PNG export → download.
 *
 * Upload still lands directly on a finished result; optional zoom and position
 * controls let a user refine the frame without blocking download.
 *
 * What this CANNOT cover, and must not be read as covering: genuine iPhone
 * HEIC, iOS memory ceilings, real download behaviour on iOS Safari, and native
 * share. Those need hardware — see docs/spikes/.
 */

const FIXTURES = join(process.cwd(), 'tests/fixtures')
const fixture = (name: string) => join(FIXTURES, name)

/** Reads PNG dimensions straight from the IHDR chunk. */
function pngSize(bytes: Buffer): { width: number; height: number } {
  expect(bytes.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  )
  expect(bytes.subarray(12, 16).toString('ascii')).toBe('IHDR')
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

async function upload(page: Page, file: string) {
  // Two entry points now exist: the landing form (which gates on a Continue
  // button) and the in-editor inputs. Drive whichever is on screen so every
  // test exercises the same route a real user takes.
  const landingContinue = page.locator('#continue-btn')
  if (await landingContinue.count()) {
    // The camera flow owns a second capture-enabled file input as a fallback.
    // Target only Browse Photos so this helper cannot silently feed the wrong
    // control when both inputs are mounted.
    await page.setInputFiles('input[type="file"]:not([capture])', fixture(file))
    await landingContinue.click()
    return
  }
  await page.setInputFiles('input[type="file"]', fixture(file))
}

async function expectEditorReady(page: Page) {
  await expect(page.getByRole('img', { name: /Preview at 1080×1080/ })).toBeVisible({
    timeout: 20_000,
  })
}

/** The always-visible share panel also offers Download PNG once prepared. */
const primaryDownload = (page: Page) => page.locator('.editor-download-button')

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  // NFR-026: no console errors in production.
  ;(page as Page & { __errors?: string[] }).__errors = errors
  await page.goto('/')
})

test.afterEach(async ({ page }) => {
  const errors = (page as Page & { __errors?: string[] }).__errors ?? []
  expect(errors, `console errors: ${errors.join(' | ')}`).toEqual([])
})

test('landing shows the product and an upload control above the fold', async ({
  page,
}) => {
  await expect(
    page.getByRole('heading', { level: 1, name: 'Builder Studio' }),
  ).toBeVisible()
  // Our product name, not another entry's — this assertion exists to catch a
  // regression that already happened once.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Builder Studio')
  // The landing now leads with the form card rather than a dropzone.
  await expect(page.getByRole('button', { name: /upload photo/i })).toBeInViewport()
  await expect(page.getByRole('button', { name: /take photo/i })).toBeInViewport()
})

test('Use camera requests a live stream before offering the device-picker fallback', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const instrumentedWindow = window as typeof window & {
      __cameraConstraints?: MediaStreamConstraints
    }
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        async getUserMedia(constraints: MediaStreamConstraints) {
          instrumentedWindow.__cameraConstraints = constraints
          throw new DOMException('Permission denied in test', 'NotAllowedError')
        },
      },
    })
  })
  await page.reload()

  await page.getByRole('button', { name: 'Take photo with camera' }).click()

  const cameraDialog = page.getByRole('dialog', { name: 'Take your photo' })
  await expect(cameraDialog).toBeVisible()
  // Scope to the dialog: Next injects its own role="alert" route announcer
  // into <body>, so an unscoped query matches two elements.
  await expect(cameraDialog.getByRole('alert')).toContainText(
    /camera permission was blocked/i,
  )
  await expect(page.getByRole('button', { name: 'Device camera picker' })).toBeVisible()
  await expect(page.locator('input[type="file"][capture="user"]')).toHaveCount(1)

  const constraints = await page.evaluate(
    () =>
      (
        window as typeof window & {
          __cameraConstraints?: MediaStreamConstraints
        }
      ).__cameraConstraints,
  )
  expect(constraints?.audio).toBe(false)
  expect(constraints?.video).toMatchObject({ facingMode: { ideal: 'user' } })
})

test('full pipeline: portrait JPG → preview → 1080×1080 PNG download', async ({
  page,
}) => {
  await upload(page, 'portrait.jpg')
  await expectEditorReady(page)

  const download = await Promise.all([
    page.waitForEvent('download'),
    primaryDownload(page).click(),
  ]).then(([d]) => d)

  expect(download.suggestedFilename()).toBe('hhgoa-2026-builder-pfp.png')

  const path = await download.path()
  const bytes = readFileSync(path)
  expect(pngSize(bytes)).toEqual({ width: 1080, height: 1080 })
  expect(bytes.length).toBeGreaterThan(10_000)
})

test.describe('accepted inputs all reach a renderable editor', () => {
  for (const file of [
    'portrait.jpg',
    'landscape.jpg',
    'transparent.png',
    'large.jpg',
    'panorama.jpg',
  ]) {
    test(file, async ({ page }) => {
      await upload(page, file)
      await expectEditorReady(page)
      await expect(primaryDownload(page)).toBeEnabled()
    })
  }
})

test('transparent PNG exports fully opaque — no transparent regions', async ({
  page,
}) => {
  await upload(page, 'transparent.png')
  await expectEditorReady(page)

  const download = await Promise.all([
    page.waitForEvent('download'),
    primaryDownload(page).click(),
  ]).then(([d]) => d)

  const bytes = readFileSync(await download.path())
  expect(pngSize(bytes)).toEqual({ width: 1080, height: 1080 })

  // Re-decode in the browser and sample the alpha channel across the graphic.
  const minAlpha = await page.evaluate(async (b64) => {
    const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob()
    const bmp = await createImageBitmap(blob)
    const c = document.createElement('canvas')
    c.width = bmp.width
    c.height = bmp.height
    const ctx = c.getContext('2d')!
    ctx.drawImage(bmp, 0, 0)
    const { data } = ctx.getImageData(0, 0, c.width, c.height)
    let min = 255
    for (let i = 3; i < data.length; i += 4 * 97) min = Math.min(min, data[i]!)
    return min
  }, bytes.toString('base64'))

  expect(minAlpha).toBe(255)
})

test.describe('rejected inputs produce specific, recoverable errors', () => {
  const cases = [
    ['not-an-image.jpg', /file type isn't supported/i],
    ['tiny.jpg', /at least 256×256/i],
    ['empty.jpg', /file is empty/i],
    ['corrupt.jpg', /couldn't read that photo/i],
  ] as const

  for (const [file, message] of cases) {
    test(file, async ({ page }) => {
      await upload(page, file)

      // Next injects a role="alert" route announcer into <body>; scope to our UI.
      const alert = page.locator('main').getByRole('alert')
      await expect(alert).toBeVisible({ timeout: 20_000 })
      await expect(alert).toContainText(message)

      // Recoverable in place: the dropzone is still there and still works.
      await upload(page, 'portrait.jpg')
      await expectEditorReady(page)
    })
  }
})

test('the PFP graphic carries the required hashtag', async ({ page }) => {
  await upload(page, 'portrait.jpg')
  await expectEditorReady(page)
  // The tag is drawn INTO the graphic, so it travels with the image even when
  // a caption is lost somewhere between the share sheet and the post.
  await expect(page.getByRole('img', { name: /Preview at 1080×1080/ })).toBeVisible()
})

test('photo controls update the graphic and can reset to the automatic frame', async ({
  page,
}) => {
  await upload(page, 'portrait.jpg')
  await expectEditorReady(page)

  // Controls are optional: the automatic result is still download-ready.
  await expect(primaryDownload(page)).toBeEnabled()

  const preview = page.getByRole('img', { name: /Preview at 1080×1080/ })
  const automatic = await preview.evaluate((canvas: HTMLCanvasElement) =>
    canvas.toDataURL(),
  )

  // Each position axis must work independently from the initial 1× frame.
  await page.getByLabel('Left / right').fill('65')

  await expect
    .poll(() => preview.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()))
    .not.toBe(automatic)

  await page.getByRole('button', { name: 'Reset auto frame' }).click()
  await expect
    .poll(() => preview.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()))
    .toBe(automatic)

  await page.getByLabel('Up / down').fill('-65')
  await expect
    .poll(() => preview.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()))
    .not.toBe(automatic)

  await page.getByRole('button', { name: 'Reset auto frame' }).click()
  await expect(page.getByLabel('Zoom')).toHaveValue('1')
  await expect(page.getByLabel('Left / right')).toHaveValue('0')
  await expect(page.getByLabel('Up / down')).toHaveValue('0')
  await expect
    .poll(() => preview.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()))
    .toBe(automatic)
})

test('desktop editor uses normal document scrolling without a nested rail', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await upload(page, 'portrait.jpg')
  await expectEditorReady(page)
  await page.getByText('Builder ID', { exact: true }).click()
  await expect(page.getByRole('img', { name: /Preview at 1080×1350/ })).toBeVisible()
  await page.getByLabel('Your name').fill('Aditya Jadhav')
  await page.getByLabel('What you build').fill('Canvas · React')

  // Sharing belongs to the editor itself, not to a post-download success
  // screen. Its extra content also participates in ordinary document scroll.
  const sharePanel = page.getByRole('region', { name: 'Post your build' })
  await expect(sharePanel).toBeVisible()

  const metrics = await page.evaluate(() => ({
    viewport: window.innerHeight,
    page: document.documentElement.scrollHeight,
    htmlOverflow: getComputedStyle(document.documentElement).overflowY,
    bodyOverflow: getComputedStyle(document.body).overflowY,
    railOverflow: getComputedStyle(document.querySelector('.editor-control-rail')!)
      .overflowY,
  }))
  expect(metrics.page).toBeGreaterThan(metrics.viewport)
  expect(metrics.htmlOverflow).not.toBe('hidden')
  expect(metrics.bodyOverflow).not.toBe('hidden')
  expect(['auto', 'scroll']).not.toContain(metrics.railOverflow)

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  const bottom = await page.evaluate(() => {
    const footer = document.querySelector('.editor-app-footer')!.getBoundingClientRect()
    return { scrollY: window.scrollY, footerTop: footer.top, footerBottom: footer.bottom }
  })
  expect(bottom.scrollY).toBeGreaterThan(0)
  expect(bottom.footerTop).toBeLessThan(900)
  expect(bottom.footerBottom).toBeGreaterThan(0)
})

test('editor canvas and control surfaces are transparent over the illustrated page', async ({
  page,
}) => {
  const surfaceState = async (selector: string) =>
    page.locator(selector).evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        backdrop: style.backdropFilter,
        background: style.backgroundColor,
      }
    })

  for (const selector of ['.form-card', '.form-output-proof', '.landing-upload-zone']) {
    const state = await surfaceState(selector)
    expect(state.backdrop).not.toContain('blur')
    expect(state.background).not.toBe('rgba(0, 0, 0, 0)')
  }
  expect(
    await page
      .locator('.form-card')
      .evaluate((element) => getComputedStyle(element, '::before').display),
  ).toBe('none')

  await upload(page, 'portrait.jpg')
  await expectEditorReady(page)
  for (const selector of [
    '.editor-studio',
    '.editor-control-rail',
    '.editor-preview-stage',
    '.photo-adjustment-card',
    '.editor-action-card',
    '.editor-preview-viewport',
  ]) {
    const state = await surfaceState(selector)
    expect(state.backdrop).not.toContain('blur')
    expect(state.background).toBe('rgba(0, 0, 0, 0)')
  }
})

test('the same photo always produces an identical graphic (NFR-035)', async ({
  page,
}) => {
  const sizes: number[] = []
  for (let i = 0; i < 2; i++) {
    await upload(page, 'landscape.jpg')
    await expectEditorReady(page)
    const dl = await Promise.all([
      page.waitForEvent('download'),
      primaryDownload(page).click(),
    ]).then(([d]) => d)
    sizes.push(readFileSync(await dl.path()).length)
    await page.getByRole('button', { name: 'Start over' }).click()
  }
  // Automatic framing is deterministic, so byte length is stable within one
  // browser. (Across browsers only the pixels are guaranteed — D-5.)
  expect(sizes[0]).toBe(sizes[1])
})

test('a small-but-usable photo is accepted with a soft-quality warning', async ({
  page,
}) => {
  await upload(page, 'small-soft.jpg')
  await expectEditorReady(page)
  await expect(page.getByText(/may look slightly soft/i)).toBeVisible()
  await expect(primaryDownload(page)).toBeEnabled()
})

test('replacing the image mid-session keeps a single working editor', async ({
  page,
}) => {
  await upload(page, 'portrait.jpg')
  await expectEditorReady(page)

  // Replace from inside the editor — no Start over, no page reload.
  await upload(page, 'landscape.jpg')
  await expectEditorReady(page)

  // Exactly one editor, one preview: the previous session was torn down, not
  // stacked on top of.
  await expect(page.getByRole('img', { name: /Preview at/ })).toHaveCount(1)
  await expect(page.locator('input[type="file"]')).toHaveCount(1)
})

test('start over returns to a clean idle state without reloading', async ({ page }) => {
  await upload(page, 'portrait.jpg')
  await expectEditorReady(page)

  await page.getByRole('button', { name: 'Start over' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Builder Studio' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Upload photo from device' }),
  ).toBeVisible()
  await expect(page.getByRole('img', { name: /Preview at/ })).toHaveCount(0)

  await upload(page, 'portrait.jpg')
  await expectEditorReady(page)
})

test('five consecutive upload → render → download cycles (S0-12)', async ({ page }) => {
  test.setTimeout(180_000)
  const files = [
    'portrait.jpg',
    'landscape.jpg',
    'transparent.png',
    'large.jpg',
    'portrait.jpg',
  ]

  for (const [i, file] of files.entries()) {
    await upload(page, file)
    await expectEditorReady(page)

    const download = await Promise.all([
      page.waitForEvent('download'),
      primaryDownload(page).click(),
    ]).then(([d]) => d)

    expect(pngSize(readFileSync(await download.path())), `cycle ${i + 1}`).toEqual({
      width: 1080,
      height: 1080,
    })
  }

  // Heap is a weak signal in a headless browser, but unbounded growth across
  // five full-resolution cycles would still show up here. The authoritative
  // memory result comes from SPIKE-2 on a real iPhone.
  const heapMb = await page.evaluate(() => {
    const p = performance as Performance & { memory?: { usedJSHeapSize: number } }
    return p.memory ? p.memory.usedJSHeapSize / 1048576 : null
  })
  if (heapMb !== null) expect(heapMb).toBeLessThan(250)
})

test('no horizontal scroll at 320px (NFR-009)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await upload(page, 'portrait.jpg')
  await expectEditorReady(page)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

test('the whole flow is reachable by keyboard (NFR-015)', async ({ page }) => {
  // Walk the tab order and confirm the primary upload control is reachable —
  // asserting a specific tag would break every time the landing is restyled.
  let reachedUpload = false
  for (let i = 0; i < 12 && !reachedUpload; i++) {
    await page.keyboard.press('Tab')
    // Match the ACCESSIBLE NAME, which may come from aria-label rather than
    // text content — asserting on textContent alone reported a failure when
    // keyboard access was in fact working.
    reachedUpload = await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return false
      const name = el.getAttribute('aria-label') ?? el.textContent ?? ''
      return /upload photo/i.test(name)
    })
  }
  expect(reachedUpload, 'upload control not reachable by keyboard').toBe(true)

  await upload(page, 'portrait.jpg')
  await expectEditorReady(page)

  await expect(primaryDownload(page)).toBeEnabled({ timeout: 20_000 })
  await primaryDownload(page).focus()
  await expect(primaryDownload(page)).toBeFocused()
})

test.describe('every landing entry point uses the canonical pipeline', () => {
  /** Drop a file with an EMPTY type string, as macOS/iOS report for HEIC. */
  async function dropFile(page: Page, name: string, fixtureName: string) {
    const data = readFileSync(fixture(fixtureName)).toString('base64')
    // DataTransfer must be built as a handle in the page and passed to
    // dispatchEvent — constructing it inside evaluate() does not attach.
    const dataTransfer = await page.evaluateHandle(
      ({ name, data }) => {
        const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
        const dt = new DataTransfer()
        dt.items.add(new File([bytes], name, { type: '' }))
        return dt
      },
      { name, data },
    )
    await page.locator('.landing-upload-zone').dispatchEvent('drop', { dataTransfer })
  }

  test('a dropped photo reporting no MIME type is still accepted', async ({ page }) => {
    // The regression this guards: filtering drops on `file.type` silently
    // discarded HEIC from Finder and Files, which report an empty type.
    await dropFile(page, 'IMG_0001.HEIC', 'portrait.jpg')

    await expect(page.locator('#continue-btn')).toBeEnabled({ timeout: 10_000 })
    await page.locator('#continue-btn').click()
    await expectEditorReady(page)
  })

  test('a dropped unsupported file reports an error rather than doing nothing', async ({
    page,
  }) => {
    await dropFile(page, 'notes.pdf', 'not-an-image.jpg')

    await page.locator('#continue-btn').click()
    const alert = page.locator('main').getByRole('alert')
    await expect(alert).toBeVisible({ timeout: 20_000 })
    await expect(alert).toContainText(/file type isn't supported/i)
  })
})
