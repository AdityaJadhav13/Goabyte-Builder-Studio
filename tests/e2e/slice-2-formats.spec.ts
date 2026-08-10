import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * SLICE 2 — production PFP/Builder ID/Crew templates, frame selection, and
 * the always-present share surface.
 *
 * What this CANNOT cover: whether the X app actually attaches a shared file
 * and preserves the caption. That is SPIKE-3, and it needs a real phone.
 */

const fixture = (name: string) => join(process.cwd(), 'tests/fixtures', name)

function pngSize(bytes: Buffer): { width: number; height: number } {
  expect(bytes.subarray(12, 16).toString('ascii')).toBe('IHDR')
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

async function upload(page: Page, file: string) {
  // Two entry points now exist: the landing form (which gates on a Continue
  // button) and the in-editor inputs. Drive whichever is on screen so every
  // test exercises the same route a real user takes.
  const landingContinue = page.locator('#continue-btn')
  if (await landingContinue.count()) {
    // The camera fallback has its own `capture` input. Browse tests must drive
    // the canonical non-capture input rather than matching both controls.
    await page.setInputFiles('input[type="file"]:not([capture])', fixture(file))
    await landingContinue.click()
    return
  }
  await page.setInputFiles('input[type="file"]', fixture(file))
}

const previewOf = (page: Page, size: string) =>
  page.getByRole('img', { name: new RegExp(`Preview at ${size}`) })

type BuilderSide = 'front' | 'back'

const builderPreview = (page: Page, side: BuilderSide) =>
  page
    .locator('.editor-preview-stage')
    .getByRole('img', { name: new RegExp(`Builder ID ${side} preview`, 'i') })

const builderCanvas = (page: Page, side: BuilderSide) =>
  page.locator(`[data-card-face="${side}"] canvas`)

async function flipBuilderTo(page: Page, side: BuilderSide) {
  const action = side === 'back' ? 'Flip to Back' : 'Flip to Front'
  await page.getByRole('button', { name: action }).click()
  await expect(page.locator('.builder-card-flipper')).toHaveAttribute(
    'data-card-side',
    side,
  )
  await expect(builderPreview(page, side)).toBeVisible()
}

/**
 * Click the LABEL, as a real user does. The input itself is `sr-only` and so
 * has zero size — Playwright refuses to click it directly, but the native
 * label association is what makes the control work for mouse, touch and
 * screen-reader users alike.
 */
async function chooseFormat(
  page: Page,
  label: 'Profile picture' | 'Builder ID' | 'Crew frame',
) {
  await page.getByText(label, { exact: true }).click()
  await expect(page.getByRole('radio', { name: label })).toBeChecked()
}

async function download(page: Page) {
  return Promise.all([
    page.waitForEvent('download'),
    page.locator('.editor-download-button').click(),
  ]).then(([d]) => d)
}

const sharePanel = (page: Page) => page.getByRole('region', { name: /post your build/i })

async function expectPreparedShare(page: Page) {
  const share = sharePanel(page)
  await expect(share).toBeVisible()
  await expect(share.getByText('Image ready', { exact: true })).toBeVisible({
    timeout: 30_000,
  })
  await expect(page.getByRole('button', { name: 'Post on X' })).toBeEnabled()
  return share
}

async function expectPreparedFile(page: Page, fileName: string) {
  const share = sharePanel(page)
  await expect(share.getByRole('img', { name: `Prepared ${fileName}` })).toBeVisible({
    timeout: 30_000,
  })
  await expect(page.locator('.editor-download-button')).toBeEnabled()
  return share
}

async function openCompletedBuilder(
  page: Page,
  title: 'AI × Web3 Builder' | 'Protocol Builder' = 'AI × Web3 Builder',
) {
  await upload(page, 'portrait.jpg')
  await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })
  await chooseFormat(page, 'Builder ID')
  await page.getByLabel('Your name').fill('Aditya Jadhav')
  await page.getByLabel('What you build').fill('Backend · Architecture')
  await page.getByLabel('Builder title').selectOption({ label: title })
  await expect(builderPreview(page, 'front')).toBeVisible()
  await expect(page.locator('.editor-download-button')).toBeEnabled({
    timeout: 30_000,
  })
}

