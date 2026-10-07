/**
 * Writes the server-rendered app into dist/index.html and preloads the two
 * fonts the first screen needs, so the hero paints before any JavaScript runs.
 */
import { readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const web = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(web, 'dist')
const ssr = join(web, 'dist-ssr')

const { render } = await import(pathToFileURL(join(ssr, 'entry-server.js')).href)
const html = render()

const assets = await readdir(join(dist, 'assets'))
const pick = re => assets.find(f => re.test(f))
const preloads = [pick(/^schibsted-grotesk-latin-wght-normal-.*\.woff2$/), pick(/^inter-latin-wght-normal-.*\.woff2$/)]
  .filter(Boolean)
  .map(f => `<link rel="preload" href="/next/assets/${f}" as="font" type="font/woff2" crossorigin>`)
  .join('\n    ')

const indexPath = join(dist, 'index.html')
let index = await readFile(indexPath, 'utf8')
if (!index.includes('<div id="root"></div>')) throw new Error('prerender: empty #root not found in dist/index.html')
index = index.replace('<div id="root"></div>', `<div id="root">${html}</div>`)
index = index.replace('</title>', `</title>\n    ${preloads}`)
await writeFile(indexPath, index)
await rm(ssr, { recursive: true, force: true })
console.log(`[prerender] ${html.length} chars of HTML, ${preloads ? preloads.split('\n').length : 0} font preloads`)
