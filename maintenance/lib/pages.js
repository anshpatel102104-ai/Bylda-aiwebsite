'use strict';

const fs = require('fs');
const path = require('path');
const { SITE_ROOT, BASE_URL, IGNORE_DIRS } = require('../config');

/**
 * Recursively collect every `.html` file under SITE_ROOT, skipping the
 * directories listed in IGNORE_DIRS.
 */
function listHtmlFiles(dir = SITE_ROOT, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.git')) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(SITE_ROOT, full);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.includes(entry.name)) continue;
      listHtmlFiles(full, acc);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      acc.push({ filePath: full, relPath: rel.split(path.sep).join('/') });
    }
  }
  return acc;
}

/**
 * Map a repo-relative HTML path to its canonical clean URL path.
 *   index.html          -> /
 *   about.html          -> /about
 *   blog/index.html     -> /blog
 *   blog/post.html      -> /blog/post
 */
function relPathToUrlPath(relPath) {
  let p = relPath.replace(/\.html$/, '');
  p = p.replace(/(^|\/)index$/, '$1'); // drop trailing "index"
  if (p === '' || p === '/') return '/';
  if (!p.startsWith('/')) p = '/' + p;
  return p.replace(/\/$/, '') || '/';
}

/** Build the full page model used by the audits. */
function getPages() {
  return listHtmlFiles()
    .map((f) => {
      const urlPath = relPathToUrlPath(f.relPath);
      return {
        ...f,
        urlPath,
        url: BASE_URL + (urlPath === '/' ? '/' : urlPath),
      };
    })
    .sort((a, b) => a.relPath.localeCompare(b.relPath));
}

module.exports = { getPages, listHtmlFiles, relPathToUrlPath };