type IntentProbeMode = 'opened' | 'popup-blocked' | 'navigation-blocked'

/**
 * Keep X itself out of the test while exercising the real synchronous popup
 * path. The application first opens about:blank, then navigates that popup to
 * the compose intent so it can distinguish a real popup from a blocked one.
 */
async function installIntentProbe(page: Page, mode: IntentProbeMode) {
  await page.evaluate((probeMode) => {
    const probe = {
      initialUrl: null as string | null,
      target: null as string | null,
      replacedUrl: null as string | null,
      closed: false,
    }
    const instrumentedWindow = window as typeof window & {
      __xIntentProbe?: typeof probe
    }
    instrumentedWindow.__xIntentProbe = probe

    window.open = ((url?: string | URL, target?: string) => {
      probe.initialUrl = url === undefined ? null : String(url)
      probe.target = target ?? null

      if (probeMode === 'popup-blocked') return null

      return {
        opener: window,
        location: {
          replace(nextUrl: string | URL) {
            if (probeMode === 'navigation-blocked') {
              throw new DOMException('Navigation blocked', 'SecurityError')
            }
            probe.replacedUrl = String(nextUrl)
          },
        },
        close() {
          probe.closed = true
        },
      } as unknown as Window
    }) as typeof window.open
  }, mode)
}

async function readIntentProbe(page: Page) {
  return page.evaluate(() => {
    const instrumentedWindow = window as typeof window & {
      __xIntentProbe?: {
        initialUrl: string | null
        target: string | null
        replacedUrl: string | null
        closed: boolean
      }
    }
    return instrumentedWindow.__xIntentProbe ?? null
  })
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  ;(page as Page & { __errors?: string[] }).__errors = errors
  await page.goto('/')
})

test.afterEach(async ({ page }) => {
  const errors = (page as Page & { __errors?: string[] }).__errors ?? []
  expect(errors, `console errors: ${errors.join(' | ')}`).toEqual([])
})

test('all three formats swap output size while keeping the uploaded photo', async ({
  page,
}) => {
  await upload(page, 'portrait.jpg')
  const initialPfp = previewOf(page, '1080×1080')
  await expect(initialPfp).toBeVisible({ timeout: 20_000 })
  await expect
    .poll(() => initialPfp.evaluate((canvas: HTMLCanvasElement) => canvas.width))
    .toBeGreaterThan(300)
  const initialPfpData = await initialPfp.evaluate((canvas: HTMLCanvasElement) =>
    canvas.toDataURL(),
  )

  await chooseFormat(page, 'Builder ID')
  await expect(builderPreview(page, 'front')).toBeVisible()
  await flipBuilderTo(page, 'back')

  await chooseFormat(page, 'Crew frame')
  await expect(previewOf(page, '2048×1362')).toBeVisible()

  await chooseFormat(page, 'Profile picture')
  const restoredPfp = previewOf(page, '1080×1080')
  await expect(restoredPfp).toBeVisible()
  await expect
    .poll(() => restoredPfp.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()))
    .toBe(initialPfpData)
  await expect(page.getByRole('button', { name: /Flip to/i })).toHaveCount(0)
})

