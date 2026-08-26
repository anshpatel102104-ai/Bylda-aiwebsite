'use strict';

/**
 * Regenerate sitemap.xml from the pages that actually exist.
 *
 * `lastmod` is derived from git history (the last commit that touched the
 * file), so the dates describe reality instead of whenever the file was last
 * hand-edited. Run `npm run sitemap` after any content change; the daily SEO
 * audit flags drift.
 */

const fs = require('fs');
const path = require('path');
const { getPages } = require('./lib/pages');
const { extractMeta } = require('./lib/html');
const { lastChangedDate, getSitemapLastmods } = require('./lib/sitemap');
const { SITE_ROOT, BASE_URL } = require('./config');

// Crawl priority / expected change rate per URL path. Anything not listed
// falls back to DEFAULT_ENTRY, and unknown pages are reported so the map
// does not silently drift away from the site.
const ENTRIES = {
  '/': { changefreq: 'weekly', priority: '1.0' },
  '/waitlist': { changefreq: 'monthly', priority: '0.9' },
  '/conversation-intelligence': { changefreq: 'monthly', priority: '0.9' },
  '/crm-automation': { changefreq: 'monthly', priority: '0.9' },
  '/how-it-works': { changefreq: 'monthly', priority: '0.9' },
  '/pricing': { changefreq: 'monthly', priority: '0.9' },
  '/product': { changefreq: 'monthly', priority: '0.9' },
  '/ai-sales-agent': { changefreq: 'monthly', priority: '0.8' },
  '/clari-alternative': { changefreq: 'monthly', priority: '0.8' },
  '/gong-alternative': { changefreq: 'monthly', priority: '0.8' },
  '/customers': { changefreq: 'monthly', priority: '0.8' },
  '/integrations': { changefreq: 'monthly', priority: '0.8' },
  '/security': { changefreq: 'monthly', priority: '0.8' },
  '/solutions': { changefreq: 'monthly', priority: '0.8' },
  '/blog': { changefreq: 'weekly', priority: '0.7' },
  '/faq': { changefreq: 'monthly', priority: '0.7' },
  '/about': { changefreq: 'monthly', priority: '0.6' },
  '/contact': { changefreq: 'monthly', priority: '0.6' },
  '/careers': { changefreq: 'monthly', priority: '0.5' },
  '/changelog': { changefreq: 'monthly', priority: '0.5' },
  '/privacy': { changefreq: 'monthly', priority: '0.3' },
  '/sitemap': { changefreq: 'monthly', priority: '0.3' },
  '/terms': { changefreq: 'monthly', priority: '0.3' },
};

const BLOG_ENTRY = { changefreq: 'monthly', priority: '0.7' };
const DEFAULT_ENTRY = { changefreq: 'monthly', priority: '0.5' };

/**
 * Change date for a page. When git cannot tell us (no checkout, or a shallow
 * clone), keep whatever the current sitemap already claims rather than
 * inventing a date — a wrong `lastmod` is a worse signal to crawlers than a
 * slightly old one, and rewriting all 28 of them daily would be pure noise.
 * Only a genuinely new page falls through to file mtime.
 */
function pageDate(filePath, urlPath, existing) {
  return (
    lastChangedDate(filePath) ||
    existing.get(urlPath) ||
    new Date(fs.statSync(filePath).mtime).toISOString().slice(0, 10)
  );
}

function entryFor(urlPath) {
  if (ENTRIES[urlPath]) return ENTRIES[urlPath];
  if (urlPath.startsWith('/blog/')) return BLOG_ENTRY;
  return DEFAULT_ENTRY;
}

function build() {
  const unknown = [];
  const existing = getSitemapLastmods();
  const urls = getPages()
    .filter((page) => {
      const meta = extractMeta(fs.readFileSync(page.filePath, 'utf8'));
      // Never advertise a page we have asked robots not to index.
      return !/noindex/i.test(meta.robots || '');
    })
    .map((page) => {
      if (!ENTRIES[page.urlPath] && !page.urlPath.startsWith('/blog/')) {
        unknown.push(page.urlPath);
      }
      const { changefreq, priority } = entryFor(page.urlPath);
      return {
        loc: BASE_URL + (page.urlPath === '/' ? '/' : page.urlPath),
        lastmod: pageDate(page.filePath, page.urlPath, existing),
        changefreq,
        priority,
      };
    })
    .sort((a, b) => Number(b.priority) - Number(a.priority) || a.loc.localeCompare(b.loc));

  const body = urls
    .map((u) =>
      [
        '  <url>',
        `    <loc>${u.loc}</loc>`,
        `    <lastmod>${u.lastmod}</lastmod>`,
        `    <changefreq>${u.changefreq}</changefreq>`,
        `    <priority>${u.priority}</priority>`,
        '  </url>',
      ].join('\n')
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  return { xml, count: urls.length, unknown };
}

const SITEMAP_PATH = path.join(SITE_ROOT, 'sitemap.xml');

function main() {
  const { xml, count, unknown } = build();
  fs.writeFileSync(SITEMAP_PATH, xml);
  console.log(`sitemap.xml written — ${count} URL(s).`);
  if (unknown.length) {
    console.log(`Using default priority for unmapped page(s): ${unknown.join(', ')}`);
  }
}

if (require.main === module) main();
module.exports = { build, SITEMAP_PATH };
