'use strict';
// Run axe-core on given pages and print violations with target selectors.
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const { startServer } = require('./lib/server');

const PAGES = process.argv.slice(2);
const ONLY = process.env.RULE ? process.env.RULE.split(',') : null;

(async () => {
  const { server, origin } = await startServer();
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  for (const p of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(origin + p, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(300);
      let builder = new AxeBuilder({ page });
      const res = await builder.analyze();
      let v = res.violations;
      if (ONLY) v = v.filter((x) => ONLY.includes(x.id));
      console.log(`\n=== ${p} — ${v.length} violation type(s) ===`);
      for (const vio of v) {
        console.log(`  [${vio.impact}] ${vio.id} (${vio.nodes.length}) — ${vio.help}`);
        vio.nodes.slice(0, 6).forEach((n) => console.log(`      ${n.target.join(' ')}`));
      }
    } catch (e) {
      console.log(`\n=== ${p} ERROR ${e.message}`);
    }
    await ctx.close();
  }
  await browser.close();
  server.close();
})();
