'use strict';

const fs = require('fs');
const path = require('path');
const { REPORTS_DIR } = require('../config');

/** YYYY-MM-DD in UTC. */
function today() {
  return new Date().toISOString().slice(0, 10);
}

function timestamp() {
  return new Date().toISOString();
}

/** Write a markdown report under reports/<category>/<date>.md (and latest.md). */
function writeReport(category, filename, content) {
  const dir = path.join(REPORTS_DIR, category);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, filename);
  fs.writeFileSync(file, content);
  // Keep a stable "latest" pointer for dashboards/CI summaries.
  fs.writeFileSync(path.join(dir, 'latest.md'), content);
  return file;
}

/** Render a score as an emoji-prefixed badge against a gate threshold. */
function scoreBadge(score, gate) {
  const emoji = score >= gate ? '🟢' : score >= gate - 10 ? '🟡' : '🔴';
  return `${emoji} ${score}/100`;
}

/** Build a GitHub-flavored markdown table. */
function mdTable(headers, rows) {
  const head = `| ${headers.join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${r.join(' | ')} |`).join('\n');
  return `${head}\n${sep}\n${body || '|' + headers.map(() => ' — ').join('|') + '|'}`;
}

module.exports = { today, timestamp, writeReport, scoreBadge, mdTable };
