# Full Site Audit — 2026-10-14

Scope: all 53 deployed pages (built with `npm run build`, served from `dist/`), at desktop (1440×900) and mobile (390×844).
Checks run: console/page errors, failed requests, internal link crawl, horizontal overflow, h1 count, image alt/broken images,
clipped text, dead `#anchors`, scroll-reveal animations, axe-core accessibility (WCAG 2.1 AA), the homepage's own
Playwright suites (`site`, `console`, `reduced`), and a manual visual pass on screenshots.

## Baseline: what's clean

- 0 broken internal links. 0 dead anchors. 0 broken images. Every image has alt text.
- 0 horizontal scroll at 390px on every page.
- Exactly one `<h1>` on every page. Skip link on every page.
- 0 console errors on 52/53 pages (`/waitlist` is the exception, see #9 — expected locally).
- Homepage suites: mega-menu, request-access modal, FAQ, reduced-motion and console all pass.
- axe: only 1 real contrast failure site-wide (fixed below).

---

## ✅ Fixed in this commit

| # | Bug | Where | Fix |
|---|-----|-------|-----|
| F1 | **Blog posts load blank under the title.** Content stayed invisible on first paint (~550px of empty space at 1440×900) until you scrolled. The scroll-reveal fired at 18% visibility, and a 2,700px article can't show 18% in the first viewport. On a phone, sections over ~4,400px tall could never reveal at all. | `os.js` (all 52 static pages; blog posts were worst) | Reveal now triggers as soon as the element's top enters the viewport (threshold 0, 8% bottom inset). Elements already above the viewport (when the page loads at a `#hash` or restores scroll) reveal immediately. |
| F2 | **Mobile menu ignores Escape.** Once open it could only be closed by tapping ✕ or a link. | `os.js` | Escape closes it, resets `aria-expanded`, and returns focus to the burger button. |
| F3 | **Burger stayed `aria-expanded="true"` after picking a menu link.** Screen readers announced the menu as still open. | `os.js` | Resets to `false` on link click. |
| F4 | **Showreel chapter captions failed contrast (2.57:1).** The small grey captions under the homepage film chapters. | `web/src/components/Showreel/showreel.css` | `--text-3` → `--text-2` (#6e6c68, ≈4.9:1, passes AA). |

---

## 🔧 For you to fix (one at a time, highest impact first)

### 1. Two different navigation bars across the site — HIGH
- **What:** The homepage (React app) nav is `Product ▾ / Solutions ▾ / Resources ▾` with mega-menus. All 52 other pages use `Product / How it works / Blog / Security`. Visitors who click off the homepage see the nav change shape.
- **Where:** `web/src/components/site/Nav.tsx` vs the `<header class="nav">` block in every root `*.html`.
- **Fix:** Pick one. The fastest path is to match the static pages' link set to the homepage's top-level labels (they can link to `/product`, `/for-sales-managers`, `/blog` without mega-menus).

### 2. Breadcrumb and kicker say the same word, stacked — MEDIUM
- **What:** `HOME / ABOUT` sits directly above a `— ABOUT` kicker. Repeats the label twice in 40px.
- **Where (19 pages):** about, ai-sales-call-analysis, ai-sales-coaching, blog/index, careers, changelog, contact, conversation-intelligence, crm-automation, customers, deal-intelligence, faq, how-it-works, integrations, privacy, product, sales-performance-analytics, sitemap, terms.
- **Fix:** Delete the `<p class="kicker" data-reveal>…</p>` line under the breadcrumb on those pages, or change the kicker to a descriptive label (e.g. "Company", "Platform").

### 3. Mobile menu links look disabled — MEDIUM
- **What:** Menu links are `--silver-600` grey and only turn black on hover. Phones don't hover, so all five links read as greyed out.
- **Where:** `pearl.css:219` (`.menu a { … color: var(--silver-600); }`).
- **Fix:** `color: var(--ink)`, and keep `aria-current="page"` distinct with an underline or weight instead.

### 4. Mobile menu doesn't trap focus — MEDIUM (a11y)
- **What:** With the menu open, Tab moves into the page behind the overlay.
- **Where:** `os.js` mobile menu block; `<nav class="menu">` in each page.
- **Fix:** Add `inert` to `<main>` and `<footer>` while `body.menu-open` is set, and add `aria-controls` on `.nav-burger` pointing to an `id` on `.menu`.

### 5. Help "?" button overlaps the hero demo on mobile — LOW
- **What:** At 390px the floating help button sits on top of the bottom-right of the showreel card (covers the "41%" stat).
- **Where:** Homepage, floating help button (bottom right).
- **Fix:** Hide it until the hero has scrolled past, or give the showreel card `margin-bottom` ≥ 72px on mobile.

### 6. Meta descriptions too long (Google truncates past ~160 chars) — LOW (SEO)
| Page | Length |
|------|--------|
| `/security` | 184 |
| `/integrations/salesforce` | 176 |
| `/integrations` | 174 |
| `/product/outcome-graph` | 171 |
| `/product/behavior-profiles` | 167 |

### 7. Daily design audit is checking pages that aren't deployed — LOW (noise)
- **What:** `reports/design/2026-10-14.md` flags `/web` and `/web/review/milestone-1/lighthouse-mobile`. `web/` is excluded from `dist/`, so those aren't live pages. It also times out on `/waitlist` because it waits for `networkidle` and Turnstile keeps the network busy.
- **Where:** `maintenance/lib/pages.js` / `maintenance/design-audit.js`.
- **Fix:** Use the same exclude list as `scripts/assemble-site.mjs`, and use `waitUntil: 'load'` for `/waitlist`.

### 8. Low-contrast text inside decorative product mockups — LOW
- **What:** The red "hot" stage label (9px, 4.26:1) and the "interruptions" cue (4.37:1) on pink fills.
- **Where:** `/`, `/product/call-review`, `/product/behavior-analysis`, `/product/behavior-profiles`, in `web/src/ui/CallTimeline.tsx` and the coaching-brief card.
- **Note:** These are `aria-hidden` illustrations, so it's cosmetic. Darken `#c2413b` → `#b0362f` if you want axe at zero.

### 9. Turnstile on `/waitlist` must allow every domain you deploy to — CHECK
- **What:** Locally Turnstile throws error `110200` (domain not authorized). That's expected on localhost, but the same thing will happen on **Vercel preview URLs** unless they're in the allowlist. The waitlist form can't submit when that happens.
- **Fix:** In Cloudflare → Turnstile → the site key's hostnames, confirm `bylda.ai` (and `www`) plus your preview domain are listed. Submit the form once on a preview deploy to confirm.

### 10. Homepage hero email field has no placeholder — OPTIONAL
- **What:** An empty pill input under the "Work email" label. The `/waitlist` form uses `you@company.com`; the homepage doesn't.
- **Where:** `web/src/components/site/Hero.tsx`.
- **Fix:** `placeholder="you@company.com"` for consistency.

---

## How this was tested
1. `npm run build` → served `dist/` with clean-URL routing.
2. Playwright crawl of all 53 URLs × 2 viewports (errors, overflow, links, structure, reveal state).
3. axe-core 4.10 on every page with reveals forced visible.
4. `web/tests/site.mjs`, `console.mjs`, `reduced.mjs` → all pass before and after the fixes.
5. Re-crawl after the fixes: 0 issues, 0 broken links.
