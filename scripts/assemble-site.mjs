/**
 * Assembles the deployable site into dist/.
 *
 * The site is hand-written static HTML with no build step. This copies every
 * page and asset into dist/, skipping build machinery and source that is never
 * served.
 *
 * The homepage was previously the React/Vite app in smoothui-lab/, laid on top
 * of the static site. It no longer is: index.html is the static Bylda OS
 * landing page, so nothing is overlaid on top of it.
 *
 * One piece of that app does still ship. `npm run build:hero` compiles the
 * black hole renderer out of smoothui-lab/src/island.tsx into hero/, which this
 * copies like any other asset; index.html imports it lazily. The rest of the
 * app source stays in the repo and is not deployed.
 */
import { cp, rm, mkdir, readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'dist')

/**
 * Build machinery and source — never served.
 *
 * `legacy/` holds the pages from the previous positioning (an AI automation
 * platform for founders and local businesses). They are kept in the repo for
 * reference but deliberately not deployed: serving them would compete with the
 * AI Sales Operating System pages for the same queries. Their old URLs are
 * 301'd to the closest live page in vercel.json.
 */
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
  'legacy',
  'maintenance',
  'package.json',
  'package-lock.json',
  'vercel.json',
  'DESIGN-SPEC.md',
  'redesign-specs.md',
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
