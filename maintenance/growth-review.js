'use strict';

/**
 * Weekly Growth Optimization Review (runs Sundays via GitHub Actions).
 *
 * Analyzes the site like a world-class product designer, SEO strategist, and
 * startup growth consultant, and benchmarks Nova Ops against leading AI/SaaS
 * sites. Uses Claude (claude-opus-4-8) when ANTHROPIC_API_KEY is set; otherwise
 * emits a structured template seeded with real site data so the report is still
 * useful and the workflow still succeeds.
 *
 * Output: reports/weekly/<date>-growth-review.md
 */

const fs = require('fs');
const path = require('path');
const ai = require('./lib/ai');
const { getPages } = require('./lib/pages');
const { runSeoAudit } = require('./lib/seo');
const { extractMeta } = require('./lib/html');
const { today, timestamp, writeReport } = require('./lib/report');
const { competitors, BASE_URL, SITE_ROOT } = require('./config');

function gatherContext() {
  const pages = getPages();
  const seo = runSeoAudit();

  // Pull the homepage hero/headline copy for conversion analysis.
  let homeMeta = {};
  try {
    homeMeta = extractMeta(fs.readFileSync(path.join(SITE_ROOT, 'index.html'), 'utf8'));
  } catch (_) {}

  const inventory = pages.map((p) => p.urlPath);
  return {
    pageCount: pages.length,
    inventory,
    seoScore: seo.score,
    seoCounts: seo.counts,
    homeTitle: (homeMeta.title || '').replace(/\s+/g, ' ').trim(),
    homeH1: ((homeMeta.h1s || [])[0] || '').replace(/\s+/g, ' ').trim(),
    homeDescription: (homeMeta.metaDescription || '').replace(/\s+/g, ' ').trim(),
  };
}

function buildPrompt(ctx) {
  return `You are reviewing the website ${BASE_URL} ("Nova Ops" / "NovaOps AI"), an AI automation company that sells AI lead-generation, appointment-setting, and follow-up automation to local service businesses and founders.

Here is current site data:
- Pages (${ctx.pageCount}): ${ctx.inventory.join(', ')}
- Current automated SEO score: ${ctx.seoScore}/100 (critical ${ctx.seoCounts.critical}, high ${ctx.seoCounts.high}, recommended ${ctx.seoCounts.recommended})
- Homepage title: "${ctx.homeTitle}"
- Homepage H1: "${ctx.homeH1}"
- Homepage meta description: "${ctx.homeDescription}"

Produce a concise, actionable Weekly Growth Optimization Review in GitHub-flavored markdown with EXACTLY these sections and headings:

## Conversion Improvements
(Hero section, CTAs, landing pages, trust signals, copy — concrete and specific.)

## Design Improvements
(Modernization, UX friction, visual hierarchy, competitor-inspired opportunities.)

## SEO Growth Opportunities
(Content gaps, new pages to create with proposed slugs, keyword opportunities, internal linking opportunities — use the page inventory above.)

## AI Startup Website Benchmark
Benchmark Nova Ops against ${competitors.join(', ')}. Include:
- A "Competitive Scorecard" markdown table scoring Nova Ops 1-10 on: Visual polish, Messaging clarity, Social proof, Information architecture, Performance, and Conversion design — with a one-line note per row.
- A "Missing Features" list of things competitors have that Nova Ops lacks.
- A short "Design Recommendations" list.

Lead with the highest-leverage recommendations. Be specific to this business; avoid generic advice. Do not include a preamble — start directly with the first heading.`;
}

