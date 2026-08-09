import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * SLICE 2 — production templates, format switching, and the share surface.
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

/**
 * Click the LABEL, as a real user does. The input itself is `sr-only` and so
 * has zero size — Playwright refuses to click it directly, but the native
 * label association is what makes the control work for mouse, touch and
 * screen-reader users alike.
 */
async function chooseFormat(page: Page, label: 'Profile picture' | 'Builder ID') {
  await page.getByText(label, { exact: true }).click()
  await expect(page.getByRole('radio', { name: label })).toBeChecked()
}

async function download(page: Page) {
  return Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download PNG' }).click(),
  ]).then(([d]) => d)
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

test('format switching swaps the output size and keeps the photo', async ({ page }) => {
  await upload(page, 'portrait.jpg')
  await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })

  await chooseFormat(page, 'Builder ID')
  await expect(previewOf(page, '1080×1350')).toBeVisible()

  await chooseFormat(page, 'Profile picture')
  await expect(previewOf(page, '1080×1080')).toBeVisible()
})

test('Builder ID requires a name before it can be generated', async ({ page }) => {
  await upload(page, 'portrait.jpg')
  await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })

  await chooseFormat(page, 'Builder ID')
  await expect(page.getByRole('button', { name: 'Download PNG' })).toBeDisabled()
  await expect(page.getByText(/Add your name/i)).toBeVisible()

  await page.getByLabel('Your name').fill('Aditya Jadhav')
  // Role is required too — a card without it left a hole in the layout.
  await expect(page.getByRole('button', { name: 'Download PNG' })).toBeDisabled()
  await page.getByLabel('What you build').fill('Backend')
  await expect(page.getByRole('button', { name: 'Download PNG' })).toBeEnabled()
})

test('Builder ID exports at exactly 1080×1350 with a name-based filename', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await upload(page, 'portrait.jpg')
  await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })

  await chooseFormat(page, 'Builder ID')
  await page.getByLabel('Your name').fill('Aditya Jadhav')
  await page.getByLabel('What you build').fill('Backend · Architecture')
  await expect(page.getByRole('button', { name: 'Download PNG' })).toBeEnabled()

  const file = await download(page)
  expect(file.suggestedFilename()).toBe('hhgoa-2026-aditya-jadhav-builder-card.png')
  expect(pngSize(readFileSync(await file.path()))).toEqual({ width: 1080, height: 1350 })
})

test('the builder title suggestion is deterministic across reloads', async ({ page }) => {
  const suggestionFor = async () => {
    await upload(page, 'portrait.jpg')
    await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })
    await chooseFormat(page, 'Builder ID')
    await page.getByLabel('Your name').fill('Aditya Jadhav')
    return page.getByLabel('Builder title').getAttribute('placeholder')
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
    await expect(page.getByRole('button', { name: 'Download PNG' })).toBeEnabled()
  }
})

test('the share panel appears after export and always shows #FrameInGoa', async ({
  page,
}) => {
  await upload(page, 'portrait.jpg')
  await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })

  await download(page)

  const share = page.getByRole('region', { name: /share/i })
  await expect(share).toBeVisible()
  await expect(share).toContainText('#FrameInGoa')
  await expect(page.getByRole('button', { name: 'Post on X' })).toBeVisible()
})

test('the share caption is selectable so it can always be recovered', async ({
  page,
}) => {
  await upload(page, 'portrait.jpg')
  await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })
  await download(page)

  // FR-054: even with no clipboard and no popup, the user can copy it by hand.
  const caption = page.locator('.select-all')
  await expect(caption).toContainText('#FrameInGoa')
})

test('editing a field invalidates the previous export', async ({ page }) => {
  await upload(page, 'portrait.jpg')
  await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })
  await download(page)
  await expect(page.getByRole('region', { name: /share/i })).toBeVisible()

  // The share panel must not offer a PFP once the user has moved to the card.
  await chooseFormat(page, 'Builder ID')
  await expect(page.getByRole('region', { name: /share/i })).toHaveCount(0)
})

test('no horizontal scroll at 320px on the card format', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await upload(page, 'portrait.jpg')
  await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })
  await chooseFormat(page, 'Builder ID')
  await page.getByLabel('Your name').fill('Aditya Jadhav')
  await page.getByLabel('What you build').fill('Backend')

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

test('the caption can be copied without opening X (FR-054)', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await upload(page, 'portrait.jpg')
  await expect(previewOf(page, '1080×1080')).toBeVisible({ timeout: 20_000 })
  await download(page)

  await page.getByRole('button', { name: 'Copy caption' }).click()
  await expect(page.getByText('Caption copied.')).toBeVisible()

  const clipboard = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboard).toContain('#FrameInGoa')
})
