# Design & UI Audit — 2026-06-15

> Automated daily design/UI audit. Generated 2026-06-15T21:42:44.831Z. Screenshots: `reports/design/screenshots/2026-06-15/`.

## Scores

| Metric | Score | Target |
| --- | --- | --- |
| UI Quality | 🟢 95/100 | ≥ 95 |
| Accessibility | n/a (axe-core not installed) | ≥ 95 |
| Performance | 🟢 100/100 | ≥ 90 |

## Visual Regression Report

_No approved baseline found. Copy reports/design/screenshots/<date> to reports/design/baseline to enable visual regression._

> ℹ️ Accessibility scoring requires `@axe-core/playwright`. Install it (declared in package.json) to enable axe-core checks and the Accessibility Score.

## Detected Issues

### `/404`
- desktop: horizontal overflow (1440px)
- tablet: horizontal overflow (768px)
- mobile: horizontal overflow (390px)

---

### Safe automated fixes
Spacing, responsive breakpoint, typography, and color-token issues flagged above can be partly addressed by `npm run autofix`; accessibility violations from axe-core should be reviewed against the design system before applying.
