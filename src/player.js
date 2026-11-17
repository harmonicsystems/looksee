// Plays a playlist from music.js on one <audio>, quietly, track after track,
// starting over at the end. Not pure.
//
// It gives way to everything else that makes a sound: `dip('video', on)`,
// `dip('speak', on)` and `dip('chime', on)`. Each change fades over about
// 0.4 s. iPhones and iPads ignore an audio element's volume, so there the
// music pauses instead of dipping, and Soft and Medium are the same.
//
// A track saved on this device (Settings ▸ Music) is played from Cache
// Storage as a blob, so the service worker never has to answer the range
// requests an <audio> makes. Otherwise it comes from the site.
import { MUSIC_DIR, duckLevel } from './music.js'

const CACHE = 'looksee-music'
const a = typeof Audio === 'undefined' ? null : new Audio()
const fixed = !a || ((a.volume = 0.5), a.volume !== 0.5)
const why = new Set()
let list = null
let i = 0
let vol = 0.35
let now = 0
let blob = ''
let fade = 0
let tell = () => {}

const url = (t) => new URL(`${MUSIC_DIR}/${t.file}.m4a`, location.href).href

// Calls back with the playlist's id while one plays, null when none does, and
// 'failed' as a second argument when a track could not be loaded.
export const onMusic = (f) => (tell = f)

async function load() {
  const u = url(list.tracks[i])
  let src = u
  try {
    const hit = await (await caches.open(CACHE)).match(u)
    if (hit) src = URL.createObjectURL(await hit.blob())
  } catch {}
  if (blob) URL.revokeObjectURL(blob)
  blob = src === u ? '' : src
  a.src = src
  level()
}

function level() {
  if (!a) return
  const to = !list || (fixed && why.size) ? 0 : fixed ? 1 : duckLevel(vol, why)
  if (to && a.paused && a.src) a.play().catch(() => {})
  clearInterval(fade)
  fade = setInterval(() => {
    now = to > now ? Math.min(to, now + 0.05) : Math.max(to, now - 0.05)
    a.volume = fixed ? 1 : now
    if (now !== to) return
    clearInterval(fade)
    if (!to) a.pause()
  }, 30)
}

export function playMusic(p, v) {
  if (!a) return
  list = p
  i = 0
  vol = v
  load()
  tell(p.id)
}

export function stopMusic() {
  if (!list) return
  list = null
  level()
  tell(null)
}

export function setMusicVolume(v) {
  vol = v
  level()
}

export function dip(reason, on) {
  on ? why.add(reason) : why.delete(reason)
  level()
}

if (a) {
  a.onended = () => {
    if (!list) return
    i = (i + 1) % list.tracks.length
    load()
  }
  a.onerror = () => {
    if (!list) return
    list = null
    tell(null, 'failed')
  }
}

// Saves every track of these playlists on this device, for offline use.
// Calls back with how many are saved so far, and resolves to that number.
export async function saveMusic(lists, step = () => {}) {
  const c = await caches.open(CACHE)
  const all = lists.flatMap((p) => p.tracks).map(url)
  let n = 0
  for (const u of all) {
    if (!(await c.match(u))) await c.add(u)
    step(++n, all.length)
  }
  return n
}

// How many tracks of these playlists this device has saved.
export async function savedMusic(lists) {
  try {
    const c = await caches.open(CACHE)
    const hits = await Promise.all(lists.flatMap((p) => p.tracks).map((t) => c.match(url(t))))
    return hits.filter(Boolean).length
  } catch {
    return 0
  }
}
