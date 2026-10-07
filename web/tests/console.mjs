// Fails on any console error or hydration warning at the given widths.
import { chromium } from '@playwright/test'
const base = process.env.BASE || 'http://localhost:4173/'
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
let bad = 0
for (const width of [1440, 1024, 768, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } })
  const msgs = []
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') msgs.push(`${m.type()}: ${m.text()}`) })
  page.on('pageerror', e => msgs.push(`pageerror: ${e.message}`))
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.locator('.sr-stage').scrollIntoViewIfNeeded()
  await page.waitForTimeout(1500)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  const caption = await page.locator('.sr-caption').textContent()
  console.log(width, { overflowX: overflow, caption, messages: msgs.length })
  msgs.forEach(m => console.log('   ', m.slice(0, 200)))
  bad += msgs.length + (overflow > 0 ? 1 : 0)
  await page.close()
}
await browser.close()
process.exit(bad ? 1 : 0)
