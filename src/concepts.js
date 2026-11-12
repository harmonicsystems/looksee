// Looksee: the concept sets, as plain data. Every visual is drawn by code
// (SVG paths in a 400×400 box, or a text glyph) — no image files, no network.
// buildDeck(settings) turns the chosen sets into the list of slides to play.
//
// Every concept has its word twice: `label` in English and `es` in Spanish.
// The Spanish is Latin American, as heard in US classrooms (anaranjado, rosa,
// café, morado, angosto), and words that change with gender are written
// "enojado/a". Nouns also carry their article (`art`: el, la, los).
// A Spanish speaker should check them; each is one edit here.

import { polygon, curves, ellipse, regular, resample } from './morph.js'

const dot = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`

// Each shape is its outline as points (see morph.js): every shape has the same
// number, so any one can change into any other. A shape is described from its
// top-middle, clockwise; only its right-hand side is read, and the left is the
// mirror image, so every shape here must be the same on both sides.
const shape = (label, es, art, half) => ({ label, es, art, pts: resample(half) })

export const SHAPES = [
  shape('circle', 'círculo', 'el', ellipse(200, 145, 145)),
  shape('square', 'cuadrado', 'el', polygon([[200, 70], [330, 70], [330, 330], [70, 330]])),
  shape('triangle', 'triángulo', 'el', polygon([[200, 60], [350, 330], [50, 330]])),
  shape('rectangle', 'rectángulo', 'el', polygon([[200, 110], [365, 110], [365, 290], [35, 290]])),
  shape('oval', 'óvalo', 'el', ellipse(200, 165, 105)),
  shape('diamond', 'rombo', 'el', polygon([[200, 40], [325, 200], [200, 360], [75, 200]])),
  shape('star', 'estrella', 'la', polygon(regular(5, 160, 66))),
  shape('heart', 'corazón', 'el', curves([[200, 120], [230, 50], [350, 60], [350, 140], [350, 200], [310, 260], [200, 345]])),
  shape('pentagon', 'pentágono', 'el', polygon(regular(5, 155))),
  shape('hexagon', 'hexágono', 'el', polygon(regular(6, 155)))
]

// True colors, the same on every theme. The swatch gets an outline in the
// theme's ink so white, black and yellow stay visible on any background.
// `esF` is the form that goes with a "la" noun, where it differs.
export const COLORS = [
  { label: 'red', es: 'rojo', esF: 'roja', hex: '#d93a3a' },
  { label: 'orange', es: 'anaranjado', esF: 'anaranjada', hex: '#ef8a1d' },
  { label: 'yellow', es: 'amarillo', esF: 'amarilla', hex: '#f4d21f' },
  { label: 'green', es: 'verde', hex: '#3a9e4b' },
  { label: 'blue', es: 'azul', hex: '#2f73d0' },
  { label: 'purple', es: 'morado', esF: 'morada', hex: '#7d4cc2' },
  { label: 'pink', es: 'rosa', hex: '#f08bb4' },
  { label: 'brown', es: 'café', hex: '#8a5a33' },
  { label: 'black', es: 'negro', esF: 'negra', hex: '#1c1c1c' },
  { label: 'white', es: 'blanco', esF: 'blanca', hex: '#ffffff' },
  { label: 'gray', es: 'gris', hex: '#8d9399' }
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
    { label: 'big', es: 'grande', parts: [{ d: dot(100, 200, 88) }] },
    { label: 'small', es: 'pequeño', parts: [{ d: dot(100, 200, 26) }] }
  ],
  [
    { label: 'tall', es: 'alto', parts: [{ d: 'M68 50h64v290h-64z' }] },
    { label: 'short', es: 'bajo', parts: [{ d: 'M68 250h64v90h-64z' }] }
  ],
  [
    { label: 'wide', es: 'ancho', parts: [{ d: 'M12 165h176v70h-176z' }] },
    { label: 'narrow', es: 'angosto', parts: [{ d: 'M78 165h44v70h-44z' }] }
  ],
  [
    { label: 'many', es: 'muchos', parts: [{ d: grid(3, 4, 45, 110, 55, 19) }] },
    { label: 'few', es: 'pocos', parts: [{ d: dot(72, 200, 19) + dot(128, 200, 19) }] }
  ],
  [
    { label: 'up', es: 'arriba', parts: [{ d: 'M100 60L172 165H128V340H72V165H28z' }] },
    { label: 'down', es: 'abajo', parts: [{ d: 'M100 340L28 235H72V60H128V235H172z' }] }
  ],
  [
    { label: 'full', es: 'lleno', parts: [{ d: 'M50 105L62 322H138L150 105z', solid: true }, { d: 'M42 70L58 330H142L158 70', line: true }] },
    { label: 'empty', es: 'vacío', parts: [{ d: 'M42 70L58 330H142L158 70', line: true }] }
  ]
]

// A word for each letter, A to Z: one thing whose name starts with that letter
// in both languages, so the word under the letter means the same in each.
// `emoji` is a small picture drawn by the device's own emoji font (no file);
// three letters have no fitting one and show the word alone.
export const LETTERS = [
  { label: 'airplane', es: 'avión', art: 'el', emoji: '✈️' },
  { label: 'banana', es: 'banana', art: 'la', emoji: '🍌' },
  { label: 'car', es: 'carro', art: 'el', emoji: '🚗' },
  { label: 'dinosaur', es: 'dinosaurio', art: 'el', emoji: '🦕' },
  { label: 'elephant', es: 'elefante', art: 'el', emoji: '🐘' },
  { label: 'flower', es: 'flor', art: 'la', emoji: '🌸' },
  { label: 'guitar', es: 'guitarra', art: 'la', emoji: '🎸' },
  { label: 'helicopter', es: 'helicóptero', art: 'el', emoji: '🚁' },
  { label: 'island', es: 'isla', art: 'la', emoji: '🏝️' },
  { label: 'juice', es: 'jugo', art: 'el', emoji: '🧃' },
  { label: 'koala', es: 'koala', art: 'el', emoji: '🐨' },
  { label: 'lion', es: 'león', art: 'el', emoji: '🦁' },
  { label: 'monkey', es: 'mono', art: 'el', emoji: '🐒' },
  { label: 'nose', es: 'nariz', art: 'la', emoji: '👃' },
  { label: 'ocean', es: 'océano', art: 'el', emoji: '🌊' },
  { label: 'penguin', es: 'pingüino', art: 'el', emoji: '🐧' },
  { label: 'quesadilla', es: 'quesadilla', art: 'la', emoji: '' },
  { label: 'robot', es: 'robot', art: 'el', emoji: '🤖' },
  { label: 'sun', es: 'sol', art: 'el', emoji: '☀️' },
  { label: 'tiger', es: 'tigre', art: 'el', emoji: '🐯' },
  { label: 'unicorn', es: 'unicornio', art: 'el', emoji: '🦄' },
  { label: 'volcano', es: 'volcán', art: 'el', emoji: '🌋' },
  { label: 'waffle', es: 'wafle', art: 'el', emoji: '🧇' },
  { label: 'xylophone', es: 'xilófono', art: 'el', emoji: '' },
  { label: 'yo-yo', es: 'yoyo', art: 'el', emoji: '🪀' },
  { label: 'zoo', es: 'zoológico', art: 'el', emoji: '' }
]

// Feelings, gestures and body parts are pictures, not drawings: Google's
// animated Noto Emoji, copied into public/ by `npm run pictures`
// (scripts/fetch-pictures.mjs) and committed, so the app itself never contacts
// Google. The file name comes from the emoji, so adding one is a line here
// plus `npm run pictures`. Not every emoji has an animated version.
export const FEELINGS = [
  { label: 'happy', es: 'feliz', emoji: '😀' },
  { label: 'sad', es: 'triste', emoji: '😢' },
  { label: 'angry', es: 'enojado/a', emoji: '😠' },
  { label: 'scared', es: 'asustado/a', emoji: '😨' },
  { label: 'surprised', es: 'sorprendido/a', emoji: '😮' },
  { label: 'tired', es: 'cansado/a', emoji: '🥱' },
  { label: 'calm', es: 'tranquilo/a', emoji: '😌' },
  { label: 'excited', es: 'emocionado/a', emoji: '🤩' },
  { label: 'worried', es: 'preocupado/a', emoji: '😟' },
  { label: 'frustrated', es: 'frustrado/a', emoji: '😤' },
  { label: 'confused', es: 'confundido/a', emoji: '😕' },
  { label: 'silly', es: 'chistoso/a', emoji: '🤪' },
  { label: 'sick', es: 'enfermo/a', emoji: '🤒' },
  { label: 'loved', es: 'querido/a', emoji: '🥰' }
]

// Hands and body parts come in five skin tones, and every slide is dealt one
// (see buildDeck). `plain` marks the ones that have no skin tone.
export const GESTURES = [
  { label: 'wave', es: 'saludar', emoji: '👋' },
  { label: 'thumbs up', es: 'pulgar arriba', emoji: '👍' },
  { label: 'thumbs down', es: 'pulgar abajo', emoji: '👎' },
  { label: 'clap', es: 'aplaudir', emoji: '👏' },
  { label: 'hooray', es: '¡hurra!', emoji: '🙌' },
  { label: 'okay', es: 'está bien', emoji: '👌' },
  { label: 'point', es: 'señalar', emoji: '👉' },
  { label: 'stop', es: 'parar', emoji: '✋' },
  { label: 'fist bump', es: 'choque de puños', emoji: '👊' },
  { label: 'peace', es: 'paz', emoji: '✌️' },
  { label: 'love', es: 'amor', emoji: '🫶' }
]
export const BODY = [
  { label: 'eyes', es: 'ojos', art: 'los', emoji: '👀', plain: true },
  { label: 'ear', es: 'oreja', art: 'la', emoji: '👂' },
  { label: 'nose', es: 'nariz', art: 'la', emoji: '👃' },
  { label: 'hand', es: 'mano', art: 'la', emoji: '🖐️' },
  { label: 'arm', es: 'brazo', art: 'el', emoji: '💪' },
  { label: 'leg', es: 'pierna', art: 'la', emoji: '🦵' },
  { label: 'foot', es: 'pie', art: 'el', emoji: '🦶' },
  { label: 'brain', es: 'cerebro', art: 'el', emoji: '🧠', plain: true },
  { label: 'heart', es: 'corazón', art: 'el', emoji: '🫀', plain: true },
  { label: 'bone', es: 'hueso', art: 'el', emoji: '🦴', plain: true },
  { label: 'hearing aid', es: 'audífono', art: 'el', emoji: '🦻' },
  { label: 'prosthetic arm', es: 'prótesis de brazo', art: 'la', emoji: '🦾', plain: true },
  { label: 'prosthetic leg', es: 'prótesis de pierna', art: 'la', emoji: '🦿', plain: true }
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
  es: x.es,
  art: x.art,
  say: x.label,
  code: emojiCode(x.emoji, tone),
  emoji: tone ? bare(x.emoji).join('') + String.fromCodePoint(parseInt(tone, 16)) : x.emoji
})

// A bag deals its things like cards: shuffle, hand them out one at a time,
// shuffle again when they run out. Random, but everything turns up equally
// often. Skin tones and the colors of the color + shape slides are dealt.
function bag(things, rng) {
  let hand = []
  return () => {
    if (!hand.length) hand = shuffle(things, rng)
    return hand.pop()
  }
}
function dealer(skin, rng) {
  const next = bag(TONES, rng)
  return (x) => (x.plain ? '' : skin !== 'mixed' ? skin : next())
}

// "red circle" / "círculo rojo": English puts the color first; Spanish puts it
// last and matches it to the noun ("estrella amarilla").
export const colorShape = (shape, color) => ({
  kind: 'shape',
  set: 'colorShapes',
  pts: shape.pts,
  hex: color.hex,
  art: shape.art,
  label: `${color.label} ${shape.label}`,
  es: `${shape.es} ${(shape.art === 'la' && color.esF) || color.es}`,
  say: `${color.label} ${shape.label}`
})

// Paint mixing, as taught in class: two colors make a third. Each is a name
// from COLORS, so the result is exactly the color the Colors set shows.
export const MIXES = [
  ['red', 'yellow', 'orange'],
  ['yellow', 'blue', 'green'],
  ['blue', 'red', 'purple'],
  ['red', 'white', 'pink'],
  ['black', 'white', 'gray'],
  ['red', 'green', 'brown']
]
const colorNamed = (name) => COLORS.find((c) => c.label === name)

// "red + yellow = orange": two blobs of paint and what they make together.
// `hex` is the result, so the first letter is plain ink, as on color slides.
export const colorMix = ([a, b, out]) => {
  const [x, y, z] = [a, b, out].map(colorNamed)
  return {
    kind: 'mix',
    set: 'mixing',
    a: x.hex,
    b: y.hex,
    hex: z.hex,
    label: `${x.label} + ${y.label} = ${z.label}`,
    es: `${x.es} + ${y.es} = ${z.es}`,
    say: `${x.label} and ${y.label} make ${z.label}`
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
const WORDS_ES = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once',
  'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte']

// Adding and subtracting: every fact whose numbers stay within `max`, with
// no zeros (nothing added, nothing left). Up to 5 that is 10 of each; up to
// 10, 45 of each.
export function mathFacts(op, max) {
  const out = []
  for (let a = 1; a <= max; a++)
    for (let b = 1; b <= max; b++) if (op === '+' ? a + b <= max : b < a) out.push([a, b])
  return out
}

// "two plus three is five" / "dos más tres son cinco" ("es" for one).
export function sumSlide(op, a, b) {
  const n = op === '+' ? a + b : a - b
  const en = op === '+' ? 'plus' : 'minus'
  const es = op === '+' ? 'más' : 'menos'
  return {
    kind: 'sum',
    set: op === '+' ? 'adding' : 'subtracting',
    op,
    a,
    b,
    n,
    label: `${WORDS[a]} ${en} ${WORDS[b]} is ${WORDS[n]}`,
    es: `${WORDS_ES[a]} ${es} ${WORDS_ES[b]} ${n === 1 ? 'es' : 'son'} ${WORDS_ES[n]}`,
    say: `${WORDS[a]} ${en} ${WORDS[b]} is ${WORDS[n]}`
  }
}

// The words under a slide: a row per language shown, each one word (or two for
// a pair of opposites). `art` is the Spanish article, when articles are on and
// the word is a noun. A letter has rows only when letter words are on.
export function labelRows(item, { words = 'en', articles = false, letterWords = true } = {}) {
  if (item.kind === 'glyph' && !letterWords) return []
  const rows = []
  if (words !== 'es' && item.label.length) rows.push({ lang: 'en', art: '', words: [item.label].flat() })
  if (words !== 'en' && item.es.length) rows.push({ lang: 'es', art: (articles && item.art) || '', words: [item.es].flat() })
  return rows
}

// The same rows as one line of text, for a screen reader.
export const rowsText = (rows) => rows.map((r) => (r.art ? r.art + ' ' : '') + r.words.join(', ')).join(' / ')

// How many letters the longest one-word row has (with its article), so long
// words can be drawn smaller and never run off the screen. A letter's picture
// counts as three more.
export const labelLen = (rows, item) =>
  Math.max(1, ...rows.filter((r) => r.words.length === 1).map((r) => r.words[0].length + (r.art ? r.art.length + 1 : 0))) +
  (item.kind === 'glyph' && item.emoji ? 3 : 0)

// A slide's name for a screen reader: the words showing, after the letter's
// own name on a letter slide.
export function slideName(item, rows) {
  const text = rowsText(rows)
  return item.kind === 'glyph' ? [item.say, text].filter(Boolean).join(': ') : text || item.say
}

// Where the run of shapes that slide i belongs to begins. One shape stays on
// screen through a whole run, changing into each next one.
export function runStart(deck, i) {
  while (i > 0 && deck[i - 1].pts && deck[i].pts) i--
  return i
}

// Sets are named as they begin when there is more than one of them and they
// play in order. (Mixed up, the sets are interleaved and have no beginning.)
export const namesSets = (s) => s.setNames && s.order !== 'shuffle' && SETS.filter((x) => s.sets.includes(x.id)).length > 1

// `es` is the set's name in Spanish, shown when a set is named as it begins.
export const SETS = [
  { id: 'letters', label: 'Letters', es: 'Letras' },
  { id: 'numbers', label: 'Numbers', es: 'Números' },
  { id: 'adding', label: 'Adding', es: 'Sumar' },
  { id: 'subtracting', label: 'Subtracting', es: 'Restar' },
  { id: 'shapes', label: 'Shapes', es: 'Figuras' },
  { id: 'colors', label: 'Colors', es: 'Colores' },
  { id: 'colorShapes', label: 'Colors and shapes', es: 'Colores y figuras' },
  { id: 'mixing', label: 'Mixing colors', es: 'Mezclar colores' },
  { id: 'opposites', label: 'Opposites', es: 'Opuestos' },
  { id: 'feelings', label: 'Feelings', es: 'Emociones' },
  { id: 'gestures', label: 'Gestures', es: 'Gestos' },
  { id: 'body', label: 'Body', es: 'Cuerpo' }
]

// The sets in groups, for Settings and for naming a bookmark. Every set is in
// exactly one group, and the groups keep the order of SETS.
export const GROUPS = [
  { id: 'early', label: 'Letters & Numbers', emoji: '🔤', sets: ['letters', 'numbers'] },
  { id: 'math', label: 'Math', emoji: '➕', sets: ['adding', 'subtracting'] },
  { id: 'art', label: 'Shapes & Colors', emoji: '🎨', sets: ['shapes', 'colors', 'colorShapes', 'mixing'] },
  { id: 'opposites', label: 'Opposites', emoji: '↔️', sets: ['opposites'] },
  { id: 'people', label: 'Feelings & Body', emoji: '😊', sets: ['feelings', 'gestures', 'body'] }
]

export function shuffle(list, rng = Math.random) {
  const a = list.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// → [{ kind: 'title'|'glyph'|'number'|'shape'|'color'|'mix'|'sum'|'pair'|'picture', set, label, es, ... }]
export function buildDeck(s, rng = Math.random) {
  const deck = []
  const titles = namesSets(s)
  const add = (id, slides) => {
    if (!s.sets.includes(id)) return
    const set = SETS.find((x) => x.id === id)
    if (titles) deck.push({ kind: 'title', set: id, label: set.label, es: set.es, say: set.label })
    deck.push(...slides())
  }
  add('letters', () =>
    LETTERS.map((x, i) => {
      const up = String.fromCharCode(65 + i)
      const lo = up.toLowerCase()
      const text = s.letterCase === 'upper' ? up : s.letterCase === 'lower' ? lo : up + lo
      return { kind: 'glyph', set: 'letters', text, ...x, say: up }
    })
  )
  add('numbers', () =>
    Array.from({ length: Math.max(0, s.numberTo - s.numberFrom + 1) }, (_, i) => {
      const n = s.numberFrom + i
      return { kind: 'number', set: 'numbers', n, label: WORDS[n], es: WORDS_ES[n], say: String(n) }
    })
  )
  // Up to 5, every fact plays. Up to 10 there are 45 of each, so a round
  // deals 10 of them: a fresh handful every time the deck starts over.
  const facts = (op) => {
    const all = mathFacts(op, s.mathTo)
    const hand = s.mathTo > 5 ? shuffle(all, rng).slice(0, 10) : all
    const sorted = s.order === 'shuffle' ? hand : hand.sort((x, y) => (op === '+' ? x[0] + x[1] - y[0] - y[1] : x[0] - x[1] - (y[0] - y[1])) || x[0] - y[0])
    return sorted.map(([a, b]) => sumSlide(op, a, b))
  }
  add('adding', () => facts('+'))
  add('subtracting', () => facts('−'))
  add('shapes', () => SHAPES.map((x) => ({ kind: 'shape', set: 'shapes', ...x, say: x.label })))
  add('colors', () => COLORS.map((x) => ({ kind: 'color', set: 'colors', ...x, say: x.label })))
  const color = bag(COLORS, rng)
  add('colorShapes', () => SHAPES.map((x) => colorShape(x, color())))
  add('mixing', () => MIXES.map(colorMix))
  add('opposites', () =>
    OPPOSITES.map(([a, b]) => ({ kind: 'pair', set: 'opposites', sides: [a, b], label: [a.label, b.label], es: [a.es, b.es], say: `${a.label}, ${b.label}` }))
  )
  add('feelings', () => FEELINGS.map((x) => picture('feelings', 'feelings', x)))
  const tone = dealer(s.skin, rng)
  add('gestures', () => GESTURES.map((x) => picture('gestures', 'people', x, tone(x))))
  add('body', () => BODY.map((x) => picture('body', 'people', x, tone(x))))
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
