'use strict';

/**
 * Generate /feed.xml (RSS 2.0) from the BlogPosting JSON-LD already embedded
 * in each post, so the feed cannot drift from the pages it describes.
 * Run `npm run feed` after publishing or editing a post.
 */

const fs = require('fs');
const path = require('path');
const { getPages } = require('./lib/pages');
const { SITE_ROOT, BASE_URL } = require('./config');

const FEED_PATH = '/feed.xml';
const TITLE = 'Bylda Blog';
const DESCRIPTION =
  'Essays on the AI Sales Operating System, CRM automation, conversation intelligence, and why sales admin was never a discipline problem.';

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  }[c]));
}

/** Pull every BlogPosting node out of a page's JSON-LD blocks. */
function blogPostings(html) {
  const out = [];
  const blocks = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  for (const [, raw] of blocks) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue; // the SEO audit reports invalid JSON-LD separately
    }
    const nodes = Array.isArray(parsed) ? parsed : parsed['@graph'] || [parsed];
    for (const n of nodes) if (n && n['@type'] === 'BlogPosting') out.push(n);
  }
  return out;
}

function rfc822(dateStr) {
  // Posts carry a date-only `datePublished`; anchor it at midnight UTC.
  return new Date(`${dateStr}T00:00:00Z`).toUTCString();
}

function build() {
  const items = [];
  for (const page of getPages()) {
    if (!page.urlPath.startsWith('/blog/')) continue;
    const html = fs.readFileSync(page.filePath, 'utf8');
    for (const post of blogPostings(html)) {
      items.push({
        title: post.headline,
        link: post.mainEntityOfPage?.['@id'] || page.url,
        description: post.description,
        date: post.dateModified || post.datePublished,
        published: post.datePublished,
      });
    }
  }
  items.sort((a, b) => b.published.localeCompare(a.published));

  const latest = items.length ? rfc822(items[0].date) : new Date().toUTCString();
  const body = items
    .map((i) =>
      [
        '    <item>',
        `      <title>${escapeXml(i.title)}</title>`,
        `      <link>${escapeXml(i.link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(i.link)}</guid>`,
        `      <description>${escapeXml(i.description)}</description>`,
        `      <pubDate>${rfc822(i.published)}</pubDate>`,
        '    </item>',
      ].join('\n')
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(TITLE)}</title>
    <link>${BASE_URL}/blog</link>
    <description>${escapeXml(DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${latest}</lastBuildDate>
    <atom:link href="${BASE_URL}${FEED_PATH}" rel="self" type="application/rss+xml"/>
${body}
  </channel>
</rss>
`;
}

const FEED_FILE = path.join(SITE_ROOT, 'feed.xml');

function main() {
  const xml = build();
  fs.writeFileSync(FEED_FILE, xml);
  console.log(`feed.xml written — ${(xml.match(/<item>/g) || []).length} item(s).`);
}

if (require.main === module) main();
module.exports = { build, FEED_FILE };
