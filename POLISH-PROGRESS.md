# Website Polish / Bug-Fix Progress

Working branch: `claude/vigilant-brahmagupta-ubr8b6`. This file tracks an ongoing
professionalism / bug-fix pass so work can resume after a session reset. Update
the checkboxes as items land; commit + push after each chunk.

To re-measure mobile overflow precisely:
`cd maintenance && PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node find-overflow.js / /contact /dental ...`

## Batch 1 — functional bugs + duplicate legal pages — ✅ DONE (commit a681935)
- [x] Remove legacy off-canvas `mobile-drawer` (overflow on /404, /industries, 3 pricing subpages)
- [x] Done-For-You empty price `$ ` → `$4,997`
- [x] Press dead "Read Article" links removed
- [x] Media-kit Download buttons → email requests
- [x] preview.html dead CTAs wired
- [x] nova-landing wrong-domain branding fixed
- [x] /privacy + /terms canonical (enriched content) + 301 redirects + delete dupes

## Batch 2 — mobile overflow — IN PROGRESS
- [x] Nav too wide on mobile: hide `.nav-actions` at breakpoint in nav.css (1024) + nova-global.css (1100). Fixes all /operations/* (73px → 0). Verified.
- [x] /contact (215px) — 2-col grid collapses at <=768px (.contact-grid)
- [x] /industries/* (213–224px) — 3-col card grid → responsive auto-fit; defined missing .mobile-stack utility
- [x] /dental (98px) — process section 2-col grid uses .mobile-stack
- [ ] /operations/* residual 8px — decorative `.rk-nebula`/`.cin-nebula` blob bleed (also desktop/tablet 8px)
- [ ] / home (28px) + /nova-landing (36px) — decorative marquee residue (low priority)
- [ ] Re-run full design audit to confirm overflow cleared site-wide

## Batch 3 — accessibility (a11y 80→95) — NOT STARTED
- [ ] Site-wide low color-contrast (biggest perceived-quality issue) — needs design-token review first
- [ ] Missing `<select>`/form labels: /free-audit, /affiliate, /newsletter, /pricing
- [ ] Missing `<main>` landmark + content-not-in-landmark on most pages
- [ ] heading-order jumps; aria-hidden focusable on /sign-in, /operations/*

## Batch 4 — SEO (74→95) — NOT STARTED
- [ ] Add JSON-LD structured data (Organization, Article, FAQ)
- [ ] Complete OG/Twitter tags per page; real per-page OG images
- [ ] Shorten long titles (blog/industry pages > 65 chars)
- [ ] Add ~90 missing pages to sitemap.xml (blog posts, industries, lp, etc.)

## Content decisions for the owner (not code bugs)
- [ ] Press page still shows TechCrunch/Forbes/Entrepreneur quotes that read as real coverage — replace with genuine coverage or reframe.
- [ ] Orphan pages (preview.html, nova-landing.html) — keep or remove?
