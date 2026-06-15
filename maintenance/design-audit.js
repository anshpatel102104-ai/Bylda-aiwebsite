'use strict';

/**
 * Daily Design & UI audit.
 *
 * For every page, at desktop / tablet / mobile viewports:
 *   - capture a full-page screenshot
 *   - detect horizontal overflow, missing/broken images, console & page errors
 *   - run axe-core accessibility checks (if @axe-core/playwright is installed)
 *   - measure a lightweight performance proxy from navigation + resource timing
 *
 * Produces a Visual Regression Report (vs. an approved baseline, if present),
 * a UI Quality Score, an Accessibility Score, and a Performance Score, plus a
 * markdown report at reports/design/<date>.md.
 *
 * Playwright is required; axe-core and Lighthouse are optional and the audit
 * degrades gracefully without them.
 */

const fs = require('fs');
const path = require('path');
const { optionalRequire } = require('./lib/optional');
const { startServer } = require('./lib/server');
const { getPages } = require('./lib/pages');
const { VIEWPORTS, gates, REPORTS_DIR } = require('./config');
const { today, timestamp, writeReport, scoreBadge, mdTable } = require('./lib/report');

const MAX_PAGES = process.env.MAX_PAGES ? parseInt(process.env.MAX_PAGES, 10) : Infinity;