test('selecting a different PFP frame changes the live canvas', async ({ page }) => {
  await upload(page, 'portrait.jpg')
  const preview = previewOf(page, '1080×1080')
  await expect(preview).toBeVisible({ timeout: 20_000 })

  await expect(page.getByRole('radio', { name: /Coastal postcard/ })).toBeChecked()
  const postcard = await preview.evaluate((canvas: HTMLCanvasElement) =>
    canvas.toDataURL(),
  )

  await page.locator('.frame-selector label').filter({ hasText: 'Midnight Goa' }).click()
  await expect(page.getByRole('radio', { name: /Midnight Goa/ })).toBeChecked()
  await expect
    .poll(() => preview.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()))
    .not.toBe(postcard)

  await page
    .locator('.frame-selector label')
    .filter({ hasText: 'Heritage portal' })
    .click()
  await expect(page.getByRole('radio', { name: /Heritage portal/ })).toBeChecked()
  await expect
    .poll(() => preview.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()))
    .not.toBe(postcard)
})

test('Builder ID requires a name before it can be generated', async ({ page }) => {
  await upload(page, 'portrait.jpg')
  await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })

  await chooseFormat(page, 'Builder ID')
  await expect(page.locator('.editor-download-button')).toBeDisabled()
  await expect(page.getByText(/Add your name, stack and team/i)).toBeVisible()

  await page.getByLabel('Your name').fill('Aditya Jadhav')
  // Role is required too — a card without it left a hole in the layout.
  await expect(page.locator('.editor-download-button')).toBeDisabled()
  await page.getByLabel('What you build').fill('Backend')
  await expect(page.locator('.editor-download-button')).toBeEnabled({
    timeout: 30_000,
  })
})

test('Builder ID starts on its personalized front and flips back and forth reliably', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await openCompletedBuilder(page)

  const flipper = page.locator('.builder-card-flipper')
  const frontFace = page.locator('[data-card-face="front"]')
  const backFace = page.locator('[data-card-face="back"]')
  const frontCanvas = builderCanvas(page, 'front')
  const backCanvas = builderCanvas(page, 'back')
  const flipToBack = page.getByRole('button', { name: 'Flip to Back' })

  await expect(flipper).toHaveAttribute('data-card-side', 'front')
  await expect(frontFace).toHaveAttribute('aria-hidden', 'false')
  await expect(backFace).toHaveAttribute('aria-hidden', 'true')
  await expect(flipToBack).toHaveAttribute('type', 'button')
  await expect(flipToBack).toHaveAttribute('aria-pressed', 'false')
  await expect(builderPreview(page, 'front')).toHaveAccessibleName(
    /Builder ID front preview for Aditya Jadhav, Backend · Architecture, team GoaByte/i,
  )

  const originalFront = await frontCanvas.evaluate((canvas: HTMLCanvasElement) =>
    canvas.toDataURL(),
  )

  await flipBuilderTo(page, 'back')
  await expect(frontFace).toHaveAttribute('aria-hidden', 'true')
  await expect(backFace).toHaveAttribute('aria-hidden', 'false')
  await expect(page.getByRole('button', { name: 'Flip to Front' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(builderPreview(page, 'back')).toHaveAccessibleName(
    /Aditya Jadhav, AI × Web3 Builder, with an original crew-builder mascot and Hacker House Goa 2026 branding/i,
  )
  const originalBack = await backCanvas.evaluate((canvas: HTMLCanvasElement) =>
    canvas.toDataURL(),
  )
  expect(originalBack).not.toBe(originalFront)

  await flipBuilderTo(page, 'front')
  await expect
    .poll(() => frontCanvas.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()))
    .toBe(originalFront)

  // Exercise repeated taps; the suite-wide console/page-error hook turns any
  // render or animation failure into a test failure.
  for (let cycle = 0; cycle < 2; cycle += 1) {
    await flipBuilderTo(page, 'back')
    await flipBuilderTo(page, 'front')
  }

  await flipBuilderTo(page, 'back')
  await page.getByLabel('Builder title').selectOption({ label: 'Protocol Builder' })
  await expect(builderPreview(page, 'back')).toHaveAccessibleName(/Protocol Builder/i)
  await expect
    .poll(() => backCanvas.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()))
    .not.toBe(originalBack)

  await flipBuilderTo(page, 'front')
  await expect
    .poll(() => frontCanvas.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()))
    .not.toBe(originalFront)
})

