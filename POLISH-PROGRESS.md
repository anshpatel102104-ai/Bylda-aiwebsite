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

## Batch 2 — mobile overflow — ✅ DONE
- [x] Nav too wide on mobile: hide `.nav-actions` at breakpoint in nav.css (1024) + nova-global.css (1100). Fixes all /operations/* (73px → 0). Verified.
- [x] /contact (215px) — 2-col grid collapses at <=768px (.contact-grid)
- [x] /industries/* (213–224px) — 3-col card grid → responsive auto-fit; defined missing .mobile-stack utility
- [x] /dental (98px) — process section 2-col grid uses .mobile-stack
- [x] /operations/* 8px — root cause was unreset default body margin; added `html,body{margin:0}` to brand.css
- [x] / home (28px) — feature-media bleed; `.systems-flow{overflow-x:clip}`. /nova-landing (36px) — `.fade-right` reveal; html/body overflow-x:clip
- [x] /pricing/retainer (+done-for-you/rev-share) 24px — 2-col detail grids now use .mobile-stack
- [x] Verified 0px overflow at 390/768/1440 across all previously-flagged pages (find-overflow.js)

## Batch 3 — accessibility — ✅ DONE (22-page scan: ~6 nodes left, from hundreds)
- [x] Color-contrast (WCAG AA) — essentially complete. Across a 20-page scan, color-contrast violations went from hundreds → 4. Fixed: under-AA text tokens site-wide (incl. index.html + case-studies inline :root overrides); invisible white text from the dark→light migration (contact/privacy/terms/pricing/how-it-works/integrations/academy/launchpad/industries + case-studies light-section headings); invisible legacy dark footer; off-brand orange badges → purple; roadmap/changelog pastel status colors; --accent-on-dark for purple-on-dark; home launch-sequence nodes. Remaining 4: pricing(2 minor), integrations(2 incl. 1 pre-existing JS-injected nav). Screenshot-verified contact, industries, case-studies.

- [x] Form labels (critical): aria-label on selects /free-audit /affiliate /newsletter /lp/local-business-lp + /pricing toggle
- [x] Wrapped content in `<main id="main-content">` on 70 pages (fixes landmark-one-main + region). Verified 0 landmark/region violations + 0 overflow regression. Also aria-hidden on decorative rk-cosmos/warp-overlay (rocket.js/solar.js).
- [x] aria-hidden-focus fixed (/sign-in si-brand tabindex, /operations via removing legacy site.js)
- [x] CRITICAL: removed committed git merge-conflict markers on 4 /operations/* pages (dup nav/footer/announcement)
- [x] link-in-text-block underlines (/sign-in /press /privacy)
- [x] heading-order: footer column headings <h4>→<h2> site-wide (84 tags, 25 files, CSS selectors updated) + pricing tier-step <h4>→<h3]. Now 0.
- [x] landmark-complementary: changelog sidebar <aside>→<nav aria-label>. Now 0.

## Batch 4 — SEO (74→95) — NOT STARTED
- [ ] Add JSON-LD structured data (Organization, Article, FAQ)
- [ ] Complete OG/Twitter tags per page; real per-page OG images
- [ ] Shorten long titles (blog/industry pages > 65 chars)
- [ ] Add ~90 missing pages to sitemap.xml (blog posts, industries, lp, etc.)

## Content decisions for the owner (not code bugs)
- [ ] Press page still shows TechCrunch/Forbes/Entrepreneur quotes that read as real coverage — replace with genuine coverage or reframe.
- [ ] Orphan pages (preview.html, nova-landing.html) — keep or remove?
