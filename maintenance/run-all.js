'use strict';

/** Convenience runner: SEO audit, then design audit, then growth review. */
const { spawnSync } = require('child_process');
const path = require('path');

const steps = [
  ['SEO audit', 'seo-audit.js'],
  ['Design audit', 'design-audit.js'],
  ['Growth review', 'growth-review.js'],
];

let failed = false;
for (const [label, script] of steps) {
  console.log(`\n=== ${label} ===`);
  const res = spawnSync('node', [path.join(__dirname, script)], { stdio: 'inherit', env: process.env });
  if (res.status !== 0) {
    console.error(`${label} exited with code ${res.status}`);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
