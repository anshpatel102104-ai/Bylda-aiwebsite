// Reduced-motion pass: no autoplay, each chapter selectable as a still.
import { chromium } from '@playwright/test'
const [out] = process.argv.slice(2)
const base = process.env.BASE || 'http://localhost:4173/next/'
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 }, reducedMotion: 'reduce' })
const page = await ctx.newPage()
await page.goto(base, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
const stage = page.locator('.sr-stage')
await stage.scrollIntoViewIfNeeded()
const caption = page.locator('.sr-caption')
const a = await caption.textContent()
await page.waitForTimeout(2500)
const b = await caption.textContent()
console.log('autoplay off:', a === b, `(${a})`)
const parts = page.locator('.sr-chap')
for (let i = 0; i < 6; i++) {
  await parts.nth(i).click()
  await page.waitForTimeout(150)
  await stage.screenshot({ path: `${out}/reduced-ch${i + 1}.png` })
  console.log(`chapter ${i + 1}:`, await caption.textContent())
}
await browser.close()
