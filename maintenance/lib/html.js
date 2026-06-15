'use strict';

const cheerio = require('cheerio');

/**
 * Parse a page's HTML and extract the metadata the SEO audit cares about.
 * Returns plain data (no cheerio handles) so callers can serialize it.
 */
function extractMeta(html) {
  const $ = cheerio.load(html);

  const title = ($('head > title').first().text() || '').trim();
  const metaDescription = ($('meta[name="description"]').attr('content') || '').trim();
  const canonical = ($('link[rel="canonical"]').attr('href') || '').trim();
  const robots = ($('meta[name="robots"]').attr('content') || '').trim();
  const viewport = ($('meta[name="viewport"]').attr('content') || '').trim();
  const lang = ($('html').attr('lang') || '').trim();

  const h1s = $('h1')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  // Open Graph + Twitter coverage.
  const og = {
    title: $('meta[property="og:title"]').attr('content') || '',
    description: $('meta[property="og:description"]').attr('content') || '',
    image: $('meta[property="og:image"]').attr('content') || '',
    type: $('meta[property="og:type"]').attr('content') || '',
  };
  const twitter = {
    card: $('meta[name="twitter:card"]').attr('content') || '',
    title: $('meta[name="twitter:title"]').attr('content') || '',
  };

  // Images and their alt coverage.
  const images = $('img')
    .map((_, el) => {
      const $el = $(el);
      return {
        src: ($el.attr('src') || '').trim(),
        alt: $el.attr('alt'),
        decorative: ($el.attr('role') || '') === 'presentation' || ($el.attr('aria-hidden') || '') === 'true',
      };
    })
    .get();
  const imagesMissingAlt = images.filter((i) => i.alt === undefined && !i.decorative && i.src && !i.src.startsWith('data:'));

  // Links, split into internal vs external by host/relativity.
  const links = $('a[href]')
    .map((_, el) => ($(el).attr('href') || '').trim())
    .get()
    .filter(Boolean);

  // Structured data (JSON-LD) — parse each block, capturing parse errors.
  const jsonLd = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    try {
      JSON.parse(raw);
      jsonLd.push({ valid: true });
    } catch (e) {
      jsonLd.push({ valid: false, error: e.message });
    }
  });

  // Approximate visible word count (drop script/style first).
  $('script, style, noscript').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = text ? text.split(' ').length : 0;

  return {
    title,
    metaDescription,
    canonical,
    robots,
    viewport,
    lang,
    h1s,
    og,
    twitter,
    imageCount: images.length,
    imagesMissingAlt: imagesMissingAlt.length,
    imagesMissingAltSrcs: imagesMissingAlt.map((i) => i.src).slice(0, 10),
    links,
    jsonLdCount: jsonLd.length,
    jsonLdErrors: jsonLd.filter((j) => !j.valid),
    wordCount,
  };
}

module.exports = { extractMeta };
