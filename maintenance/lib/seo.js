'use strict';

const fs = require('fs');
const { seo: T, BASE_URL } = require('../config');
const { getPages } = require('./pages');
const { extractMeta } = require('./html');
const { analyzeLinks } = require('./links');
const { getSitemapPaths, getRobotsBlocker } = require('./sitemap');

// Severity buckets used across the report and issue creation.
const SEVERITY = { CRITICAL: 'critical', HIGH: 'high', RECOMMEND: 'recommended' };

/**
 * Crawl every local HTML page and produce a complete SEO audit:
 *   { pages, findings, duplicates, score, counts }
 */
function runSeoAudit() {
  const pages = getPages();
  const sitemap = getSitemapPaths();
  const isBlocked = getRobotsBlocker();

  const titleMap = new Map();
  const descMap = new Map();
  const results = [];

  for (const page of pages) {
    const html = fs.readFileSync(page.filePath, 'utf8');
    const meta = extractMeta(html);
    const { external, broken } = analyzeLinks(meta.links, page.relPath);
    const issues = [];
    const add = (severity, code, message) => issues.push({ severity, code, message });

    // --- Titles ---
    if (!meta.title) add(SEVERITY.CRITICAL, 'title-missing', 'Missing <title> tag');
    else {
      if (meta.title.length < T.titleMin) add(SEVERITY.RECOMMEND, 'title-short', `Title is short (${meta.title.length} chars)`);
      if (meta.title.length > T.titleMax) add(SEVERITY.RECOMMEND, 'title-long', `Title is long (${meta.title.length} chars, recommend ≤ ${T.titleMax})`);
      const key = meta.title.toLowerCase();
      titleMap.set(key, [...(titleMap.get(key) || []), page.urlPath]);
    }

    // --- Meta description ---
    if (!meta.metaDescription) add(SEVERITY.HIGH, 'desc-missing', 'Missing meta description');
    else {
      if (meta.metaDescription.length < T.descMin) add(SEVERITY.RECOMMEND, 'desc-short', `Meta description is short (${meta.metaDescription.length} chars)`);
      if (meta.metaDescription.length > T.descMax) add(SEVERITY.RECOMMEND, 'desc-long', `Meta description is long (${meta.metaDescription.length} chars)`);
      const key = meta.metaDescription.toLowerCase();
      descMap.set(key, [...(descMap.get(key) || []), page.urlPath]);
    }

    // --- Headings ---
    if (meta.h1s.length === 0) add(SEVERITY.HIGH, 'h1-missing', 'Missing <h1> tag');
    else if (meta.h1s.length > 1) add(SEVERITY.HIGH, 'h1-multiple', `Multiple <h1> tags (${meta.h1s.length})`);

    // --- Canonical ---
    if (!meta.canonical) add(SEVERITY.HIGH, 'canonical-missing', 'Missing canonical tag');

    // --- Images ---
    if (meta.imagesMissingAlt > 0) {
      add(SEVERITY.HIGH, 'img-alt-missing', `${meta.imagesMissingAlt} image(s) missing alt text`);
    }

    // --- Mobile / viewport ---
    if (!meta.viewport) add(SEVERITY.HIGH, 'viewport-missing', 'Missing responsive viewport meta tag');

    // --- Language ---
    if (!meta.lang) add(SEVERITY.RECOMMEND, 'lang-missing', 'Missing <html lang> attribute');

    // --- Open Graph / Twitter ---
    if (!meta.og.title || !meta.og.image) add(SEVERITY.RECOMMEND, 'og-incomplete', 'Incomplete Open Graph tags (title/image)');
    if (!meta.twitter.card) add(SEVERITY.RECOMMEND, 'twitter-missing', 'Missing Twitter card tag');

    // --- Structured data ---
    if (meta.jsonLdErrors.length > 0) add(SEVERITY.HIGH, 'schema-invalid', `${meta.jsonLdErrors.length} invalid JSON-LD block(s)`);
    if (meta.jsonLdCount === 0) add(SEVERITY.RECOMMEND, 'schema-missing', 'No structured data (JSON-LD) found');

    // --- Broken internal links ---
    if (broken.length > 0) add(SEVERITY.CRITICAL, 'links-broken', `${broken.length} broken internal link(s): ${broken.slice(0, 5).join(', ')}`);

    // --- Sitemap coverage ---
    const inSitemap = sitemap.has(page.urlPath);
    const indexable = !/noindex/i.test(meta.robots);
    if (indexable && !inSitemap) add(SEVERITY.RECOMMEND, 'sitemap-missing', 'Indexable page not listed in sitemap.xml');

    // --- robots.txt blocking ---
    if (indexable && isBlocked(page.urlPath)) add(SEVERITY.HIGH, 'robots-blocked', 'Page is blocked by robots.txt but appears intended for indexing');

    // --- Thin content ---
    if (meta.wordCount < T.thinContentWords) add(SEVERITY.RECOMMEND, 'thin-content', `Thin content (${meta.wordCount} words)`);

    results.push({ page, meta, issues, brokenLinks: broken, externalLinks: external, inSitemap });
  }

  // Cross-page duplicate detection.
  const duplicates = { titles: [], descriptions: [] };
  for (const [val, urls] of titleMap) {
    if (urls.length > 1) duplicates.titles.push({ value: val, urls });
  }
  for (const [val, urls] of descMap) {
    if (urls.length > 1) duplicates.descriptions.push({ value: val, urls });
  }
  // Attach duplicate issues back onto affected pages.
  for (const r of results) {
    const t = (r.meta.title || '').toLowerCase();
    const d = (r.meta.metaDescription || '').toLowerCase();
    if (duplicates.titles.some((x) => x.value === t)) r.issues.push({ severity: SEVERITY.HIGH, code: 'title-duplicate', message: 'Duplicate title shared with other pages' });
    if (d && duplicates.descriptions.some((x) => x.value === d)) r.issues.push({ severity: SEVERITY.HIGH, code: 'desc-duplicate', message: 'Duplicate meta description shared with other pages' });
  }

  const counts = countBySeverity(results);
  const score = computeScore(results, pages.length);

  return { pages, results, duplicates, score, counts, sitemapCount: sitemap.size };
}

function countBySeverity(results) {
  const c = { critical: 0, high: 0, recommended: 0, total: 0 };
  for (const r of results) {
    for (const i of r.issues) {
      c[i.severity] = (c[i.severity] || 0) + 1;
      c.total++;
    }
  }
  return c;
}

/** Weighted score: critical issues hurt most, recommendations least. */
function computeScore(results, pageCount) {
  const weights = { critical: 6, high: 2.5, recommended: 0.6 };
  let penalty = 0;
  for (const r of results) {
    for (const i of r.issues) penalty += weights[i.severity] || 0;
  }
  // Normalize against page count so a large site isn't unfairly punished.
  const normalized = penalty / Math.max(pageCount, 1);
  const score = Math.max(0, Math.min(100, Math.round(100 - normalized * 12)));
  return score;
}

module.exports = { runSeoAudit, SEVERITY };
