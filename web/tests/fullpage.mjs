// Full-page screenshot after scrolling through once (so scroll reveals fire). Usage: node tests/fullpage.mjs <file> <width>
import { chromium } from '@playwright/test'
const [file, width = '1440'] = process.argv.slice(2)
const base = process.env.BASE || 'http://localhost:4173/'
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const ctx = await browser.newContext({ viewport: { width: Number(width), height: 900 } })
await ctx.addInitScript(() => { try { localStorage.setItem('bylda:tour-spotlight-seen', '1') } catch {} })
const page = await ctx.newPage()
await page.goto(base, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
const h = await page.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < h; y += 500) { await page.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y); await page.waitForTimeout(120) }
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
await page.waitForTimeout(600)
await page.screenshot({ path: file, fullPage: true })
console.log('height', h)
await browser.close()