test('Builder ID exports the visible front and back as distinct 1080×1350 PNGs', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await openCompletedBuilder(page)

  const frontName = 'hhgoa-2026-aditya-jadhav-builder-id-front.png'
  await expectPreparedFile(page, frontName)
  await expect(page.locator('.editor-download-button')).toContainText('Download Front')
  const frontFile = await download(page)
  const frontBytes = readFileSync(await frontFile.path())
  expect(frontFile.suggestedFilename()).toBe(frontName)
  expect(pngSize(frontBytes)).toEqual({ width: 1080, height: 1350 })

  await flipBuilderTo(page, 'back')
  const backName = 'hhgoa-2026-aditya-jadhav-builder-id-back.png'
  await expectPreparedFile(page, backName)
  await expect(page.locator('.editor-download-button')).toContainText('Download Back')
  const backFile = await download(page)
  const backBytes = readFileSync(await backFile.path())
  expect(backFile.suggestedFilename()).toBe(backName)
  expect(pngSize(backBytes)).toEqual({ width: 1080, height: 1350 })
  expect(backBytes.equals(frontBytes)).toBe(false)
})

test('reduced-motion users can flip the Builder ID immediately with the keyboard', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openCompletedBuilder(page)

  const flipper = page.locator('.builder-card-flipper')
  const card = page.locator('.builder-card-perspective')
  const button = page.getByRole('button', { name: 'Flip to Back' })
  await button.scrollIntoViewIfNeeded()

  const durationMs = await flipper.evaluate((element) => {
    const durations = getComputedStyle(element)
      .transitionDuration.split(',')
      .map((duration) => duration.trim())
      .map((duration) =>
        duration.endsWith('ms')
          ? Number.parseFloat(duration)
          : Number.parseFloat(duration) * 1000,
      )
    return Math.max(...durations)
  })
  expect(durationMs).toBeLessThanOrEqual(0.011)

  const before = await card.boundingBox()
  const scrollBefore = await page.evaluate(() => window.scrollY)
  await button.focus()
  await expect(button).toBeFocused()
  await page.keyboard.press('Enter')

  const reverse = page.getByRole('button', { name: 'Flip to Front' })
  await expect(reverse).toBeFocused()
  await expect(flipper).toHaveAttribute('data-card-side', 'back')
  await expect(builderPreview(page, 'back')).toBeVisible()
  const after = await card.boundingBox()
  const scrollAfter = await page.evaluate(() => window.scrollY)

  expect(before).not.toBeNull()
  expect(after).not.toBeNull()
  expect(after!.width).toBeCloseTo(before!.width, 1)
  expect(after!.height).toBeCloseTo(before!.height, 1)
  expect(scrollAfter).toBeCloseTo(scrollBefore, 0)
})

test('Builder ID keeps an editable team name in the exported identity layer', async ({
  page,
}) => {
  await upload(page, 'portrait.jpg')
  await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })
  await chooseFormat(page, 'Builder ID')

  await expect(page.getByLabel('Team name')).toHaveValue('GoaByte')
  await page.getByLabel('Your name').fill('Aditya Jadhav')
  await page.getByLabel('What you build').fill('Canvas · React')

  const preview = previewOf(page, '1080×1350')
  const before = await preview.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())
  await page.getByLabel('Team name').fill('GoaByte Labs')
  await expect
    .poll(() => preview.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()))
    .not.toBe(before)
  await expect(page.locator('.editor-download-button')).toBeEnabled({
    timeout: 30_000,
  })
})

test('the builder title suggestion is deterministic across reloads', async ({ page }) => {
  const suggestionFor = async () => {
    await upload(page, 'portrait.jpg')
    await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })
    await chooseFormat(page, 'Builder ID')
    await page.getByLabel('Your name').fill('Aditya Jadhav')
    const title = page.getByLabel('Builder title')
    await expect(title).not.toHaveValue('')
    return title.inputValue()
  }

  const first = await suggestionFor()
  await page.reload()
  const second = await suggestionFor()

  expect(first).toBeTruthy()
  expect(second).toBe(first)
})

