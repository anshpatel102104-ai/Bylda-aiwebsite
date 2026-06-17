'use strict';
// Ad-hoc helper: report elements that exceed the viewport width (mobile) per page.
const { chromium } = require('playwright');
const { startServer } = require('./lib/server');

const PAGES = process.argv.slice(2);
if (!PAGES.length) { console.error('usage: node find-overflow.js /contact /dental ...'); process.exit(1); }

(async () => {
  const { server, origin } = await startServer();
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  for (const p of PAGES) {
    const W = parseInt(process.env.W || '390', 10);
    const ctx = await browser.newContext({ viewport: { width: W, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(origin + p, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(400);
      const res = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const overflow = document.documentElement.scrollWidth - vw;
        const clippedBy = (el) => {
          let p = el.parentElement;
          while (p && p !== document.documentElement) {
            const ox = getComputedStyle(p).overflowX;
            if (ox === 'hidden' || ox === 'clip' || ox === 'auto' || ox === 'scroll') return true;
            p = p.parentElement;
          }
          return false;
        };
        const offenders = [];
        document.querySelectorAll('*').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.right > vw + 1 || r.left < -1) {
            // only count elements that actually extend the document scroll width
            if (r.width > 0 && (r.right > vw + 1) && !clippedBy(el)) {
              offenders.push({
                tag: el.tagName.toLowerCase(),
                cls: (el.className && el.className.toString ? el.className.toString() : '').slice(0, 60),
                id: el.id || '',
                right: Math.round(r.right),
                width: Math.round(r.width),
                text: (el.textContent || '').trim().slice(0, 40),
              });
            }
          }
        });
        // keep the widest few, dedupe by tag+cls
        offenders.sort((a, b) => b.right - a.right);
        const seen = new Set();
        const top = [];
        for (const o of offenders) {
          const k = o.tag + '.' + o.cls + '#' + o.id;
          if (seen.has(k)) continue; seen.add(k); top.push(o);
          if (top.length >= 8) break;
        }
        return { vw, overflow, count: offenders.length, top };
      });
      console.log(`\n=== ${p}  (vw=${res.vw}, overflow=${res.overflow}px, offenders=${res.count}) ===`);
      for (const o of res.top) {
        console.log(`  <${o.tag} class="${o.cls}" id="${o.id}"> right=${o.right} w=${o.width} | "${o.text}"`);
      }
    } catch (e) {
      console.log(`\n=== ${p}  ERROR: ${e.message}`);
    }
    await ctx.close();
  }
  await browser.close();
  server.close();
})();
