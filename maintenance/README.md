# Website Maintenance System

An automated maintenance system for **nova-ops.space** that keeps the site at
world-class quality: daily SEO and design/UI audits, a weekly AI growth review,
automatic GitHub issues for critical findings, and pull requests for safe fixes.

## Quality targets

| Category | Gate |
| --- | --- |
| SEO | ≥ 95 |
| Accessibility | ≥ 95 |
| Performance | ≥ 90 |
| Design consistency | ≥ 95 |

These thresholds live in [`config.js`](./config.js) and drive issue creation.

## What it does

### Daily SEO audit (`seo-audit.js`)
Crawls every local HTML page (no network needed) and checks: missing/duplicate
titles, missing/duplicate meta descriptions, missing/multiple H1s, broken
internal links, missing alt text, missing canonical tags, sitemap coverage,
robots.txt blocking, structured-data (JSON-LD) validity, Open Graph/Twitter
coverage, mobile viewport, and thin content. Produces an **SEO score (0–100)**,
categorized findings (Critical / High / Recommended), and a report at
`reports/seo/YYYY-MM-DD.md`. External link checking is opt-in (`CHECK_EXTERNAL=1`).

### Daily design & UI audit (`design-audit.js`)
Serves the site locally and drives Playwright across **desktop / tablet /
mobile** viewports. Captures full-page screenshots, detects horizontal overflow,
broken/missing images, console & page errors, and runs **axe-core** accessibility
checks. Produces a **Visual Regression Report** (vs. an approved baseline), a
**UI Quality Score**, **Accessibility Score**, and **Performance Score**, with a
report at `reports/design/YYYY-MM-DD.md`. Screenshots go to
`reports/design/screenshots/<date>/` (git-ignored; uploaded as CI artifacts).

### Weekly growth review (`growth-review.js`)
A strategic review — conversion, design, SEO growth, and a competitor benchmark
against Omni.co, Linear, Vercel, Notion, Stripe, and Retool — authored by
**Claude (`claude-opus-4-8`)** when `ANTHROPIC_API_KEY` is set, with a
data-seeded template fallback. Report: `reports/weekly/YYYY-MM-DD-growth-review.md`.

### Safe automated fixes (`autofix.js`)
Surgical, file-preserving edits (no full-HTML reformatting): adds missing
canonical tags, `<html lang>`, and viewport meta tags. Heuristic image alt text
is opt-in via `--alt`. The SEO workflow applies these and opens a PR.

## Running locally

```bash
cd maintenance
npm install

npm run seo        # SEO audit  → reports/seo/
npm run design     # Design/UI audit (needs Playwright Chromium)
npm run growth     # Weekly growth review (set ANTHROPIC_API_KEY for AI output)
npm run all        # all three

npm run autofix        # dry run — list safe fixes
npm run autofix:apply  # apply safe fixes to the HTML files
```

`npx playwright install chromium` is required once for the design audit.

## Scheduling (GitHub Actions)

| Workflow | Schedule | File |
| --- | --- | --- |
| Daily SEO Audit | 06:00 UTC daily | [`.github/workflows/seo-audit.yml`](../.github/workflows/seo-audit.yml) |
| Daily Design & UI Audit | 07:00 UTC daily | [`.github/workflows/design-audit.yml`](../.github/workflows/design-audit.yml) |
| Weekly Growth Review | 08:00 UTC Sundays | [`.github/workflows/weekly-growth-review.yml`](../.github/workflows/weekly-growth-review.yml) |

Each workflow can also be triggered manually (**Run workflow**). They commit the
generated reports, open/refresh GitHub issues for critical findings or missed
gates, and (SEO) open a PR with safe fixes.

### Required secret

- `ANTHROPIC_API_KEY` — enables the AI-authored weekly growth review. Without it,
  the review falls back to a data-seeded template (the workflow still succeeds).

## Layout

```
maintenance/
  config.js          # site config, thresholds, quality gates, competitors
  seo-audit.js       # daily SEO audit + report
  design-audit.js    # daily design/UI audit + screenshots + report
  growth-review.js   # weekly AI growth review
  autofix.js         # safe automated fixes
  run-all.js         # run everything
  lib/
    pages.js         # page discovery + clean-URL mapping
    html.js          # cheerio metadata extraction
    links.js         # internal/external link analysis + resolution
    sitemap.js       # sitemap.xml + robots.txt parsing
    seo.js           # SEO scoring engine
    server.js        # static server emulating Vercel cleanUrls
    ai.js            # Claude API wrapper (graceful degradation)
    optional.js      # optional/global module loader
    report.js        # markdown + scoring helpers
```
