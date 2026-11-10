// Copies the emoji pictures into public/: for every picture the app
// expects (pictureFiles() in src/concepts.js — feelings, gestures and
// body parts, the last two in five skin tones), the animated 512×512 AVIF and
// the still SVG of that Noto emoji, from Google's font CDN.
//
//   npm run pictures              fetch whatever is missing
//   npm run pictures -- --dry     list what is missing and how big, save nothing
//   npm run pictures -- --force   fetch everything again
//
// The files are committed, so the app itself never contacts Google.
//
// AVIF, not the WebP or GIF the same site offers: the same animation is about
// 65 KB as AVIF, 500 KB as WebP and 2 MB as GIF.
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { pictureFiles } from '../src/concepts.js'

const BASE = 'https://fonts.gstatic.com/s/e/notoemoji/latest'
const OUT = fileURLToPath(new URL('../public/', import.meta.url))
const force = process.argv.includes('--force')
const dry = process.argv.includes('--dry')

// What a real file of each kind looks like, so an error page — or an SVG
// carrying script — is never saved as a picture.
const KINDS = [
  {
    remote: '512.avif',
    ext: 'avif',
    type: 'image/avif',
    ok: (b) => b.subarray(4, 8).toString('latin1') === 'ftyp' && /avi[fs]/.test(b.subarray(8, 40).toString('latin1'))
  },
  {
    remote: 'emoji.svg',
    ext: 'svg',
    type: 'image/svg+xml',
    ok: (b) => {
      const t = b.toString('utf8')
      return /<svg[\s>]/.test(t) && !/<script|<foreignObject|\son\w+\s*=|javascript:/i.test(t)
    }
  }
]

const kb = (n) => (n / 1024).toFixed(1).padStart(7) + ' KB'
const jobs = pictureFiles().flatMap((f) => KINDS.map((k) => ({ ...f, k, name: `${f.code}.${k.ext}`, path: `${OUT}${f.dir}/${f.code}.${k.ext}` })))
const have = jobs.filter((j) => existsSync(j.path) && !force)
const todo = jobs.filter((j) => !have.includes(j))
let bytes = 0
let failed = 0

async function fetchOne(j) {
  const url = `${BASE}/${j.code}/${j.k.remote}`
  try {
    // identity: a dry run must report the size on disk, not the smaller
    // compressed size the CDN would otherwise quote for an SVG.
    const res = await fetch(url, dry ? { method: 'HEAD', headers: { 'accept-encoding': 'identity' } } : {})
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const type = res.headers.get('content-type') || ''
    if (!type.startsWith(j.k.type)) throw new Error(`not a ${j.k.type} file (${type || 'no type'})`)
    if (dry) return (bytes += +res.headers.get('content-length') || 0)
    const buf = Buffer.from(await res.arrayBuffer())
    if (!j.k.ok(buf)) throw new Error(`not a real ${j.k.type} file (${buf.length} bytes)`)
    mkdirSync(`${OUT}${j.dir}`, { recursive: true })
    writeFileSync(j.path, buf)
    bytes += buf.length
  } catch (e) {
    failed++
    console.error(`✗ ${j.label}: ${url} — ${e.message}`)
  }
}

// A few at a time: quick, without leaning on the CDN.
for (let i = 0; i < todo.length; i += 8) await Promise.all(todo.slice(i, i + 8).map(fetchOne))

for (const dir of new Set(jobs.map((j) => j.dir))) {
  const want = new Set(jobs.filter((j) => j.dir === dir).map((j) => j.name))
  const onDisk = existsSync(OUT + dir) ? readdirSync(OUT + dir).filter((n) => !n.startsWith('.')) : []
  for (const name of onDisk) if (!want.has(name)) console.log(`no longer used (delete it): public/${dir}/${name}`)
  const size = onDisk.reduce((n, name) => n + statSync(`${OUT}${dir}/${name}`).size, 0)
  console.log(`public/${dir}: ${onDisk.length} of ${want.size} files, ${kb(size).trim()}`)
}
console.log(`${dry ? 'would fetch' : 'fetched'} ${todo.length - failed} file(s), ${kb(bytes).trim()}; kept ${have.length}`)
if (failed) {
  console.error(`✗ ${failed} file(s) could not be fetched. Not every emoji has an animated version — pick another.`)
  process.exit(1)
}
