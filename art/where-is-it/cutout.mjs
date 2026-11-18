// Cut the cream background out of every draft and build the review page.
//
//   node art/where-is-it/cutout.mjs
//
// Reads  art/where-is-it/drafts/<name>.png  (Codex output, cream #f7f2e7-ish)
// Writes art/where-is-it/drafts/cut/<name>.png and .avif (512 px, transparent)
//        art/where-is-it/drafts/index.html (each cutout on the four stage themes)
//        public/where-is-it/ (the same sheet, light, published with the site)
//
// The background is cleared in two passes:
// 1. A flood fill from the edges with a wide tolerance takes the outside cream
//    and the soft fringe where it blends into the brown outline.
// 2. Enclosed gaps (between chair legs, under a table): connected patches
//    within a tight tolerance of the sampled cream, larger than HOLE of the
//    picture. The cast's cream shirts are about 20 levels darker in blue than
//    the background, so they are not matched; and small patches (noise in a
//    cream window frame or a silver leg) are too small to count.
// Then the edge of what is left is eaten by one pixel, which lands inside the
// thick brown outline and leaves no pale halo on the dark themes. All cards of
// one scene share one crop, so the furniture never changes size between them.
// Needs ImageMagick (`magick`).

import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const DRAFTS = join(HERE, 'drafts')
const CUT = join(DRAFTS, 'cut')
const SIZE = 512
const WIDE = '14%' // edge flood fill
const TIGHT = '3.5%' // enclosed patches
const HOLE = 0.0005 // smallest enclosed patch cleared, as a share of the picture

// The cards, in review order. `file` is the draft's name without .png.
const CARDS = [
  { file: 'M1-chair', word: 'master: chair', es: '' },
  { file: 'M2-table', word: 'master: table', es: '' },
  { file: 'M3-window', word: 'master: window', es: '' },
  { file: 'M4-chair-table', word: 'master: chair and table', es: '' },
  { file: 'M5-bin', word: 'master: bin', es: '' },
  { file: 'C1-ana-on-chair', word: 'on', es: 'encima de / en', who: 'Ana sits on the chair' },
  { file: 'C2-ball-under-chair', word: 'under', es: 'debajo de', who: 'the ball is under the chair' },
  { file: 'C3-sam-next-to-chair', word: 'next to', es: 'al lado de', who: 'Sam is next to the chair' },
  { file: 'T1-teddy-on-table', word: 'on', es: 'encima de', who: 'the teddy is on the table' },
  { file: 'T2-max-under-table', word: 'under', es: 'debajo de', who: 'Max sits under the table' },
  { file: 'T3-jo-next-to-table', word: 'next to', es: 'al lado de', who: 'Jo is next to the table' },
  { file: 'W1-teddy-on-ledge', word: 'on', es: 'encima de', who: 'the teddy is on the ledge' },
  { file: 'W2-ball-under-ledge', word: 'under', es: 'debajo de', who: 'the ball is under the ledge' },
  { file: 'W3-ana-next-to-window', word: 'next to', es: 'al lado de', who: 'Ana is next to the window' },
  { file: 'B1-jo-between', word: 'between', es: 'entre', who: 'Jo is between the chair and the table' },
  { file: 'B2-ball-between', word: 'between', es: 'entre', who: 'the ball is between the chair and the table' },
  { file: 'N1-teddy-in-bin', word: 'in', es: 'dentro de', who: 'the teddy is in the bin' },
  { file: 'N2-teddy-next-to-bin', word: 'next to', es: 'al lado de', who: 'the teddy is next to the bin' },
]

const THEMES = [
  ['Calm', '#f4efe6'],
  ['Bright', '#ffffff'],
  ['Night', '#101820'],
  ['High contrast', '#000000'],
]

const magick = (...args) => execFileSync('magick', args, { encoding: 'utf8' })

mkdirSync(CUT, { recursive: true })

