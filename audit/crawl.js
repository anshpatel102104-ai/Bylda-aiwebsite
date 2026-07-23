const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'https://www.usebylda.com';

// All known routes to check
const SEED_URLS = [
  '/',
  '/about.html',
  '/pricing.html',
  '/pricing/',
  '/how-it-works.html',
  '/integrations.html',
  '/integrations/',
  '/services.html',
  '/services/',
  '/industries.html',
  '/industries/',
  '/contact.html',
  '/faq.html',
  '/blog/',
  '/demo.html',
  '/book-call.html',
  '/sign-in.html',
  '/free-audit.html',
  '/launchpad.html',
  '/launchpad-bylda.html',
  '/bylda.html',
  '/bylda-ai.html',
  '/solar.html',
  '/bylda-landing.html',
  '/preview.html',
  '/results.html',
  '/roadmap.html',
  '/changelog.html',
  '/careers.html',
  '/careers/',
  '/community.html',
  '/affiliate.html',
  '/referral.html',
  '/media-kit.html',
  '/press.html',
  '/onboarding.html',
  '/thank-you.html',
  '/newsletter.html',
  '/sitemap.html',
  '/privacy.html',
  '/terms.html',
  '/404.html',
  // Industries
  '/auto-repair.html',
  '/chiropractic.html',
  '/dental.html',
  '/home-services.html',
  '/hvac.html',
  '/landscaping.html',
  '/med-spa.html',
  '/pest-control.html',
  '/plumbing.html',
  '/real-estate.html',
  '/roofing.html',
  '/solar-system-engine.js',
  // Tools
  '/tools/ad-copy.html',
  '/tools/business-plan-generator.html',
  '/tools/email-sequence.html',
  '/tools/first-10-customers-finder.html',
  '/tools/funding-readiness-score.html',
  '/tools/gtm-strategy-builder.html',
  '/tools/idea-validator.html',
  '/tools/idea-vs-idea.html',
  '/tools/investor-email-writer.html',
  '/tools/kill-my-idea.html',
  '/tools/kpi-dashboard.html',
  '/tools/landing-page-creator.html',
  '/tools/launch-checklist.html',
  '/tools/persona-builder.html',
  '/tools/pitch-generator.html',
  '/tools/pricing-calculator.html',
  '/tools/roi-calculator.html',
  '/tools/seo-audit.html',
  // Blog
  '/blog/ai-appointment-setting-guide.html',
  '/blog/ai-automation-for-local-businesses.html',
  '/blog/ai-for-auto-repair.html',
  '/blog/ai-for-chiropractors.html',
  '/blog/ai-for-dentists.html',
  '/blog/ai-for-landscapers.html',
  '/blog/ai-for-med-spas.html',
  '/blog/ai-for-roofing-companies.html',
  '/blog/best-ai-tools-for-founders.html',
  '/blog/best-crm-for-small-business.html',
  // Industries subdir
  '/industries/ai-automation-for-chiropractic.html',
  '/industries/ai-automation-for-dental.html',
  '/industries/ai-automation-for-home-services.html',
  '/industries/ai-automation-for-insurance-agencies.html',
  '/industries/ai-automation-for-med-spas.html',
  '/industries/ai-automation-for-real-estate.html',
  '/industries/ai-automation-for-roofers.html',
  '/industries/ai-automation-for-solar-companies.html',
];

const screenshotDir = '/home/user/bylda-ai-website/audit/screenshots';
fs.mkdirSync(screenshotDir, { recursive: true });

