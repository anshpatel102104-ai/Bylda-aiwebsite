// Screenshot the showreel at given times and widths. Usage: node tests/shoot.mjs <outdir> <width> <t...>
import { chromium } from '@playwright/test'
const [out, width, ...times] = process.argv.slice(2)
const base = process.env.BASE || 'http://localhost:4173/'
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 }, deviceScaleFactor: 1 })
for (const t of times) {
  await page.goto(`${base}?t=${t}`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(250)
  const stage = page.locator('.sr-stage')
  await stage.scrollIntoViewIfNeeded()
  await stage.screenshot({ path: `${out}/w${width}-t${String(t).padStart(5, '0')}.png` })
}
await browser.close()