test('long, emoji and Devanagari names all render without breaking the card', async ({
  page,
}) => {
  await upload(page, 'portrait.jpg')
  await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })
  await chooseFormat(page, 'Builder ID')

  for (const name of ['Aditya Ramchandra Deshpande Jr', '🚀 Builder 👨‍💻', 'आदित्य जाधव']) {
    await page.getByLabel('Your name').fill(name)
    await page.getByLabel('What you build').fill('Backend')
    await expect(previewOf(page, '1080×1350')).toBeVisible()
    await expect(page.locator('.editor-download-button')).toBeEnabled({
      timeout: 30_000,
    })
  }
})

test('Crew frame supports a 1–4 person roster and exports at 2048×1362', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await upload(page, 'portrait.jpg')
  await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })
  await chooseFormat(page, 'Crew frame')
  await expect(previewOf(page, '2048×1362')).toBeVisible()

  await page.getByLabel('Your name').fill('Aditya Jadhav')
  await page.getByLabel('What you build').fill('Frontend engineering')
  await expect(page.getByText('1/4', { exact: true })).toBeVisible()
  await expect(page.getByText(/Build your crew · 1–4 members/i)).toBeVisible()

  await page
    .locator('.crew-builder input[type="file"]')
    .setInputFiles(fixture('landscape.jpg'))
  await expect(page.locator('.crew-member-row')).toHaveCount(2, { timeout: 20_000 })
  await expect(page.getByText('2/4', { exact: true })).toBeVisible()

  const teammate = page.locator('.crew-member-row').filter({
    has: page.locator('.crew-member-index', { hasText: '02' }),
  })
  await teammate.getByLabel('Name').fill('Nitin Gupta')
  await teammate.getByLabel('Role / title').fill('Frontend')

  await expect(page.locator('.editor-download-button')).toBeEnabled({
    timeout: 45_000,
  })
  const file = await download(page)
  expect(file.suggestedFilename()).toBe('hhgoa-2026-goabyte-crew.png')
  expect(pngSize(readFileSync(await file.path()))).toEqual({ width: 2048, height: 1362 })
})

test('share controls prepare the current PNG before any download', async ({ page }) => {
  // Keep preparation visibly in flight long enough to assert the intermediate
  // state without coupling the test to machine speed.
  await page.addInitScript(() => {
    const originalToBlob = HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function delayedToBlob(callback, type, quality) {
      originalToBlob.call(
        this,
        (blob) => window.setTimeout(() => callback(blob), 650),
        type,
        quality,
      )
    }
  })
  await page.reload()

  await upload(page, 'portrait.jpg')
  const share = sharePanel(page)
  await expect(share).toBeVisible({ timeout: 20_000 })
  await expect(share.getByText('Preparing', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Preparing X post…' })).toBeDisabled()
  await expect(share).toContainText('#FrameInGoa')

  await expectPreparedShare(page)
  await expect(page.getByRole('button', { name: 'Post on X' })).toBeVisible()
})

test('the share caption is selectable before download so it can always be recovered', async ({
  page,
}) => {
  await upload(page, 'portrait.jpg')
  await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })

  // FR-054: even with no clipboard and no popup, the user can copy it by hand.
  const caption = page.locator('.select-all')
  await expect(caption).toContainText('#FrameInGoa')
})

