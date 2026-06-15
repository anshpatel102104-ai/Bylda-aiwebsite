'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { SITE_ROOT } = require('../config');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
};

/** Resolve a request path to a file on disk, emulating Vercel cleanUrls. */
function resolveFile(pathname) {
  const rel = decodeURIComponent(pathname.split('?')[0]).replace(/^\/+/, '');
  const candidates = [];
  if (rel === '' || rel.endsWith('/')) {
    candidates.push(path.join(rel, 'index.html'));
  } else if (path.extname(rel)) {
    candidates.push(rel);
  } else {
    candidates.push(`${rel}.html`, path.join(rel, 'index.html'));
  }
  for (const c of candidates) {
    const full = path.resolve(SITE_ROOT, c);
    if (full.startsWith(SITE_ROOT) && fs.existsSync(full) && fs.statSync(full).isFile()) {
      return full;
    }
  }
  return null;
}

/** Start a static server; resolves with { server, port, origin }. */
function startServer(port = 0) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const file = resolveFile(req.url);
      if (!file) {
        const notFound = path.join(SITE_ROOT, '404.html');
        if (fs.existsSync(notFound)) {
          res.writeHead(404, { 'Content-Type': MIME['.html'] });
          fs.createReadStream(notFound).pipe(res);
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(port, '127.0.0.1', () => {
      const actual = server.address().port;
      resolve({ server, port: actual, origin: `http://127.0.0.1:${actual}` });
    });
  });
}

module.exports = { startServer };
