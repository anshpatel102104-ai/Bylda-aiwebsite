// Record one full loop of the showreel as a video. Usage: node tests/record.mjs <outdir> <width> <height>
import { chromium } from '@playwright/test'
const [out, width = '1440', height = '900'] = process.argv.slice(2)
const base = process.env.BASE || 'http://localhost:4173/'
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const ctx = await browser.newContext({
  viewport: { width: Number(width), height: Number(height) },
  recordVideo: { dir: out, size: { width: Number(width), height: Number(height) } },
})
const page = await ctx.newPage()
await page.goto(base, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
// Bring the stage into view and restart from chapter 1 so the clip is one loop.
await page.locator('.sr-stage').evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
await page.locator('.sr-chap').first().click()
await page.mouse.move(0, 0)
await page.waitForTimeout(39000)
await ctx.close()
await browser.close()
