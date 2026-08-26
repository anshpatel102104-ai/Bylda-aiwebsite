'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
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

/** Parse sitemap.xml into a map of URL path -> declared <lastmod>. */
function getSitemapLastmods() {
  const map = new Map();
  try {
    const xml = fs.readFileSync(path.join(SITE_ROOT, 'sitemap.xml'), 'utf8');
    const re = /<url>([\s\S]*?)<\/url>/gi;
    let m;
    while ((m = re.exec(xml))) {
      const loc = /<loc>\s*([^<]+?)\s*<\/loc>/i.exec(m[1]);
      const mod = /<lastmod>\s*([^<]+?)\s*<\/lastmod>/i.exec(m[1]);
      if (!loc) continue;
      let p = loc[1].trim();
      if (p.startsWith(BASE_URL)) p = p.slice(BASE_URL.length);
      p = p.replace(/\/$/, '') || '/';
      map.set(p, mod ? mod[1].trim().slice(0, 10) : null);
    }
  } catch (_) {
    /* no sitemap */
  }
  return map;
}

function git(args) {
  try {
    return execFileSync('git', args, {
      cwd: SITE_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch (_) {
    return null;
  }
}

/**
 * The date a page last changed (YYYY-MM-DD), or null outside a git checkout.
 *
 * Uncommitted edits count as today: the sitemap is generated before the commit
 * that carries it, so reading committed history alone would date a page to its
 * *previous* change and leave the sitemap stale the moment the commit landed.
 * Generator and staleness check share this so they always agree.
 */
function lastChangedDate(filePath) {
  const dirty = git(['status', '--porcelain', '--', filePath]);
  if (dirty === null) return null; // not a git checkout
  if (dirty !== '') return new Date().toISOString().slice(0, 10);
  return git(['log', '-1', '--format=%cs', '--', filePath]) || null;
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

module.exports = { getSitemapPaths, getSitemapLastmods, getRobotsBlocker, lastChangedDate };