async function auditPage(page, url) {
  const fullUrl = BASE + url;
  const slug = url.replace(/\//g, '_').replace(/\.html$/, '') || '_home';

  let status = 0;
  let redirected = false;
  let finalUrl = fullUrl;

  try {
    const resp = await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    status = resp ? resp.status() : 0;
    finalUrl = page.url();
    redirected = finalUrl !== fullUrl;
  } catch (e) {
    return { url, status: 'ERROR', error: e.message.slice(0, 80), issues: ['Page failed to load'] };
  }

  // Wait for content
  await page.waitForTimeout(1500);

  // Capture screenshot
  try {
    await page.screenshot({ path: `${screenshotDir}/${slug}.png`, fullPage: true });
  } catch (e) {}

  // Gather metrics
  const metrics = await page.evaluate(() => {
    const bodyText = document.body ? document.body.innerText.trim() : '';
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

    const h1s = [...document.querySelectorAll('h1')].map(el => el.innerText.trim()).filter(Boolean);
    const h2s = [...document.querySelectorAll('h2')].map(el => el.innerText.trim()).filter(Boolean);

    const sections = [...document.querySelectorAll('section, [class*="section"], [class*="hero"], [class*="pricing"], [class*="feature"], [class*="cta"]')]
      .map(el => el.className).slice(0, 15);

    // Check for empty sections
    const emptySections = [...document.querySelectorAll('section')]
      .filter(s => s.innerText.trim().length < 20)
      .map(s => s.className || s.id || 'unnamed').slice(0, 5);

    // Nav check
    const navLinks = [...document.querySelectorAll('nav a, .bylda-nav a')].map(a => a.href).slice(0, 20);

    // Title and meta
    const title = document.title;
    const metaDesc = document.querySelector('meta[name="description"]')?.content || '';

    // Check for placeholder text
    const hasPlaceholder = bodyText.toLowerCase().includes('lorem ipsum') ||
                           bodyText.toLowerCase().includes('placeholder') ||
                           bodyText.toLowerCase().includes('coming soon') ||
                           bodyText.toLowerCase().includes('under construction');

    // Overflow issues - check for horizontal scroll
    const hasOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;

    // Empty headings
    const emptyHeadings = [...document.querySelectorAll('h1,h2,h3')]
      .filter(h => h.innerText.trim().length === 0).length;

    // Images without alt
    const imagesNoAlt = [...document.querySelectorAll('img')].filter(i => !i.alt).length;

    // Broken images
    const brokenImages = [...document.querySelectorAll('img')].filter(i => !i.complete || i.naturalWidth === 0).length;

    // Has nav
    const hasNav = !!document.querySelector('.bylda-nav, nav');

    // Has footer
    const hasFooter = !!document.querySelector('footer, .bylda-footer, .site-footer');

    return {
      wordCount, h1s, h2s: h2s.slice(0, 8), sections: sections.slice(0, 10),
      emptySections, navLinks, title, metaDesc, hasPlaceholder,
      hasOverflow, emptyHeadings, imagesNoAlt, brokenImages, hasNav, hasFooter
    };
  });

  // Identify issues
  const issues = [];
  if (status === 404) issues.push('404 NOT FOUND');
  if (status >= 500) issues.push(`Server error ${status}`);
  if (redirected) issues.push(`Redirects to ${finalUrl}`);
  if (metrics.wordCount < 50) issues.push(`Very low word count: ${metrics.wordCount}`);
  if (metrics.wordCount < 200) issues.push(`Low content: ${metrics.wordCount} words`);
  if (metrics.h1s.length === 0) issues.push('Missing H1');
  if (metrics.h1s.length > 1) issues.push(`Multiple H1s: ${metrics.h1s.length}`);
  if (metrics.emptySections.length > 0) issues.push(`Empty sections: ${metrics.emptySections.join(', ')}`);
  if (metrics.hasPlaceholder) issues.push('Contains placeholder/lorem ipsum text');
  if (metrics.hasOverflow) issues.push('Horizontal overflow detected');
  if (metrics.emptyHeadings > 0) issues.push(`${metrics.emptyHeadings} empty headings`);
  if (!metrics.hasNav) issues.push('Missing navigation');
  if (!metrics.hasFooter) issues.push('Missing footer');
  if (!metrics.title) issues.push('Missing title tag');
  if (!metrics.metaDesc) issues.push('Missing meta description');
  if (metrics.brokenImages > 0) issues.push(`${metrics.brokenImages} broken images`);

  return {
    url,
    finalUrl: redirected ? finalUrl : null,
    status,
    title: metrics.title,
    wordCount: metrics.wordCount,
    h1s: metrics.h1s,
    h2Count: metrics.h2s.length,
    h2s: metrics.h2s,
    hasNav: metrics.hasNav,
    hasFooter: metrics.hasFooter,
    metaDesc: metrics.metaDesc ? metrics.metaDesc.slice(0, 100) : '',
    hasOverflow: metrics.hasOverflow,
    issues
  };
}

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  const results = [];

  for (const url of SEED_URLS) {
    process.stdout.write(`Auditing ${url}... `);
    try {
      const r = await auditPage(page, url);
      results.push(r);
      process.stdout.write(`${r.status} | ${r.wordCount} words | ${r.issues.length > 0 ? '⚠ ' + r.issues.slice(0,2).join('; ') : 'OK'}\n`);
    } catch(e) {
      results.push({ url, status: 'CRASH', issues: [e.message.slice(0,80)] });
      process.stdout.write(`CRASH\n`);
    }
  }

  await browser.close();

  fs.writeFileSync('/home/user/bylda-ai-website/audit/results.json', JSON.stringify(results, null, 2));

  // Generate summary report
  const critical = results.filter(r => r.status === 404 || r.status === 'ERROR' || r.status === 'CRASH' || (r.wordCount < 100));
  const warnings = results.filter(r => r.issues.length > 0 && !critical.includes(r));
  const ok = results.filter(r => r.issues.length === 0);

  console.log('\n=== AUDIT SUMMARY ===');
  console.log(`Total pages: ${results.length}`);
  console.log(`Critical: ${critical.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log(`OK: ${ok.length}`);

  console.log('\n--- CRITICAL PAGES ---');
  critical.forEach(r => console.log(`  ${r.url}: ${r.issues.join('; ')}`));

  console.log('\n--- PAGES WITH WARNINGS ---');
  warnings.forEach(r => console.log(`  ${r.url}: ${r.issues.join('; ')}`));

})();
