/**
 * Renders scripts/og-template.html to app/opengraph-image.png.
 *
 * Run manually when the poster changes: `pnpm og`.
 * Deliberately NOT part of `pnpm build` — the output is a committed asset, and
 * making every build depend on a browser download would be a poor trade.
 */
import { chromium } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
})

await page.goto(`file://${join(here, 'og-template.html')}`)
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(300)

const out = join(root, 'app/opengraph-image.png')
await page.screenshot({ path: out, type: 'png' })
await browser.close()

console.log(`wrote ${out}`)
