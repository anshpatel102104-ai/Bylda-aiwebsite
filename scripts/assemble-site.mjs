/**
 * Assembles the deployable site into dist/.
 *
 * The site is hand-written static HTML with no build step, except the homepage,
 * which is now the React/Vite app in smoothui-lab/. This copies every static
 * page and asset into dist/, then lays the built app on top so its index.html
 * becomes the homepage. Everything else keeps its existing URL.
 *
 * Run after `npm --prefix smoothui-lab run build`.
 */
import { cp, rm, mkdir, readdir, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'dist')
const appDist = join(root, 'smoothui-lab', 'dist')

/** Build machinery and source — never served. */
const EXCLUDE = new Set([
  '.git',
  '.github',
  '.gitignore',
  'node_modules',
  'dist',
  'scripts',
  'smoothui-lab',
  'package.json',
  'package-lock.json',
  'vercel.json',
])

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

if (!(await exists(appDist))) {
  console.error(
    `[assemble] Missing ${appDist}.\n` +
      `Run "npm --prefix smoothui-lab run build" before assembling.`
  )
  process.exit(1)
}

await rm(out, { recursive: true, force: true })
await mkdir(out, { recursive: true })

// 1. Static site: every root entry that isn't build machinery.
const entries = await readdir(root, { withFileTypes: true })
let copied = 0
for (const entry of entries) {
  if (EXCLUDE.has(entry.name)) continue
  await cp(join(root, entry.name), join(out, entry.name), { recursive: true })
  copied++
}

// 2. Built homepage on top. Its index.html replaces the old static homepage;
//    hashed assets land in dist/assets/, which the static site does not use.
await cp(appDist, out, { recursive: true, force: true })

console.log(`[assemble] ${copied} static entries + built homepage -> dist/`)
