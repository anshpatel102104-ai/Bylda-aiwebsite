// Scrub by dragging the chapter rail, jump by clicking a chapter, pause by clicking the stage.
import { chromium } from '@playwright/test'
const base = process.env.BASE || 'http://localhost:4173/next/'
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.goto(base, { waitUntil: 'networkidle' })
await page.locator('.sr-rail').evaluate(el => el.scrollIntoView({ block: 'end', behavior: 'instant' }))
const caption = page.locator('.sr-caption')
const pauseBtn = page.locator('.sr-btn')
const rail = await page.locator('.sr-rail').boundingBox()
const y = rail.y + 6
let ok = true
const check = (name, cond, extra = '') => { console.log(cond ? 'PASS' : 'FAIL', name, extra); ok &&= cond }

// Drag from chapter 1 to the middle of chapter 4.
await page.mouse.move(rail.x + rail.width * 0.05, y)
await page.mouse.down()
for (let i = 1; i <= 10; i++) await page.mouse.move(rail.x + rail.width * (0.05 + 0.03 * i * 2.0), y)
const during = await caption.textContent()
check('scrub lands in chapter 4 while dragging', during.startsWith('04'), during)
check('film holds while scrubbing', (await page.locator('.sr-rail[data-scrubbing]').count()) === 1)
await page.mouse.up()
await page.waitForTimeout(1200)
check('resumes after release', (await pauseBtn.getAttribute('aria-label')) === 'Pause film')

// Click chapter 6.
await page.locator('.sr-chap').nth(5).click()
await page.waitForTimeout(300)
const c6 = await caption.textContent()
check('click jumps to chapter 6', c6.startsWith('06'), c6)

// Click the stage to pause, then again to resume.
const stage = await page.locator('.sr-stage').boundingBox()
await page.mouse.click(stage.x + stage.width / 2, stage.y + stage.height / 2)
await page.waitForTimeout(200)
check('stage click pauses', (await pauseBtn.getAttribute('aria-label')) === 'Play film')
const live = await page.evaluate(() => document.documentElement.dataset.reel)
check('live indicator off when paused', live === 'paused', live)
await page.mouse.click(stage.x + stage.width / 2, stage.y + stage.height / 2)
await page.waitForTimeout(200)
check('stage click resumes', (await pauseBtn.getAttribute('aria-label')) === 'Pause film')

// Keyboard on the rail.
await page.locator('.sr-chap').nth(1).focus()
await page.keyboard.press('ArrowRight')
await page.waitForTimeout(150)
check('arrow key moves to chapter 3', (await caption.textContent()).startsWith('03'))
await browser.close()
process.exit(ok ? 0 : 1)
