// Interactions outside the film: mega-menu, request-access modal, book-a-call links, FAQ accordion.
import { chromium } from '@playwright/test'
const base = process.env.BASE || 'http://localhost:4173/'
const out = process.argv[2]
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', e => errors.push(e.message))
await page.goto(base, { waitUntil: 'networkidle' })
let ok = true
const check = (n, c, x = '') => { console.log(c ? 'PASS' : 'FAIL', n, x); ok &&= c }

await page.getByRole('button', { name: 'Product' }).click()
await page.waitForTimeout(250)
check('mega-menu opens', await page.locator('#menu-product[data-open]').count() === 1)
await page.locator('.mm-group').nth(2).hover()
await page.waitForTimeout(200)
if (out) await page.screenshot({ path: `${out}/megamenu.png` })
await page.keyboard.press('Escape')
await page.waitForTimeout(250)
check('mega-menu closes on Escape', await page.locator('#menu-product[data-open]').count() === 0)

await page.locator('#hero-email').fill('dana@example.com')
await page.locator('.hero .hero-form button[type=submit]').click()
await page.waitForTimeout(300)
check('request access opens with email', await page.locator('.modal[data-open]').count() === 1 && (await page.locator('.modal input[name=email]').inputValue()) === 'dana@example.com')
if (out) await page.screenshot({ path: `${out}/modal.png` })
await page.keyboard.press('Escape')
await page.waitForTimeout(250)
check('modal closes on Escape', await page.locator('.modal[data-open]').count() === 0)

// Contract-only: no pricing link anywhere, and Book a call is offered alongside Request access.
check('no pricing link', await page.locator('a[href="/pricing"]').count() === 0)
check('book a call in nav', await page.locator('.nav-right a[href="/book"]').count() === 1)

await page.getByRole('button', { name: 'Will my reps feel watched?' }).click()
await page.waitForTimeout(300)
check('faq expands', (await page.getByRole('button', { name: 'Will my reps feel watched?' }).getAttribute('aria-expanded')) === 'true')
check('no page errors', errors.length === 0, errors.join(' | '))
await browser.close()
process.exit(ok ? 0 : 1)
