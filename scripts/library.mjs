// Copies Looksee's own pictures out of David's picture library
// (~/Code/picture-library, private), cropped to the thing itself and shrunk to
// a 512 × 512 AVIF of about 10 KB:
//
//   public/winter/  the Winter sets (src/winter.js), from the library's props/
//   public/day/     the Our day words that have a picture (src/routine.js); where
//                   each comes from in the library is scripts/day-pictures.json
//
//   npm run library              make whatever is missing
//   npm run library -- --force   make everything again
//   PICTURE_LIBRARY=/path/to/library npm run library
//
// These pictures are our own, so unlike public/things/ the folders are
// committed and published. The library's cutouts are PNGs with a clear
// background. This script contacts nobody. Needs ImageMagick (`magick`).
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { winterFiles, WINTER_DIR } from '../src/winter.js'
import { dayFiles, DAY_DIR } from '../src/routine.js'

const FROM = process.env.PICTURE_LIBRARY || join(homedir(), 'Code', 'picture-library')
const force = process.argv.includes('--force')
const SIZE = 512
const INSIDE = 472 // the thing itself, leaving a 20 px margin all round

const magick = (...args) => execFileSync('magick', args, { encoding: 'utf8' })

if (!existsSync(join(FROM, 'props'))) {
  console.error(`No picture library at ${FROM} (expected a props/ folder). Set PICTURE_LIBRARY.`)
  process.exit(1)
}
try {
  magick('-version')
} catch {
  console.error('ImageMagick is needed: `magick` was not found.')
  process.exit(1)
}

const where = JSON.parse(readFileSync(new URL('./day-pictures.json', import.meta.url), 'utf8'))
const jobs = [
  { dir: WINTER_DIR, want: winterFiles().map((x) => ({ file: x.file, from: `props/${x.from}` })) },
  { dir: DAY_DIR, want: dayFiles().map((file) => ({ file, from: where[file] })) }
]

let failed = false
for (const { dir, want } of jobs) {
  const OUT = fileURLToPath(new URL(`../public/${dir}/`, import.meta.url))
  mkdirSync(OUT, { recursive: true })
  let made = 0
  let bytes = 0
  const missing = []
  for (const x of want) {
    const src = x.from && join(FROM, `${x.from}.png`)
    const out = join(OUT, `${x.file}.avif`)
    if (!src || !existsSync(src)) {
      missing.push(`${x.file} (${x.from ? x.from + '.png' : 'not in scripts/day-pictures.json'})`)
      continue
    }
    if (force || !existsSync(out)) {
      // Specks left over from cutting (a wisp of steam) are cleared first: any
      // piece of fewer than 200 pixels standing on its own.
      const clean = `${out}.png`
      magick(src, '(', '+clone', '-alpha', 'extract', '(', '+clone', '-threshold', '2%',
        '-define', 'connected-components:area-threshold=200', '-define', 'connected-components:mean-color=true',
        '-connected-components', '8', ')', '-compose', 'multiply', '-composite', ')',
        '-compose', 'CopyOpacity', '-composite', clean)
      // Then the box around everything that is not clear.
      const box = magick(clean, '-alpha', 'extract', '-threshold', '2%', '-format', '%@', 'info:').trim()
      magick(clean, '-crop', box, '+repage', '-resize', `${INSIDE}x${INSIDE}`, '-background', 'none', '-gravity', 'center',
        '-extent', `${SIZE}x${SIZE}`, '-strip', '-quality', '55', out)
      rmSync(clean)
      made++
    }
    bytes += statSync(out).size
  }
  // A picture nothing asks for any more is removed, so the folder matches the list.
  const keep = new Set(want.map((x) => `${x.file}.avif`))
  const extra = readdirSync(OUT).filter((n) => !n.startsWith('.') && !keep.has(n))
  for (const n of extra) rmSync(join(OUT, n))
  console.log(`${want.length - missing.length} pictures in public/${dir}/ (${made} made now, ${extra.length} removed), ${(bytes / 1024).toFixed(0)} KB in all.`)
  if (missing.length) {
    console.error(`Not in the library: ${missing.join(', ')}`)
    failed = true
  }
}
if (failed) process.exit(1)
