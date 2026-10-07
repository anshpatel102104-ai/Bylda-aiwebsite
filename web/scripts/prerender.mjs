/**
 * Writes the server-rendered app into dist/index.html and one HTML file per
 * product page (dist/product/<slug>.html, served at /product/<slug> by
 * cleanUrls), and preloads the two fonts the first screen needs, so each page
 * paints before any JavaScript runs.
 */
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const web = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(web, 'dist')
const ssr = join(web, 'dist-ssr')

const { render, faqJsonLd, productRoutes } = await import(pathToFileURL(join(ssr, 'entry-server.js')).href)

const assets = await readdir(join(dist, 'assets'))
const pick = re => assets.find(f => re.test(f))
const preloads = [pick(/^schibsted-grotesk-latin-wght-normal-.*\.woff2$/), pick(/^inter-latin-wght-normal-.*\.woff2$/)]
  .filter(Boolean)
  .map(f => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin>`)
  .join('\n    ')

const indexPath = join(dist, 'index.html')
const template = await readFile(indexPath, 'utf8')
if (!template.includes('<div id="root"></div>')) throw new Error('prerender: empty #root not found in dist/index.html')

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** Fill the template: app HTML, font preloads, and page-specific JSON-LD. */
function page(html, jsonLd) {
  return template
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`)
    .replace('</title>', `</title>\n    ${preloads}`)
    .replace('</head>', `  <script type="application/ld+json">${jsonLd}</script>\n  </head>`)
}

/** Swap one head tag's value, failing loudly if the template changed shape. */
function swap(doc, re, value, name) {
  if (!re.test(doc)) throw new Error(`prerender: ${name} not found in the template`)
  return doc.replace(re, (_, a, b) => `${a}${value}${b}`)
}

const home = render('/')
await writeFile(indexPath, page(home, faqJsonLd()))
console.log(`[prerender] / ${home.length} chars of HTML, ${preloads ? preloads.split('\n').length : 0} font preloads`)

for (const r of productRoutes()) {
  let doc = page(render(r.path), r.jsonLd)
  doc = swap(doc, /(<title>)[^<]*(<\/title>)/, esc(r.title), 'title')
  doc = swap(doc, /(<meta name="description" content=")[^"]*(")/, esc(r.description), 'description')
  doc = swap(doc, /(<link rel="canonical" href=")[^"]*(")/, r.url, 'canonical')
  doc = swap(doc, /(<link rel="alternate" hreflang="en" href=")[^"]*(")/, r.url, 'hreflang en')
  doc = swap(doc, /(<link rel="alternate" hreflang="x-default" href=")[^"]*(")/, r.url, 'hreflang x-default')
  doc = swap(doc, /(<meta property="og:title" content=")[^"]*(")/, esc(r.title), 'og:title')
  doc = swap(doc, /(<meta property="og:description" content=")[^"]*(")/, esc(r.description), 'og:description')
  doc = swap(doc, /(<meta property="og:url" content=")[^"]*(")/, r.url, 'og:url')
  doc = swap(doc, /(<meta name="twitter:title" content=")[^"]*(")/, esc(r.title), 'twitter:title')
  doc = swap(doc, /(<meta name="twitter:description" content=")[^"]*(")/, esc(r.description), 'twitter:description')
  const out = join(dist, r.file)
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, doc)
  console.log(`[prerender] ${r.path}`)
}

await rm(ssr, { recursive: true, force: true })