test('Post on X opens the compose intent with the exact visible caption', async ({
  page,
}) => {
  await upload(page, 'portrait.jpg')
  await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })
  await expectPreparedShare(page)

  const caption = (await page.locator('.select-all').textContent())?.trim() ?? ''
  expect(caption).not.toBe('')

  await installIntentProbe(page, 'opened')
  await page.getByRole('button', { name: 'Post on X' }).click()

  const probe = await readIntentProbe(page)
  expect(probe).not.toBeNull()
  expect(probe?.initialUrl).toBe('about:blank')
  expect(probe?.target).toBe('_blank')
  const replacedUrl = probe?.replacedUrl
  expect(replacedUrl).toMatch(/^https:\/\/x\.com\/intent\/post\?text=/)
  if (!replacedUrl) throw new Error('X popup was not navigated to the compose intent')

  const intent = new URL(replacedUrl)
  const decodedText = intent.searchParams.get('text')
  expect(decodedText).toBe(caption)
  expect(decodedText?.match(/#FrameInGoa/g) ?? []).toHaveLength(1)
  await expect(page.getByText(/X compose is ready/i)).toBeVisible()
})

test('Post on X exposes the direct intent link when popup or navigation is blocked', async ({
  page,
}) => {
  await upload(page, 'portrait.jpg')
  await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })
  await expectPreparedShare(page)

  const caption = (await page.locator('.select-all').textContent())?.trim() ?? ''

  await installIntentProbe(page, 'popup-blocked')
  await page.getByRole('button', { name: 'Post on X' }).click()

  const fallback = page.getByRole('link', { name: 'Open X in a new tab' })
  await expect(fallback).toBeVisible()
  const fallbackHref = await fallback.getAttribute('href')
  expect(fallbackHref).not.toBeNull()
  if (!fallbackHref) throw new Error('X fallback link has no href')
  const blockedIntent = new URL(fallbackHref)
  expect(`${blockedIntent.origin}${blockedIntent.pathname}`).toBe(
    'https://x.com/intent/post',
  )
  expect(blockedIntent.searchParams.get('text')).toBe(caption)

  // Embedded browsers can permit the blank popup but reject its navigation.
  // That branch must close the unusable tab and expose the same recovery link.
  await installIntentProbe(page, 'navigation-blocked')
  await page.getByRole('button', { name: 'Post on X' }).click()

  const navigationProbe = await readIntentProbe(page)
  expect(navigationProbe?.initialUrl).toBe('about:blank')
  expect(navigationProbe?.closed).toBe(true)
  await expect(fallback).toHaveAttribute('href', /^https:\/\/x\.com\/intent\/post\?text=/)
})

test('switching formats keeps sharing visible and prepares the latest valid graphic', async ({
  page,
}) => {
  await upload(page, 'portrait.jpg')
  await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })
  const share = await expectPreparedShare(page)

  await chooseFormat(page, 'Builder ID')
  await expect(share).toBeVisible()
  await expect(share.getByText('Waiting', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Preparing X post…' })).toBeDisabled()

  await page.getByLabel('Your name').fill('Aditya Jadhav')
  await page.getByLabel('What you build').fill('Canvas · React')
  await expectPreparedShare(page)
  await expect(
    share.getByRole('img', {
      name: 'Prepared hhgoa-2026-aditya-jadhav-builder-id-front.png',
    }),
  ).toBeVisible()
})

