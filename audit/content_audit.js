const fs = require('fs');
const ROOT = '/home/user/novaops-ai-website';

// Key marketing pages to audit for content depth
const KEY_PAGES = [
  'index.html', 'about.html', 'pricing.html', 'how-it-works.html',
  'integrations.html', 'services.html', 'industries.html', 'contact.html',
  'faq.html', 'demo.html', 'launchpad.html', 'launchpad-nova.html',
  'nova.html', 'med-spa.html', 'dental.html', 'roofing.html',
  'auto-repair.html', 'hvac.html', 'careers.html', 'community.html',
  'blog/idea-validation-guide.html', 'preview.html', 'sign-in.html',
  'thank-you.html', 'nova-ops-ai.html', 'free-audit.html',
  'nova-landing.html', 'results.html', 'roadmap.html', 'changelog.html',
  'operations/automation-workflows.html', 'operations/client-onboarding.html',
];

for (const page of KEY_PAGES) {
  const full = ROOT + '/' + page;
  if (!fs.existsSync(full)) { console.log(`MISSING: ${page}`); continue; }
  const c = fs.readFileSync(full, 'utf8');
  const text = c.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text.split(' ').filter(w => w.length > 2).length;
  const h1 = (c.match(/<h1[^>]*>([^<]*)<\/h1>/i) || [])[1] || 'NONE';
  const h2s = [...c.matchAll(/<h2[^>]*>([^<]{3,80})<\/h2>/gi)].map(m => m[1].trim()).slice(0,4);
  const hasCta = /get.started|book.call|free.audit|schedule|sign.up|try.free/i.test(text);
  const hasPricing = /\$[0-9]|per.month|pricing|plan/i.test(text);
  
  const issues = [];
  if (words < 150) issues.push(`⚠ LOW CONTENT: ${words} words`);
  if (h1 === 'NONE') issues.push('⚠ NO H1');
  if (!hasCta && !['thank-you.html','sign-in.html','preview.html'].includes(page)) issues.push('⚠ NO CTA');
  if (text.toLowerCase().includes('lorem ipsum')) issues.push('⚠ LOREM IPSUM');
  if (text.toLowerCase().includes('coming soon')) issues.push('⚠ COMING SOON');

  const status = issues.length > 0 ? issues.join(' ') : 'OK';
  console.log(`${page.padEnd(45)} ~${String(words).padStart(5)}w  H1: "${h1.slice(0,40)}"  ${status}`);
  if (h2s.length > 0) console.log(`  H2s: ${h2s.join(' | ')}`);
}
