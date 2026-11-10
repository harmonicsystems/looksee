// Looksee: the concept sets, as plain data. Every visual is drawn by code
// (SVG paths in a 400×400 box, or a text glyph) — no image files, no network.
// buildDeck(settings) turns the chosen sets into the list of slides to play.

const dot = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`

// Regular polygon / star around (200, 205). `inner` makes a star.
function poly(n, r, inner) {
  const pts = []
  const steps = inner ? n * 2 : n
  for (let i = 0; i < steps; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / steps
    const rr = inner && i % 2 ? inner : r
    pts.push(`${(200 + rr * Math.cos(a)).toFixed(1)} ${(205 + rr * Math.sin(a)).toFixed(1)}`)
  }
  return 'M' + pts.join('L') + 'z'
}

export const SHAPES = [
  { label: 'circle', d: dot(200, 200, 145) },
  { label: 'square', d: 'M70 70h260v260h-260z' },
  { label: 'triangle', d: 'M200 60L350 330H50z' },
  { label: 'rectangle', d: 'M35 110h330v180h-330z' },
  { label: 'oval', d: 'M35 200a165 105 0 1 0 330 0a165 105 0 1 0-330 0z' },
  { label: 'diamond', d: 'M200 40L325 200L200 360L75 200z' },
  { label: 'star', d: poly(5, 160, 66) },
  { label: 'heart', d: 'M200 345C90 260 50 200 50 140C50 60 170 50 200 120C230 50 350 60 350 140C350 200 310 260 200 345z' },
  { label: 'pentagon', d: poly(5, 155) },
  { label: 'hexagon', d: poly(6, 155) }
]

// True colors, the same on every theme. The swatch gets an outline in the
// theme's ink so white, black and yellow stay visible on any background.
export const COLORS = [
  { label: 'red', hex: '#d93a3a' },
  { label: 'orange', hex: '#ef8a1d' },
  { label: 'yellow', hex: '#f4d21f' },
  { label: 'green', hex: '#3a9e4b' },
  { label: 'blue', hex: '#2f73d0' },
  { label: 'purple', hex: '#7d4cc2' },
  { label: 'pink', hex: '#f08bb4' },
  { label: 'brown', hex: '#8a5a33' },
  { label: 'black', hex: '#1c1c1c' },
  { label: 'white', hex: '#ffffff' },
  { label: 'gray', hex: '#8d9399' }
]

const grid = (cols, rows, x0, y0, step, r) => {
  let d = ''
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) d += dot(x0 + x * step, y0 + y * step, r)
  return d
}

// Each side is drawn in a 200×400 half. `line: true` parts are always
// stroked (the glass), whatever the fill style.
export const OPPOSITES = [
  [
    { label: 'big', parts: [{ d: dot(100, 200, 88) }] },
    { label: 'small', parts: [{ d: dot(100, 200, 26) }] }
  ],
  [
    { label: 'tall', parts: [{ d: 'M68 50h64v290h-64z' }] },
    { label: 'short', parts: [{ d: 'M68 250h64v90h-64z' }] }
  ],
  [
    { label: 'wide', parts: [{ d: 'M12 165h176v70h-176z' }] },
    { label: 'narrow', parts: [{ d: 'M78 165h44v70h-44z' }] }
  ],
  [
    { label: 'many', parts: [{ d: grid(3, 4, 45, 110, 55, 19) }] },
    { label: 'few', parts: [{ d: dot(72, 200, 19) + dot(128, 200, 19) }] }
  ],
  [
    { label: 'up', parts: [{ d: 'M100 60L172 165H128V340H72V165H28z' }] },
    { label: 'down', parts: [{ d: 'M100 340L28 235H72V60H128V235H172z' }] }
  ],
  [
    { label: 'full', parts: [{ d: 'M50 105L62 322H138L150 105z', solid: true }, { d: 'M42 70L58 330H142L158 70', line: true }] },
    { label: 'empty', parts: [{ d: 'M42 70L58 330H142L158 70', line: true }] }
  ]
]

// Feelings, gestures and body parts are pictures, not drawings: Google's
// animated Noto Emoji, copied into public/ by `npm run pictures`
// (scripts/fetch-pictures.mjs) and committed, so the app itself never contacts
// Google. The file name comes from the emoji, so adding one is a line here
// plus `npm run pictures`. Not every emoji has an animated version.
export const FEELINGS = [
  { label: 'happy', emoji: '😀' },
  { label: 'sad', emoji: '😢' },
  { label: 'angry', emoji: '😠' },
  { label: 'scared', emoji: '😨' },
  { label: 'surprised', emoji: '😮' },
  { label: 'tired', emoji: '🥱' },
  { label: 'calm', emoji: '😌' },
  { label: 'excited', emoji: '🤩' },
  { label: 'worried', emoji: '😟' },
  { label: 'frustrated', emoji: '😤' },
  { label: 'confused', emoji: '😕' },
  { label: 'silly', emoji: '🤪' },
  { label: 'sick', emoji: '🤒' },
  { label: 'loved', emoji: '🥰' }
]

// Hands and body parts come in five skin tones, and every slide is dealt one
// (see buildDeck). `plain` marks the ones that have no skin tone.
export const GESTURES = [
  { label: 'wave', emoji: '👋' },
  { label: 'thumbs up', emoji: '👍' },
  { label: 'thumbs down', emoji: '👎' },
  { label: 'clap', emoji: '👏' },
  { label: 'hooray', emoji: '🙌' },
  { label: 'okay', emoji: '👌' },
  { label: 'point', emoji: '👉' },
  { label: 'stop', emoji: '✋' },
  { label: 'fist bump', emoji: '👊' },
  { label: 'peace', emoji: '✌️' },
  { label: 'love', emoji: '🫶' }
]
export const BODY = [
  { label: 'eyes', emoji: '👀', plain: true },
  { label: 'ear', emoji: '👂' },
  { label: 'nose', emoji: '👃' },
  { label: 'hand', emoji: '🖐️' },
  { label: 'arm', emoji: '💪' },
  { label: 'leg', emoji: '🦵' },
  { label: 'foot', emoji: '🦶' },
  { label: 'brain', emoji: '🧠', plain: true },
  { label: 'heart', emoji: '🫀', plain: true },
  { label: 'bone', emoji: '🦴', plain: true },
  { label: 'hearing aid', emoji: '🦻' },
  { label: 'prosthetic arm', emoji: '🦾', plain: true },
  { label: 'prosthetic leg', emoji: '🦿', plain: true }
]

// The five skin tones, light to dark, as the code points Unicode gives them.
export const TONES = ['1f3fb', '1f3fc', '1f3fd', '1f3fe', '1f3ff']

const bare = (emoji) => [...emoji].filter((ch) => ch !== '\uFE0F')

// '😀' → '1f600'; '☹️' → '2639_fe0f'; '✌️' in a skin tone → '270c_1f3fd'.
// This is how Noto names its files.
export const emojiCode = (emoji, tone) =>
  (tone ? bare(emoji) : [...emoji]).map((ch) => ch.codePointAt(0).toString(16)).concat(tone || []).join('_')

// The moving picture, or the still one (reduced motion, the Still setting, or
// a browser that can't play animated AVIF). Relative to the page on purpose:
// the site may be served from '/' or from '/looksee/'.
export const pictureSrc = (item, still) => `${item.dir}/${item.code}.${still ? 'svg' : 'avif'}`

// One picture slide. `emoji` is the same picture as text, in the same skin
// tone: the last resort when the files can't load (offline, say).
const picture = (set, dir, x, tone) => ({
  kind: 'picture',
  set,
  dir,
  label: x.label,
  say: x.label,
  code: emojiCode(x.emoji, tone),
  emoji: tone ? bare(x.emoji).join('') + String.fromCodePoint(parseInt(tone, 16)) : x.emoji
})

// Skin tones are dealt like cards: shuffle the five, hand them out, shuffle
// again when they run out. Random, but every tone turns up equally often.
function dealer(skin, rng) {
  let hand = []
  return (x) => {
    if (x.plain) return ''
    if (skin !== 'mixed') return skin
    if (!hand.length) hand = shuffle(TONES, rng)
    return hand.pop()
  }
}

// Every picture file the app expects: [{ dir, code, label }]. The fetch
// script and the tests both read this.
export function pictureFiles() {
  const people = [...GESTURES, ...BODY].flatMap((x) =>
    (x.plain ? [''] : TONES).map((tone) => ({ dir: 'people', code: emojiCode(x.emoji, tone), label: x.label }))
  )
  return FEELINGS.map((x) => ({ dir: 'feelings', code: emojiCode(x.emoji), label: x.label })).concat(people)
}

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
  'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']

export const SETS = [
  { id: 'letters', label: 'Letters' },
  { id: 'numbers', label: 'Numbers' },
  { id: 'shapes', label: 'Shapes' },
  { id: 'colors', label: 'Colors' },
  { id: 'opposites', label: 'Opposites' },
  { id: 'feelings', label: 'Feelings' },
  { id: 'gestures', label: 'Gestures' },
  { id: 'body', label: 'Body' }
]

export function shuffle(list, rng = Math.random) {
  const a = list.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// → [{ kind: 'glyph'|'number'|'shape'|'color'|'pair'|'picture', set, label, ... }]
export function buildDeck(s, rng = Math.random) {
  const deck = []
  const on = (id) => s.sets.includes(id)
  if (on('letters')) {
    for (let i = 0; i < 26; i++) {
      const up = String.fromCharCode(65 + i)
      const lo = up.toLowerCase()
      const text = s.letterCase === 'upper' ? up : s.letterCase === 'lower' ? lo : up + lo
      deck.push({ kind: 'glyph', set: 'letters', text, label: '', say: up })
    }
  }
  if (on('numbers')) {
    for (let n = s.numberFrom; n <= s.numberTo; n++) {
      deck.push({ kind: 'number', set: 'numbers', n, label: WORDS[n], say: String(n) })
    }
  }
  if (on('shapes')) for (const x of SHAPES) deck.push({ kind: 'shape', set: 'shapes', ...x, say: x.label })
  if (on('colors')) for (const x of COLORS) deck.push({ kind: 'color', set: 'colors', ...x, say: x.label })
  if (on('opposites')) {
    for (const [a, b] of OPPOSITES) {
      deck.push({ kind: 'pair', set: 'opposites', sides: [a, b], label: [a.label, b.label], say: `${a.label}, ${b.label}` })
    }
  }
  if (on('feelings')) for (const x of FEELINGS) deck.push(picture('feelings', 'feelings', x))
  const tone = dealer(s.skin, rng)
  if (on('gestures')) for (const x of GESTURES) deck.push(picture('gestures', 'people', x, tone(x)))
  if (on('body')) for (const x of BODY) deck.push(picture('body', 'people', x, tone(x)))
  return s.order === 'shuffle' ? shuffle(deck, rng) : deck
}

// Where each dot of a number sits: rows of five, like a ten-frame.
export function dotLayout(n, { top, bottom }) {
  if (n <= 0) return []
  const rows = Math.ceil(n / 5)
  const step = Math.min(68, (bottom - top) / rows)
  const r = step * 0.38
  const y0 = (top + bottom) / 2 - ((rows - 1) * step) / 2
  const out = []
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 5)
    const inRow = Math.min(5, n - row * 5)
    const x0 = 200 - ((inRow - 1) * step) / 2
    out.push({ cx: x0 + (i % 5) * step, cy: y0 + row * step, r })
  }
  return out
}
