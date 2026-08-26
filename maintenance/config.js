'use strict';

const path = require('path');

// Repository root (one level above this maintenance/ directory).
const SITE_ROOT = path.resolve(__dirname, '..');

// Production origin. Vercel is configured with cleanUrls: true and
// trailingSlash: false (see vercel.json), so the canonical form of
// `/about.html` is `/about`.
const BASE_URL = 'https://usebylda.com';

module.exports = {
  SITE_ROOT,
  BASE_URL,

  // Where reports are written. Paths are relative to SITE_ROOT.
  REPORTS_DIR: path.join(SITE_ROOT, 'reports'),

  // Files/directories that are never treated as crawlable site pages.
  //
  // `legacy/` holds the archived pages from the previous positioning. They are
  // not linked from the live site and are served `X-Robots-Tag: noindex` (see
  // vercel.json), so they are not part of the indexable surface — auditing them
  // reported dozens of phantom critical/high findings and dragged the score
  // down by ~37 points. `smoothui-lab/` is a component sandbox, not a page.
  IGNORE_DIRS: [
    '.git',
    'node_modules',
    'maintenance',
    'reports',
    'legacy',
    'smoothui-lab',
  ],

  // Static asset extensions that resolve to a file directly (no cleanUrls).
  ASSET_EXTENSIONS: ['.css', '.js', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.xml', '.txt', '.json', '.pdf', '.woff', '.woff2', '.mp4', '.webm'],

  // Viewports used by the design/UI audit.
  VIEWPORTS: [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
  ],

  // SEO content thresholds.
  seo: {
    titleMin: 20,
    titleMax: 65,
    descMin: 70,
    descMax: 165,
    thinContentWords: 200,

    // Navigational/utility pages that are short by design. Flagging them as
    // thin content is a false positive — a 404 or a link index has no article
    // to be thin about.
    thinContentExempt: ['/404', '/sitemap'],
  },

  // Quality gates (the "world-class" targets from the maintenance brief).
  // A score below a gate marks the run as failing for that category.
  gates: {
    seo: 95,
    accessibility: 95,
    performance: 90,
    design: 95,
  },

  // Claude model used for the weekly growth review.
  ai: {
    model: 'claude-opus-4-8',
    maxTokens: 16000,
  },

  // Competitors benchmarked in the weekly growth review.
  competitors: ['Omni.co', 'Linear', 'Vercel', 'Notion', 'Stripe', 'Retool'],

  // External link checking is network-bound and flaky; opt in with
  // CHECK_EXTERNAL=1. When enabled, only this many links are sampled.
  externalLinkSampleLimit: 40,
};
