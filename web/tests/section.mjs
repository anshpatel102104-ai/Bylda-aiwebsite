// Screenshot the whole showreel section (headline, stage, chapter rail). Usage: node tests/section.mjs <file> <width> [t]
import { chromium } from '@playwright/test'
const [file, width = '1440', t] = process.argv.slice(2)
const base = process.env.BASE || 'http://localhost:4173/'
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const page = await browser.newPage({ viewport: { width: Number(width), height: 1000 } })
await page.goto(t ? `${base}?t=${t}` : base, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(300)
await page.locator('.showreel-section').screenshot({ path: file })
await browser.close()