test('Builder ID flip stays inside 320/375/390/414px with stable geometry', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 320, height: 720 })
  await upload(page, 'portrait.jpg')
  await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })

  const readGeometry = () =>
    page.evaluate(() => {
      const perspective = document.querySelector<HTMLElement>(
        '.builder-card-perspective',
      )!
      const shell = document.querySelector<HTMLElement>('.builder-card-flip-shell')!
      const front = document.querySelector<HTMLElement>('[data-card-face="front"]')!
      const back = document.querySelector<HTMLElement>('[data-card-face="back"]')!
      const button = document.querySelector<HTMLElement>('.builder-card-flip-button')!
      const eventBrand = document.querySelector<HTMLElement>('.editor-app-brand-event')!
      const cardRect = perspective.getBoundingClientRect()
      const buttonRect = button.getBoundingClientRect()

      return {
        overflow:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        scrollY: window.scrollY,
        shellHeight: shell.offsetHeight,
        eventBrand: {
          text: eventBrand.textContent?.trim(),
          clientWidth: eventBrand.clientWidth,
          scrollWidth: eventBrand.scrollWidth,
        },
        card: {
          x: cardRect.x,
          y: cardRect.y,
          width: cardRect.width,
          height: cardRect.height,
        },
        front: { width: front.offsetWidth, height: front.offsetHeight },
        back: { width: back.offsetWidth, height: back.offsetHeight },
        button: {
          x: buttonRect.x,
          y: buttonRect.y,
          width: buttonRect.width,
          height: buttonRect.height,
        },
      }
    })

  const pfpOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(pfpOverflow, 'PFP overflow at 320px').toBeLessThanOrEqual(0)

  await chooseFormat(page, 'Builder ID')
  await page.getByLabel('Your name').fill('Aditya Jadhav')
  await page.getByLabel('What you build').fill('Backend')
  await page
    .getByLabel('Builder title')
    .selectOption({ label: 'Web3 Security Researcher' })
  await expect(page.locator('.editor-download-button')).toBeEnabled({
    timeout: 30_000,
  })

  for (const width of [320, 375, 390, 414]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(page.locator('.builder-card-flipper')).toHaveAttribute(
      'data-card-side',
      'front',
    )

    const flip = page.getByRole('button', { name: 'Flip to Back' })
    await flip.scrollIntoViewIfNeeded()
    const before = await readGeometry()

    expect(before.overflow, `${width}px front overflow`).toBeLessThanOrEqual(0)
    expect(before.eventBrand.text).toBe('Hacker House Goa 2026')
    expect(
      before.eventBrand.scrollWidth,
      `${width}px full event branding remains visible`,
    ).toBeLessThanOrEqual(before.eventBrand.clientWidth + 1)
    expect(before.card.x, `${width}px card left edge`).toBeGreaterThanOrEqual(-1)
    expect(
      before.card.x + before.card.width,
      `${width}px card right edge`,
    ).toBeLessThanOrEqual(width + 1)
    expect(before.front, `${width}px equal face sizes`).toEqual(before.back)
    expect(before.button.x, `${width}px button left edge`).toBeGreaterThanOrEqual(-1)
    expect(
      before.button.x + before.button.width,
      `${width}px button right edge`,
    ).toBeLessThanOrEqual(width + 1)
    expect(before.button.height, `${width}px touch target`).toBeGreaterThanOrEqual(44)
    expect(before.button.y, `${width}px button below card`).toBeGreaterThanOrEqual(
      before.card.y + before.card.height,
    )

    await flipBuilderTo(page, 'back')
    const after = await readGeometry()
    expect(after.overflow, `${width}px back overflow`).toBeLessThanOrEqual(0)
    expect(after.card.width, `${width}px stable card width`).toBeCloseTo(
      before.card.width,
      1,
    )
    expect(after.card.height, `${width}px stable card height`).toBeCloseTo(
      before.card.height,
      1,
    )
    expect(after.shellHeight, `${width}px stable shell height`).toBe(before.shellHeight)
    expect(after.scrollY, `${width}px no vertical jump`).toBeCloseTo(before.scrollY, 0)
    expect(after.front, `${width}px equal back face sizes`).toEqual(after.back)

    await flipBuilderTo(page, 'front')
  }

  await page.setViewportSize({ width: 320, height: 720 })
  await chooseFormat(page, 'Crew frame')
  await expect(previewOf(page, '2048×1362')).toBeVisible()
  const crewOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(crewOverflow, 'Crew overflow at 320px').toBeLessThanOrEqual(0)
})

test('the caption can be copied without opening X (FR-054)', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await upload(page, 'portrait.jpg')
  await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })

  await page.getByRole('button', { name: 'Copy caption' }).click()
  await expect(page.getByText('Caption copied.')).toBeVisible()

  const clipboard = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboard).toContain('#FrameInGoa')
})