// A card's scene: its master's letter (M1 chair → C, M2 table → T, …).
const SCENE = { M1: 'C', M2: 'T', M3: 'W', M4: 'B', M5: 'N' }
const scene = (file) => SCENE[file.slice(0, 2)] || file[0]

// Pass 1: clear the background at full size, and measure what is left.
const cards = []
for (const card of CARDS) {
  const src = join(DRAFTS, `${card.file}.png`)
  if (!existsSync(src)) continue
  const bg = magick(src, '-format', '%[pixel:p{6,6}]', 'info:').trim()
  const full = join(CUT, `${card.file}.full.png`)
  const holes = join(CUT, `${card.file}.holes.png`)
  // Enclosed background: large connected patches within the tight tolerance.
  // Small patches (noise in a cream window frame or a silver leg) are merged away.
  const area = Math.round(Number(magick(src, '-format', '%[fx:w*h]', 'info:')) * HOLE)
  magick(
    src, '-fuzz', TIGHT, '-fill', 'black', '+opaque', bg, '-fill', 'white', '-opaque', bg,
    '-colorspace', 'gray', '-threshold', '50%',
    '-define', `connected-components:area-threshold=${area}`,
    '-define', 'connected-components:mean-color=true',
    '-connected-components', '8', '-threshold', '50%', holes,
  )
  magick(
    src, '-alpha', 'set',
    '-bordercolor', bg, '-border', '2',
    '-fuzz', WIDE, '-fill', 'none', '-draw', 'color 0,0 floodfill',
    '-shave', '2x2',
    '(', '+clone', '-alpha', 'extract', '(', holes, '-negate', ')', '-compose', 'multiply', '-composite',
    '-morphology', 'Erode', 'Disk:1', ')',
    '-compose', 'CopyOpacity', '-composite', full,
  )
  rmSync(holes)
  // Bounding box of the drawing, ignoring specks.
  const [w, h, x, y] = magick(full, '-alpha', 'extract', '-threshold', '50%', '-morphology', 'Open', 'Disk:2',
    '-format', '%@', 'info:').trim().match(/\d+/g).map(Number)
  cards.push({ ...card, full, box: { x, y, w, h } })
}

// Every card in a scene is cropped to the same box (the union of them all),
// so the furniture keeps its size and place and only the child or object changes.
const union = {}
for (const c of cards) {
  const k = scene(c.file), b = c.box, u = union[k]
  union[k] = u
    ? { x: Math.min(u.x, b.x), y: Math.min(u.y, b.y), r: Math.max(u.r, b.x + b.w), b: Math.max(u.b, b.y + b.h) }
    : { x: b.x, y: b.y, r: b.x + b.w, b: b.y + b.h }
}

// Pass 2: crop to the scene's box, square it, 512 px, PNG + AVIF.
const made = []
for (const c of cards) {
  const u = union[scene(c.file)]
  const png = join(CUT, `${c.file}.png`)
  magick(
    c.full, '-crop', `${u.r - u.x}x${u.b - u.y}+${u.x}+${u.y}`, '+repage',
    '-resize', `${SIZE - 24}x${SIZE - 24}`,
    '-background', 'none', '-gravity', 'center', '-extent', `${SIZE}x${SIZE}`,
    '-strip', png,
  )
  magick(png, '-quality', '55', join(CUT, `${c.file}.avif`))
  rmSync(c.full)
  made.push(c)
}

// Anything in drafts/ that is not in CARDS is listed at the end, uncut.
const known = new Set(CARDS.map((c) => `${c.file}.png`))
const extra = readdirSync(DRAFTS).filter((f) => f.endsWith('.png') && !known.has(f))

