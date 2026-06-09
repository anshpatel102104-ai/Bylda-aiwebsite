const fs = require('fs');
const path = require('path');

const ROOT = '/home/user/novaops-ai-website';

function findAllHtml(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'audit') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) findAllHtml(full, results);
    else if (e.name.endsWith('.html')) results.push(full.replace(ROOT, ''));
  }
  return results;
}

function auditFile(relPath) {
  const full = ROOT + relPath;
  let content;
  try { content = fs.readFileSync(full, 'utf8'); } catch(e) { return { path: relPath, status: 'MISSING', issues: ['File not found'] }; }

  const issues = [];
  const lower = content.toLowerCase();

  // Word count (rough)
  const textOnly = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textOnly.split(' ').filter(w => w.length > 2).length;

  // Checks
  const hasNav = content.includes('nova-nav') || content.includes('<nav');
  const hasFooter = content.includes('nova-footer') || content.includes('site-footer') || content.includes('<footer');
  const hasH1 = /<h1[\s>]/i.test(content);
  const hasTitle = /<title>/i.test(content);
  const hasMetaDesc = /meta[^>]+description/i.test(content);
  const hasOmniCss = content.includes('nova-omni.css');
  const hasPolishCss = content.includes('nova-polish.css');
  const hasBodyContent = wordCount > 50;
  const hasLoremIpsum = lower.includes('lorem ipsum');
  const hasPlaceholder = lower.includes('coming soon') || lower.includes('under construction');
  const hasMain = content.includes('<main') || content.includes('id="main"');
  
  // Check for empty sections
  const emptySectionMatches = [...content.matchAll(/<section[^>]*>\s*<\/section>/gi)];

  // Check for broken relative links to CSS
  const cssLinks = [...content.matchAll(/href="([^"]+\.css)"/gi)].map(m => m[1]);
  const brokenCss = cssLinks.filter(href => {
    if (href.startsWith('http') || href.startsWith('//')) return false;
    const fileDir = path.dirname(full);
    const resolved = href.startsWith('/') ? ROOT + href : path.resolve(fileDir, href);
    return !fs.existsSync(resolved);
  });

  // Check for broken relative links to JS
  const jsLinks = [...content.matchAll(/src="([^"]+\.js)"/gi)].map(m => m[1]);
  const brokenJs = jsLinks.filter(href => {
    if (href.startsWith('http') || href.startsWith('//')) return false;
    const fileDir = path.dirname(full);
    const resolved = href.startsWith('/') ? ROOT + href : path.resolve(fileDir, href);
    return !fs.existsSync(resolved);
  });

  if (!hasTitle) issues.push('Missing <title>');
  if (!hasMetaDesc) issues.push('Missing meta description');
  if (!hasH1) issues.push('Missing H1');
  if (!hasNav) issues.push('Missing nav');
  if (!hasFooter) issues.push('Missing footer');
  if (!hasOmniCss) issues.push('Missing nova-omni.css');
  if (!hasPolishCss) issues.push('Missing nova-polish.css');
  if (wordCount < 100) issues.push(`Low content: ~${wordCount} words`);
  if (hasLoremIpsum) issues.push('Lorem ipsum text found');
  if (hasPlaceholder) issues.push('Placeholder/coming soon text');
  if (emptySectionMatches.length > 0) issues.push(`${emptySectionMatches.length} empty <section> tags`);
  if (brokenCss.length > 0) issues.push(`Broken CSS: ${brokenCss.join(', ')}`);
  if (brokenJs.length > 0) issues.push(`Broken JS: ${brokenJs.join(', ')}`);

  return {
    path: relPath,
    wordCount,
    hasNav, hasFooter, hasOmniCss, hasPolishCss, hasH1, hasTitle, hasMetaDesc,
    issues
  };
}

const files = findAllHtml(ROOT);
const results = files.map(auditFile);

// Save results
fs.writeFileSync('/home/user/novaops-ai-website/audit/local_results.json', JSON.stringify(results, null, 2));

// Summary
const critical = results.filter(r => r.issues && r.issues.length >= 3);
const warnings = results.filter(r => r.issues && r.issues.length > 0 && r.issues.length < 3);
const ok = results.filter(r => !r.issues || r.issues.length === 0);

console.log(`\nTotal HTML files: ${results.length}`);
console.log(`Critical (3+ issues): ${critical.length}`);
console.log(`Warnings (1-2 issues): ${warnings.length}`);
console.log(`Clean (0 issues): ${ok.length}`);

console.log('\n=== CRITICAL FILES (3+ issues) ===');
critical.forEach(r => {
  console.log(`\n${r.path} [~${r.wordCount} words]`);
  r.issues.forEach(i => console.log(`  ⚠ ${i}`));
});

console.log('\n=== WARNING FILES (1-2 issues) ===');
warnings.forEach(r => {
  console.log(`${r.path}: ${r.issues.join(' | ')}`);
});
