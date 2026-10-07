// Interactions outside the film: mega-menu, request-access modal, tour keyboard, spotlight, FAQ accordion.
import { chromium } from '@playwright/test'
const base = process.env.BASE || 'http://localhost:4173/next/'
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

// Tour: spotlight shows once, then keyboard works.
await page.locator('#tour').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }))
await page.waitForTimeout(600)
check('spotlight shows on first visit', await page.locator('.spot-callout').count() === 1)
if (out) await page.screenshot({ path: `${out}/spotlight.png` })
await page.getByRole('button', { name: 'Got it' }).click()
await page.waitForTimeout(200)
check('spotlight dismissed', await page.locator('.spot-callout').count() === 0)
await page.getByRole('tab', { name: 'Call timeline' }).focus()
await page.keyboard.press('ArrowRight')
await page.waitForTimeout(250)
check('tour arrow key selects Analysis', (await page.getByRole('tab', { name: 'Analysis' }).getAttribute('aria-selected')) === 'true')
await page.keyboard.press('End')
await page.waitForTimeout(250)
check('tour End selects Results', (await page.getByRole('tab', { name: 'Results' }).getAttribute('aria-selected')) === 'true')
// Focus holds the tour on Results, but the tab still plays its intro (regression: it used to stay blank).
const bar = () => page.locator('.tour-tab[aria-selected="true"] .tour-tab-bar b').evaluate(b => new DOMMatrix(getComputedStyle(b).transform).a)
await page.waitForTimeout(2000)
const mid = await bar()
check('held tab still animates', mid > 0.15 && mid < 1, mid.toFixed(2))
if (out) await page.locator('.tour').screenshot({ path: `${out}/tour.png` })
await page.waitForTimeout(5500)
check('held tab does not advance', (await page.getByRole('tab', { name: 'Results' }).getAttribute('aria-selected')) === 'true')

await page.getByRole('button', { name: 'Will my reps feel watched?' }).click()
await page.waitForTimeout(300)
check('faq expands', (await page.getByRole('button', { name: 'Will my reps feel watched?' }).getAttribute('aria-expanded')) === 'true')
check('no page errors', errors.length === 0, errors.join(' | '))
await browser.close()
process.exit(ok ? 0 : 1)
