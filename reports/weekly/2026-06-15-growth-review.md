# Weekly Growth Optimization Review — 2026-06-15

> Strategic review of [usebylda.com](https://usebylda.com). Generated 2026-06-15T21:35:40.840Z (template — no API key).
> Current SEO score: 47/100 · 114 pages.
## Conversion Improvements

- **Hero:** The current H1 is "Start with structure.
        Scale with
        intelligence.". Lead with a quantified outcome (e.g. "Book 30% more jobs without hiring") and a single primary CTA above the fold.
- **CTAs:** Standardize one primary CTA ("Get a Free Audit") site-wide; reduce competing buttons in the nav and hero.
- **Trust signals:** Add logos, named testimonials with photos, and concrete result numbers near every CTA.
- **Copy:** Replace feature-led copy with outcome-led copy; add a 3-step "How it works" with proof.

## Design Improvements

- Tighten vertical rhythm and spacing tokens for consistency across landing pages.
- Establish a single type scale and color-token set (reduce the number of CSS files currently in use).
- Add subtle motion/micro-interactions on CTAs and cards; ensure reduced-motion support.
- Audit dark/light contrast for WCAG AA.

## SEO Growth Opportunities

- **Broken internal links** are the top issue right now (31 critical findings) — fix the dead `/partners`, `/case-studies/*`, and missing blog links.
- **Content gaps / new pages to create:** `/pricing-vs-competitors`, `/roi-calculator`, `/case-studies (expand)`, `/ai-for-hvac`, `/ai-for-plumbers`, `/partners`.
- **Keyword opportunities:** target "AI receptionist for [industry]", "missed call text back", "AI appointment setting" long-tail terms — several blog posts already exist; interlink them.
- **Internal linking:** add contextual links between industry pages and matching case studies and blog posts.

## AI Startup Website Benchmark

### Competitive Scorecard

| Dimension | Bylda (1-10) | Note |
| --- | --- | --- |
| Visual polish | 6 | Strong animation, but inconsistent spacing/typography across pages |
| Messaging clarity | 6 | Outcome messaging exists but competes with feature copy |
| Social proof | 5 | Testimonials present; add named, verifiable results |
| Information architecture | 5 | Many pages; several broken links and orphan routes |
| Performance | 6 | Large JS bundles (three.min.js, gsap) should be deferred/code-split |
| Conversion design | 6 | CTAs present but not consistently prioritized |

_Benchmarked against Omni.co, Linear, Vercel, Notion, Stripe, Retool._

### Missing Features

- Transparent, interactive pricing (cf. Vercel/Linear).
- A polished changelog/product timeline (cf. Linear).
- Customer logo wall + quantified case studies (cf. Stripe/Retool).
- Fast, minimal hero with one clear CTA (cf. Linear/Vercel).

### Design Recommendations

- Consolidate CSS into one design-system token file.
- Defer heavy 3D/animation libraries; lazy-load below-the-fold.
- Adopt a consistent 8px spacing grid and a single type scale.

> ℹ️ This template was generated without the Claude API (no `ANTHROPIC_API_KEY`). Set the secret to get a full AI-authored strategic review.

