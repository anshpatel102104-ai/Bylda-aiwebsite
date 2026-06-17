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

## Batch 3 — accessibility (a11y 80→95) — IN PROGRESS
- [~] Color-contrast: bumped under-AA text tokens (brand.css text-secondary/tertiary, nova-global --white-30/60, nova-omni/polish/maxx/nav/v5/galaxy/solar text colors) + lighter purple --accent-on-dark for links on dark + darkened changelog status badges. Failing nodes ~264→~100 across test set; about/services/faq/how-it-works/case-study detail now 0. REMAINING: changelog/case-studies-index/roadmap bespoke status colors + #800080-purple-as-text on dark sections + gradient-heading false positives.
- [x] Form labels (critical): aria-label on selects /free-audit /affiliate /newsletter /lp/local-business-lp + /pricing toggle
- [ ] Missing `<main>` landmark on 68 pages (APPROVED — doing next)
- [x] aria-hidden-focus fixed (/sign-in si-brand tabindex, /operations via removing legacy site.js)
- [x] CRITICAL: removed committed git merge-conflict markers on 4 /operations/* pages (dup nav/footer/announcement)
- [x] link-in-text-block underlines (/sign-in /press /privacy)
- [ ] heading-order jumps (moderate) — deferred

## Batch 4 — SEO (74→95) — NOT STARTED
- [ ] Add JSON-LD structured data (Organization, Article, FAQ)
- [ ] Complete OG/Twitter tags per page; real per-page OG images
- [ ] Shorten long titles (blog/industry pages > 65 chars)
- [ ] Add ~90 missing pages to sitemap.xml (blog posts, industries, lp, etc.)

## Content decisions for the owner (not code bugs)
- [ ] Press page still shows TechCrunch/Forbes/Entrepreneur quotes that read as real coverage — replace with genuine coverage or reframe.
- [ ] Orphan pages (preview.html, nova-landing.html) — keep or remove?
