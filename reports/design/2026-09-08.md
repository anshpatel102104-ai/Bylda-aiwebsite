# Design & UI Audit — 2026-09-08

> Automated daily design/UI audit. Generated 2026-09-08T20:26:33.170Z. Screenshots: `reports/design/screenshots/2026-09-08/`.

## Scores

| Metric | Score | Target |
| --- | --- | --- |
| UI Quality | 🟢 100/100 | ≥ 95 |
| Accessibility | 🟢 100/100 | ≥ 95 |
| Performance | 🔴 46/100 | ≥ 90 |

## Visual Regression Report

_No approved baseline found. Copy reports/design/screenshots/<date> to reports/design/baseline to enable visual regression._

## Detected Issues

### `/waitlist`
- accessibility: 1 violation(s) (0 critical, 0 serious)
  - `heading-order` (moderate, 1 node(s)) — Heading levels should only increase by one

---

### Safe automated fixes
Spacing, responsive breakpoint, typography, and color-token issues flagged above can be partly addressed by `npm run autofix`; accessibility violations from axe-core should be reviewed against the design system before applying.
