'use strict';

const fs = require('fs');
const path = require('path');
const { SITE_ROOT, BASE_URL } = require('../config');

/** Parse sitemap.xml into a normalized set of URL paths. */
function getSitemapPaths() {
  const set = new Set();
  try {
    const xml = fs.readFileSync(path.join(SITE_ROOT, 'sitemap.xml'), 'utf8');
    const re = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
    let m;
    while ((m = re.exec(xml))) {
      let loc = m[1].trim();
      if (loc.startsWith(BASE_URL)) loc = loc.slice(BASE_URL.length);
      loc = loc.replace(/\/$/, '') || '/';
      set.add(loc);
    }
  } catch (_) {
    /* no sitemap */
  }
  return set;
}

/**
 * Parse robots.txt Disallow rules that apply to all user agents (`*`).
 * Returns a function that tests whether a path is blocked.
 */
function getRobotsBlocker() {
  let disallow = [];
  try {
    const txt = fs.readFileSync(path.join(SITE_ROOT, 'robots.txt'), 'utf8');
    const lines = txt.split('\n').map((l) => l.trim());
    let applies = false;
    for (const line of lines) {
      const ua = /^user-agent:\s*(.+)$/i.exec(line);
      if (ua) {
        applies = ua[1].trim() === '*';
        continue;
      }
      if (!applies) continue;
      const dis = /^disallow:\s*(.*)$/i.exec(line);
      if (dis && dis[1].trim()) disallow.push(dis[1].trim());
    }
  } catch (_) {
    /* no robots.txt */
  }
  return (urlPath) => disallow.some((rule) => urlPath.startsWith(rule));
}

module.exports = { getSitemapPaths, getRobotsBlocker };
