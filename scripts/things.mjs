// Copies the pictures for the Things sets (src/things.js) out of a local copy
// of the Thiings library into public/things/, cropped to the thing itself and
// shrunk to a 512 × 512 AVIF of about 10 KB.
//
//   npm run things              make whatever is missing
//   npm run things -- --force   make everything again
//   THIINGS_DIR=/path/to/library npm run things
//
// LOCAL ONLY. Thiings' terms do not allow redistribution, so public/things/ is
// ignored by git and nothing here is committed or published. This script
// contacts nobody: it only reads files already on this computer.
//
// Needs ImageMagick (`magick`), for reading PNG and writing AVIF.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { thingFiles, THINGS_DIR } from '../src/things.js'

const FROM = process.env.THIINGS_DIR || join(homedir(), 'Code', 'thiings-demo')
const OUT = fileURLToPath(new URL(`../public/${THINGS_DIR}/`, import.meta.url))
const force = process.argv.includes('--force')
const SIZE = 512
const INSIDE = 472 // the thing itself, leaving a 20 px margin all round

const magick = (...args) => execFileSync('magick', args, { encoding: 'utf8' })

if (!existsSync(join(FROM, 'images'))) {
  console.error(`No Thiings library at ${FROM} (expected an images/ folder of PNGs). Set THIINGS_DIR.`)
  process.exit(1)
}
try {
  magick('-version')
} catch {
  console.error('ImageMagick is needed: `magick` was not found.')
  process.exit(1)
}

mkdirSync(OUT, { recursive: true })
const want = thingFiles()
let made = 0
let bytes = 0
const missing = []
for (const x of want) {
  const src = join(FROM, 'images', `${x.from}.png`)
  const out = join(OUT, `${x.file}.avif`)
  if (!existsSync(src)) {
    missing.push(`${x.label} (${x.from}.png)`)
    continue
  }
  if (force || !existsSync(out)) {
    // The box around everything that is not clear, soft shadow included.
    const box = magick(src, '-alpha', 'extract', '-threshold', '2%', '-format', '%@', 'info:').trim()
    magick(src, '-crop', box, '+repage', '-resize', `${INSIDE}x${INSIDE}`, '-background', 'none', '-gravity', 'center',
      '-extent', `${SIZE}x${SIZE}`, '-strip', '-quality', '55', out)
    made++
  }
  bytes += statSync(out).size
}

// A picture no set asks for any more is removed, so the folder matches the list.
const keep = new Set(want.map((x) => `${x.file}.avif`))
const extra = readdirSync(OUT).filter((n) => !n.startsWith('.') && !keep.has(n))
for (const n of extra) rmSync(join(OUT, n))

console.log(`${want.length - missing.length} pictures in public/${THINGS_DIR}/ (${made} made now, ${extra.length} removed), ${(bytes / 1024).toFixed(0)} KB in all.`)
if (missing.length) {
  console.error(`Not in the library: ${missing.join(', ')}`)
  process.exit(1)
}
