'use strict';

const fs = require('fs');
const path = require('path');
const { runSeoAudit } = require('./lib/seo');
const { today, timestamp, writeReport, scoreBadge, mdTable } = require('./lib/report');
const { gates, BASE_URL, REPORTS_DIR } = require('./config');

function build() {
  const audit = runSeoAudit();
  const { results, duplicates, score, counts, pages, sitemapCount } = audit;

  const critical = collect(results, 'critical');
  const high = collect(results, 'high');
  const recommend = collect(results, 'recommended');

  const date = today();
  const lines = [];
  lines.push(`# SEO Audit — ${date}`);
  lines.push('');
  lines.push(`> Automated daily SEO audit for [bylda.space](${BASE_URL}). Generated ${timestamp()}.`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(mdTable(
    ['Metric', 'Value'],
    [
      ['SEO Score', `${scoreBadge(score, gates.seo)} (target ≥ ${gates.seo})`],
      ['Pages crawled', String(pages.length)],
      ['URLs in sitemap', String(sitemapCount)],
      ['Critical issues', String(counts.critical)],
      ['High-priority fixes', String(counts.high)],
      ['Recommended improvements', String(counts.recommended)],
      ['Total findings', String(counts.total)],
    ]
  ));
  lines.push('');

  lines.push(section('Critical Issues', critical, 'No critical issues. 🎉'));
  lines.push(section('High Priority Fixes', high, 'No high-priority issues.'));

  // Duplicates get their own focused section.
  lines.push('## Duplicate Metadata');
  lines.push('');
  if (duplicates.titles.length === 0 && duplicates.descriptions.length === 0) {
    lines.push('No duplicate titles or meta descriptions found.');
  } else {
    for (const d of duplicates.titles) {
      lines.push(`- **Duplicate title** "${truncate(d.value, 60)}" → ${d.urls.join(', ')}`);
    }
    for (const d of duplicates.descriptions) {
      lines.push(`- **Duplicate description** "${truncate(d.value, 60)}" → ${d.urls.join(', ')}`);
    }
  }
  lines.push('');

  lines.push(section('Recommended Improvements', recommend, 'No recommendations.', 50));

  // Per-page appendix (only pages with issues).
  lines.push('## Per-Page Findings');
  lines.push('');
  const rows = results
    .filter((r) => r.issues.length > 0)
    .map((r) => [
      r.page.urlPath,
      String(r.issues.filter((i) => i.severity === 'critical').length),
      String(r.issues.filter((i) => i.severity === 'high').length),
      String(r.issues.filter((i) => i.severity === 'recommended').length),
    ]);
  lines.push(mdTable(['Page', 'Critical', 'High', 'Recommended'], rows));
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('### Safe automated fixes available');
  lines.push('');
  lines.push('Run `npm run autofix` (dry run) or `npm run autofix:apply` to apply safe fixes:');
  lines.push('decorative image alt text, missing canonical tags, `<html lang>`, and viewport meta tags.');
  lines.push('');

  const md = lines.join('\n');

  // Machine-readable findings for the GitHub Actions issue/PR steps.
  const machineFindings = {
    date,
    score,
    gate: gates.seo,
    passing: score >= gates.seo && counts.critical === 0,
    counts,
    critical,
    high: high.slice(0, 50),
  };

  return { audit, md, machineFindings };
}

function collect(results, severity) {
  const out = [];
  for (const r of results) {
    for (const i of r.issues) {
      if (i.severity === severity) out.push({ page: r.page.urlPath, code: i.code, message: i.message });
    }
  }
  return out;
}

function section(heading, items, emptyMsg, limit = 200) {
  const out = [`## ${heading}`, ''];
  if (items.length === 0) {
    out.push(emptyMsg);
  } else {
    for (const i of items.slice(0, limit)) out.push(`- \`${i.page}\` — ${i.message}`);
    if (items.length > limit) out.push(`- …and ${items.length - limit} more`);
  }
  out.push('');
  return out.join('\n');
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function main() {
  const { md, machineFindings } = build();
  const file = writeReport('seo', `${today()}.md`, md);
  fs.writeFileSync(path.join(REPORTS_DIR, 'seo', 'latest.json'), JSON.stringify(machineFindings, null, 2));

  console.log(`SEO audit complete → ${path.relative(process.cwd(), file)}`);
  console.log(`Score: ${machineFindings.score}/100 (gate ${machineFindings.gate})`);
  console.log(`Critical: ${machineFindings.counts.critical} | High: ${machineFindings.counts.high} | Recommended: ${machineFindings.counts.recommended}`);

  // Surface a summary in the GitHub Actions run if available.
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### SEO Audit ${today()}\n\nScore: **${machineFindings.score}/100** — Critical ${machineFindings.counts.critical}, High ${machineFindings.counts.high}\n`);
  }
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `score=${machineFindings.score}\ncritical=${machineFindings.counts.critical}\npassing=${machineFindings.passing}\n`);
  }
}

if (require.main === module) main();
module.exports = { build };