function templateReport(ctx) {
  // Used when no API key is available — seeded with real data so it's still useful.
  const newPages = ['/pricing-vs-competitors', '/roi-calculator', '/case-studies (expand)', '/ai-for-hvac', '/ai-for-plumbers', '/partners'];
  return [
    '## Conversion Improvements',
    '',
    `- **Hero:** The current H1 is "${ctx.homeH1 || '(none found)'}". Lead with a quantified outcome (e.g. "Book 30% more jobs without hiring") and a single primary CTA above the fold.`,
    '- **CTAs:** Standardize one primary CTA ("Get a Free Audit") site-wide; reduce competing buttons in the nav and hero.',
    '- **Trust signals:** Add logos, named testimonials with photos, and concrete result numbers near every CTA.',
    '- **Copy:** Replace feature-led copy with outcome-led copy; add a 3-step "How it works" with proof.',
    '',
    '## Design Improvements',
    '',
    '- Tighten vertical rhythm and spacing tokens for consistency across landing pages.',
    '- Establish a single type scale and color-token set (reduce the number of CSS files currently in use).',
    '- Add subtle motion/micro-interactions on CTAs and cards; ensure reduced-motion support.',
    '- Audit dark/light contrast for WCAG AA.',
    '',
    '## SEO Growth Opportunities',
    '',
    `- **Broken internal links** are the top issue right now (${ctx.seoCounts.critical} critical findings) — fix the dead \`/partners\`, \`/case-studies/*\`, and missing blog links.`,
    `- **Content gaps / new pages to create:** ${newPages.map((p) => `\`${p}\``).join(', ')}.`,
    '- **Keyword opportunities:** target "AI receptionist for [industry]", "missed call text back", "AI appointment setting" long-tail terms — several blog posts already exist; interlink them.',
    '- **Internal linking:** add contextual links between industry pages and matching case studies and blog posts.',
    '',
    '## AI Startup Website Benchmark',
    '',
    '### Competitive Scorecard',
    '',
    '| Dimension | Nova Ops (1-10) | Note |',
    '| --- | --- | --- |',
    '| Visual polish | 6 | Strong animation, but inconsistent spacing/typography across pages |',
    '| Messaging clarity | 6 | Outcome messaging exists but competes with feature copy |',
    '| Social proof | 5 | Testimonials present; add named, verifiable results |',
    '| Information architecture | 5 | Many pages; several broken links and orphan routes |',
    '| Performance | 6 | Large JS bundles (three.min.js, gsap) should be deferred/code-split |',
    '| Conversion design | 6 | CTAs present but not consistently prioritized |',
    '',
    `_Benchmarked against ${competitors.join(', ')}._`,
    '',
    '### Missing Features',
    '',
    '- Transparent, interactive pricing (cf. Vercel/Linear).',
    '- A polished changelog/product timeline (cf. Linear).',
    '- Customer logo wall + quantified case studies (cf. Stripe/Retool).',
    '- Fast, minimal hero with one clear CTA (cf. Linear/Vercel).',
    '',
    '### Design Recommendations',
    '',
    '- Consolidate CSS into one design-system token file.',
    '- Defer heavy 3D/animation libraries; lazy-load below-the-fold.',
    '- Adopt a consistent 8px spacing grid and a single type scale.',
    '',
    '> ℹ️ This template was generated without the Claude API (no `ANTHROPIC_API_KEY`). Set the secret to get a full AI-authored strategic review.',
    '',
  ].join('\n');
}

async function run() {
  const ctx = gatherContext();
  const date = today();

  let body = null;
  if (ai.isAvailable()) {
    console.log(`Requesting growth review from ${ai.model}…`);
    body = await ai.analyze({
      system: 'You are a world-class product designer, SEO strategist, and startup growth consultant. You give specific, prioritized, actionable advice for B2B SaaS websites.',
      prompt: buildPrompt(ctx),
    });
  }
  const usedAI = Boolean(body);
  if (!body) body = templateReport(ctx);

  const header = [
    `# Weekly Growth Optimization Review — ${date}`,
    '',
    `> Strategic review of [nova-ops.space](${BASE_URL}). Generated ${timestamp()} ${usedAI ? `by ${ai.model}` : '(template — no API key)'}.`,
    `> Current SEO score: ${ctx.seoScore}/100 · ${ctx.pageCount} pages.`,
    '',
  ].join('\n');

  const md = header + body + '\n';
  const file = writeReport('weekly', `${date}-growth-review.md`, md);
  console.log(`Growth review complete → ${path.relative(process.cwd(), file)}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Weekly Growth Review ${date}\n\n${usedAI ? 'AI-authored' : 'Template'} review generated. SEO score ${ctx.seoScore}/100.\n`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