async function run() {
  const playwright = optionalRequire('playwright');
  if (!playwright) {
    console.error('Playwright is required for the design audit. Install with `npm install` or provide it globally.');
    process.exit(1);
  }
  let AxeBuilder = optionalRequire('@axe-core/playwright');
  if (AxeBuilder && AxeBuilder.default) AxeBuilder = AxeBuilder.default;

  const date = today();
  const shotDir = path.join(REPORTS_DIR, 'design', 'screenshots', date);
  const baselineDir = path.join(REPORTS_DIR, 'design', 'baseline');
  fs.mkdirSync(shotDir, { recursive: true });

  const { server, origin } = await startServer();
  const browser = await playwright.chromium.launch({ args: ['--no-sandbox'] });

  const pages = getPages().slice(0, MAX_PAGES);
  const pageReports = [];
  let axeRan = false;

  for (const page of pages) {
    const url = origin + (page.urlPath === '/' ? '/' : page.urlPath);
    const pr = { page: page.urlPath, slug: slugify(page.urlPath), issues: [], viewports: {}, a11y: null };

    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const p = await context.newPage();
      const consoleErrors = [];
      // Ignore certificate-store noise from the local/CI environment (e.g.
      // Google Fonts over a sandbox without a full CA bundle) — not a site bug.
      const isEnvNoise = (t) => /ERR_CERT_|ERR_SSL_|net::ERR_CERT/i.test(t);
      p.on('console', (m) => { if (m.type() === 'error' && !isEnvNoise(m.text())) consoleErrors.push(m.text().slice(0, 200)); });
      p.on('pageerror', (e) => { const t = String(e); if (!isEnvNoise(t)) consoleErrors.push(`pageerror: ${t.slice(0, 200)}`); });

      let metrics = {};
      try {
        await p.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await p.waitForTimeout(600);
        metrics = await p.evaluate(() => {
          const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
          const imgs = [...document.images];
          const brokenImages = imgs.filter((i) => i.currentSrc && (!i.complete || i.naturalWidth === 0)).length;
          const nav = performance.getEntriesByType('navigation')[0] || {};
          const resources = performance.getEntriesByType('resource');
          const transferred = resources.reduce((s, r) => s + (r.transferSize || 0), 0);
          return {
            overflow: overflow > 2 ? overflow : 0,
            brokenImages,
            domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
            loadComplete: Math.round(nav.loadEventEnd || 0),
            transferredKB: Math.round(transferred / 1024),
            resourceCount: resources.length,
          };
        });

        const shot = path.join(shotDir, `${pr.slug}-${vp.name}.png`);
        await p.screenshot({ path: shot, fullPage: true });
        pr.viewports[vp.name] = { ...metrics, consoleErrors, screenshot: path.relative(REPORTS_DIR, shot) };

        if (metrics.overflow) pr.issues.push(`${vp.name}: horizontal overflow (${metrics.overflow}px)`);
        if (metrics.brokenImages) pr.issues.push(`${vp.name}: ${metrics.brokenImages} broken image(s)`);
        if (consoleErrors.length) pr.issues.push(`${vp.name}: ${consoleErrors.length} console error(s)`);

        // Accessibility once per page (desktop).
        if (vp.name === 'desktop' && AxeBuilder) {
          try {
            const results = await new AxeBuilder({ page: p }).analyze();
            axeRan = true;
            pr.a11y = {
              violations: results.violations.length,
              critical: results.violations.filter((v) => v.impact === 'critical').length,
              serious: results.violations.filter((v) => v.impact === 'serious').length,
              top: results.violations.slice(0, 8).map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })),
            };
          } catch (e) {
            pr.issues.push(`axe failed: ${e.message}`);
          }
        }
      } catch (e) {
        pr.issues.push(`${vp.name}: load failed — ${e.message.slice(0, 120)}`);
      }
      await context.close();
    }

    pageReports.push(pr);
    process.stdout.write(`  ${page.urlPath} — ${pr.issues.length ? '⚠ ' + pr.issues.length + ' issue(s)' : 'OK'}\n`);
  }

  await browser.close();
  server.close();

  // Visual regression vs baseline.
  const regression = compareBaseline(pageReports, shotDir, baselineDir);

  const scores = computeScores(pageReports, axeRan);
  const md = renderReport({ date, pageReports, scores, regression, axeRan, baselineExists: fs.existsSync(baselineDir) });
  const file = writeReport('design', `${date}.md`, md);
  fs.writeFileSync(path.join(REPORTS_DIR, 'design', 'latest.json'), JSON.stringify({ date, scores, regression, pageReports }, null, 2));

  console.log(`\nDesign audit complete → ${path.relative(process.cwd(), file)}`);
  console.log(`UI ${scores.ui} | Accessibility ${scores.accessibility ?? 'n/a'} | Performance ${scores.performance}`);

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `ui=${scores.ui}\naccessibility=${scores.accessibility ?? 'na'}\nperformance=${scores.performance}\nregressions=${regression.changed.length}\n`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Design Audit ${date}\n\nUI **${scores.ui}** · A11y **${scores.accessibility ?? 'n/a'}** · Perf **${scores.performance}** · Visual regressions **${regression.changed.length}**\n`);
  }
}

function slugify(urlPath) {
  return urlPath === '/' ? 'home' : urlPath.replace(/^\//, '').replace(/\//g, '_');
}

function compareBaseline(pageReports, shotDir, baselineDir) {
  const changed = [];
  const added = [];
  if (!fs.existsSync(baselineDir)) {
    return { changed, added, note: 'No approved baseline found. Copy reports/design/screenshots/<date> to reports/design/baseline to enable visual regression.' };
  }
  for (const pr of pageReports) {
    for (const vp of VIEWPORTS) {
      const name = `${pr.slug}-${vp.name}.png`;
      const cur = path.join(shotDir, name);
      const base = path.join(baselineDir, name);
      if (!fs.existsSync(cur)) continue;
      if (!fs.existsSync(base)) { added.push(name); continue; }
      // Lightweight heuristic: byte-size delta. (Pixel-diff needs pixelmatch.)
      const a = fs.statSync(cur).size;
      const b = fs.statSync(base).size;
      const delta = Math.abs(a - b) / Math.max(b, 1);
      if (delta > 0.05) changed.push({ name, deltaPct: Math.round(delta * 100) });
    }
  }
  return { changed, added, note: null };
}

function computeScores(pageReports, axeRan) {
  // UI quality: penalize overflow, broken images, console errors.
  let uiPenalty = 0;
  let perfPenalty = 0;
  let a11yViolations = 0;
  let pagesWithA11y = 0;

  for (const pr of pageReports) {
    for (const vp of Object.values(pr.viewports)) {
      if (vp.overflow) uiPenalty += 3;
      if (vp.brokenImages) uiPenalty += 4 * vp.brokenImages;
      if (vp.consoleErrors) uiPenalty += 1.5 * vp.consoleErrors.length;
      if (vp.loadComplete > 4000) perfPenalty += 3;
      else if (vp.loadComplete > 2500) perfPenalty += 1.5;
      if (vp.transferredKB > 3000) perfPenalty += 3;
      else if (vp.transferredKB > 1500) perfPenalty += 1.5;
    }
    if (pr.a11y) {
      pagesWithA11y++;
      a11yViolations += pr.a11y.critical * 4 + pr.a11y.serious * 2 + Math.max(0, pr.a11y.violations - pr.a11y.critical - pr.a11y.serious);
    }
  }

  const n = Math.max(pageReports.length, 1);
  const ui = clamp(100 - Math.round((uiPenalty / n) * 8));
  const performance = clamp(100 - Math.round((perfPenalty / n) * 6));
  const accessibility = axeRan && pagesWithA11y > 0 ? clamp(100 - Math.round((a11yViolations / pagesWithA11y) * 5)) : null;
  return { ui, performance, accessibility };
}

function clamp(n) {
  return Math.max(0, Math.min(100, n));
}

function renderReport({ date, pageReports, scores, regression, axeRan, baselineExists }) {
  const lines = [];
  lines.push(`# Design & UI Audit — ${date}`);
  lines.push('');
  lines.push(`> Automated daily design/UI audit. Generated ${timestamp()}. Screenshots: \`reports/design/screenshots/${date}/\`.`);
  lines.push('');
  lines.push('## Scores');
  lines.push('');
  lines.push(mdTable(['Metric', 'Score', 'Target'], [
    ['UI Quality', scoreBadge(scores.ui, gates.design), `≥ ${gates.design}`],
    ['Accessibility', scores.accessibility == null ? 'n/a (axe-core not installed)' : scoreBadge(scores.accessibility, gates.accessibility), `≥ ${gates.accessibility}`],
    ['Performance', scoreBadge(scores.performance, gates.performance), `≥ ${gates.performance}`],
  ]));
  lines.push('');

  lines.push('## Visual Regression Report');
  lines.push('');
  if (regression.note) lines.push(`_${regression.note}_`);
  else {
    lines.push(`- Changed screenshots (>5% size delta): **${regression.changed.length}**`);
    lines.push(`- New screenshots (no baseline): **${regression.added.length}**`);
    if (regression.changed.length) {
      lines.push('');
      for (const c of regression.changed.slice(0, 30)) lines.push(`  - \`${c.name}\` — ~${c.deltaPct}% size change`);
    }
  }
  lines.push('');

  if (!axeRan) {
    lines.push('> ℹ️ Accessibility scoring requires `@axe-core/playwright`. Install it (declared in package.json) to enable axe-core checks and the Accessibility Score.');
    lines.push('');
  }

  // Issues table.
  const withIssues = pageReports.filter((p) => p.issues.length || (p.a11y && p.a11y.violations));
  lines.push('## Detected Issues');
  lines.push('');
  if (withIssues.length === 0) {
    lines.push('No layout, image, console, or accessibility issues detected. 🎉');
  } else {
    for (const pr of withIssues) {
      lines.push(`### \`${pr.page}\``);
      for (const i of pr.issues) lines.push(`- ${i}`);
      if (pr.a11y && pr.a11y.violations) {
        lines.push(`- accessibility: ${pr.a11y.violations} violation(s) (${pr.a11y.critical} critical, ${pr.a11y.serious} serious)`);
        for (const v of pr.a11y.top) lines.push(`  - \`${v.id}\` (${v.impact}, ${v.nodes} node(s)) — ${v.help}`);
      }
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');
  lines.push('### Safe automated fixes');
  lines.push('Spacing, responsive breakpoint, typography, and color-token issues flagged above can be partly addressed by `npm run autofix`; accessibility violations from axe-core should be reviewed against the design system before applying.');
  lines.push('');
  return lines.join('\n');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
