/**
 * Assembles the deployable site into dist/.
 *
 * The site is hand-written static HTML with no build step. This copies every
 * page and asset into dist/, skipping build machinery and source that is never
 * served.
 *
 * The homepage was previously the React/Vite app in smoothui-lab/, laid on top
 * of the static site. It no longer is: index.html is the static Bylda OS
 * landing page, so nothing is overlaid on top of it. The app source stays in
 * the repo but is not part of the deployed site.
 */
import { cp, rm, mkdir, readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'dist')

/** Build machinery and source — never served. */
const EXCLUDE = new Set([
  '.git',
  '.github',
  '.gitignore',
  'node_modules',
  'dist',
  'scripts',
  'smoothui-lab',
  'audit',
  'reports',
  'package.json',
  'package-lock.json',
  'vercel.json',
])

await rm(out, { recursive: true, force: true })
await mkdir(out, { recursive: true })

const entries = await readdir(root, { withFileTypes: true })
let copied = 0
for (const entry of entries) {
  if (EXCLUDE.has(entry.name)) continue
  await cp(join(root, entry.name), join(out, entry.name), { recursive: true })
  copied++
}

console.log(`[assemble] ${copied} entries -> dist/`)
