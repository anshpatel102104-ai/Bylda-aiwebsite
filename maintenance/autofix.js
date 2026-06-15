'use strict';

/**
 * Safe, deterministic SEO/accessibility autofixes applied as surgical
 * string edits (NOT full HTML re-serialization) so hand-authored markup,
 * whitespace, and formatting are preserved.
 *
 * Default fixes (always safe, deterministic):
 *   - Add a correct canonical tag when missing.
 *   - Add `<html lang="en">` when the lang attribute is missing.
 *   - Add the responsive viewport meta tag when missing.
 *
 * Opt-in with `--alt` (heuristic — review before merge):
 *   - Add filename-derived alt text to <img> tags missing alt.
 *
 * Usage:
 *   node autofix.js            # dry run — list what would change
 *   node autofix.js --apply    # write changes to disk
 *   node autofix.js --apply --alt   # also apply heuristic alt text
 */

const fs = require('fs');
const { getPages } = require('./lib/pages');
const { BASE_URL } = require('./config');

const APPLY = process.argv.includes('--apply');
const DO_ALT = process.argv.includes('--alt');

function canonicalFor(urlPath) {
  return BASE_URL + (urlPath === '/' ? '/' : urlPath);
}

function humanizeAlt(src) {
  const base = src.split('/').pop().split('?')[0].replace(/\.[a-z0-9]+$/i, '');
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function fixPage(page) {
  let html = fs.readFileSync(page.filePath, 'utf8');
  const changes = [];

  // 1. <html lang> ---------------------------------------------------------
  if (!/<html[^>]*\slang=/i.test(html)) {
    const updated = html.replace(/<html(\s[^>]*)?>/i, (m, attrs) => `<html lang="en"${attrs || ''}>`);
    if (updated !== html) {
      html = updated;
      changes.push('added <html lang="en">');
    }
  }

  // 2. viewport meta -------------------------------------------------------
  if (!/<meta[^>]+name=["']viewport["']/i.test(html) && /<head[^>]*>/i.test(html)) {
    html = html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">`);
    changes.push('added viewport meta tag');
  }

  // 3. canonical -----------------------------------------------------------
  if (!/<link[^>]+rel=["']canonical["']/i.test(html) && /<\/head>/i.test(html)) {
    const tag = `  <link rel="canonical" href="${canonicalFor(page.urlPath)}">\n`;
    // Prefer to place it right after <title>, else before </head>.
    if (/<\/title>/i.test(html)) {
      html = html.replace(/<\/title>/i, (m) => `${m}\n${tag.trimEnd()}`);
    } else {
      html = html.replace(/<\/head>/i, `${tag}</head>`);
    }
    changes.push(`added canonical ${canonicalFor(page.urlPath)}`);
  }

  // 4. alt text (opt-in) ---------------------------------------------------
  if (DO_ALT) {
    html = html.replace(/<img\b[^>]*>/gi, (tag) => {
      if (/\salt\s*=/i.test(tag)) return tag; // already has alt
      const src = (tag.match(/\ssrc=["']([^"']+)["']/i) || [])[1] || '';
      if (!src || src.startsWith('data:')) return tag;
      const alt = humanizeAlt(src);
      changes.push(`added alt="${alt}" to img ${src}`);
      return tag.replace(/<img\b/i, `<img alt="${alt}"`);
    });
  }

  if (changes.length && APPLY) fs.writeFileSync(page.filePath, html);
  return changes;
}

function main() {
  const pages = getPages();
  let totalChanges = 0;
  let changedPages = 0;

  for (const page of pages) {
    const changes = fixPage(page);
    if (changes.length) {
      changedPages++;
      totalChanges += changes.length;
      console.log(`${page.relPath}`);
      for (const c of changes) console.log(`  - ${c}`);
    }
  }

  console.log('');
  console.log(`${APPLY ? 'Applied' : 'Would apply'} ${totalChanges} fix(es) across ${changedPages} page(s).`);
  if (!APPLY && totalChanges > 0) console.log('Re-run with --apply to write changes.');
  if (!DO_ALT) console.log('Image alt autofix is opt-in: add --alt (heuristic, review before merge).');

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed_pages=${changedPages}\ntotal_changes=${totalChanges}\n`);
  }
}

if (require.main === module) main();
module.exports = { fixPage };