// The published copy of the sheet: public/where-is-it/, served with the site
// at <base>where-is-it/. Small files only (AVIF cutouts, 512 px JPEG
// originals); the service worker neither stores it nor answers for it
// (vite.config.js). No reference sheets: R1 is drawn from a retailer's photo.
const PUBLISH = join(HERE, '..', '..', 'public', 'where-is-it')
rmSync(PUBLISH, { recursive: true, force: true })
mkdirSync(join(PUBLISH, 'cut'), { recursive: true })
mkdirSync(join(PUBLISH, 'orig'), { recursive: true })
for (const c of made) {
  copyFileSync(join(CUT, `${c.file}.avif`), join(PUBLISH, 'cut', `${c.file}.avif`))
  magick(join(DRAFTS, `${c.file}.png`), '-resize', `${SIZE}x${SIZE}`, '-strip', '-quality', '80',
    join(PUBLISH, 'orig', `${c.file}.jpg`))
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const row = (c, orig, cut) => `
<section>
  <h2>${esc(c.word)}${c.es ? ` <span lang="es">· ${esc(c.es)}</span>` : ''}</h2>
  ${c.who ? `<p>${esc(c.who)}</p>` : ''}
  <div class="row">
    <figure><img src="${orig(c.file)}" alt="${esc(c.who || c.word)}, as generated" loading="lazy"><figcaption>Codex original</figcaption></figure>
    ${THEMES.map(([name, bg]) => `<figure style="background:${bg}"><img src="${cut(c.file)}" alt="" loading="lazy"><figcaption>${name}</figcaption></figure>`).join('')}
  </div>
  <p class="file">${c.file}</p>
</section>`

const LOCAL = {
  title: 'Where is it? drafts',
  lede: "Each picture as Codex made it, then cut out on Looksee's four stage themes. Look for drift between a master and its cards, cream halos on Night and High contrast, and anything that makes the place word unclear.",
  orig: (f) => `${f}.png`,
  cut: (f) => `cut/${f}.png`,
  head: '',
}
const PUBLIC = {
  title: 'Where is it? — picture drafts',
  lede: 'A first look at pictures for a Looksee set that teaches place words: on, under, next to, between and in. Each picture was made with image generation as an edit of an empty scene, so between the cards of one scene only the child or the object moves, never the furniture. Nobody stands on furniture. Every picture is shown as it was made, then cut out on the four stage themes Looksee offers. These are drafts and are not in the app yet.',
  orig: (f) => `orig/${f}.jpg`,
  cut: (f) => `cut/${f}.avif`,
  head: '<meta name="robots" content="noindex">\n',
}

const page = (p, extras) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
${p.head}<title>${p.title}</title>
<style>
  :root { --bg: #f7f3ec; --ink: #2c2a26; --soft: #6b645a; --line: #d8cfc0; }
  body { margin: 0; padding: 24px 16px 64px; background: var(--bg); color: var(--ink); font: 16px/1.4 system-ui, sans-serif; }
  h1 { font-size: 22px; margin: 0 0 4px; } .lede { color: var(--soft); margin: 0 0 24px; }
  section { border-top: 1px solid var(--line); padding: 16px 0; }
  h2 { font-size: 18px; margin: 0; } h2 span { color: var(--soft); font-weight: 400; }
  section > p { margin: 2px 0 10px; color: var(--soft); } .file { font: 12px ui-monospace, monospace; }
  .row { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
  figure { margin: 0; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: #fff; }
  figure img { display: block; width: 100%; aspect-ratio: 1; object-fit: contain; }
  figcaption { font-size: 12px; padding: 4px 8px; background: rgba(255,255,255,.85); color: var(--ink); }
</style></head><body>
<h1>${p.title}</h1>
<p class="lede">${p.lede}</p>
${made.map((c) => row(c, p.orig, p.cut)).join('\n')}
${extras}
</body></html>
`

writeFileSync(join(DRAFTS, 'index.html'), page(LOCAL,
  extra.length ? `<section><h2>Not in the card list</h2><p class="file">${extra.map(esc).join(', ')}</p></section>` : ''))
writeFileSync(join(PUBLISH, 'index.html'), page(PUBLIC, ''))

console.log(`cut ${made.length} of ${CARDS.length} cards${extra.length ? `; not listed: ${extra.join(', ')}` : ''}; published to public/where-is-it/`)
