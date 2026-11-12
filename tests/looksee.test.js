import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  buildDeck, dotLayout, shuffle, emojiCode, pictureSrc, pictureFiles, labelRows, rowsText, labelLen, slideName, runStart, colorShape, colorMix, mathFacts, sumSlide,
  SETS, MIXES, LETTERS, SHAPES, COLORS, OPPOSITES, FEELINGS, GESTURES, BODY, TONES
} from '../src/concepts.js'
import { POINTS, mix, ease, pathOf } from '../src/morph.js'
import { DEFAULTS, THEMES, normalizeSettings, deckKey, wordWait } from '../src/settings.js'
import { toMin, normalizeDay, daySegments, DAY_DEFAULT } from '../src/day.js'
import { videoId, toSeconds, startSeconds } from '../src/link.js'
import { linkQuery, linkSettings, setupName } from '../src/share.js'

// Set names are off here unless a test asks for them, so decks hold only their slides.
const deck = (over) => buildDeck({ ...DEFAULTS, setNames: false, ...over }, () => 0.42)

describe('buildDeck', () => {
  it('plays the chosen sets in order', () => {
    const d = deck({ sets: ['letters', 'numbers', 'shapes', 'colors', 'opposites'] })
    expect(d.length).toBe(26 + 10 + SHAPES.length + COLORS.length + OPPOSITES.length)
    expect(d[0]).toMatchObject({ kind: 'glyph', text: 'Aa' })
    expect(d[26]).toMatchObject({ kind: 'number', n: 1, label: 'one' })
    expect(d.at(-1).label).toEqual(['full', 'empty'])
  })
  it('honors letter case and number range', () => {
    expect(deck({ sets: ['letters'], letterCase: 'lower' })[25].text).toBe('z')
    expect(deck({ sets: ['letters'], letterCase: 'upper' })[1].text).toBe('B')
    const n = deck({ sets: ['numbers'], numberFrom: 0, numberTo: 20 })
    expect(n.map((x) => x.n)).toEqual([...Array(21).keys()])
    expect(n[20].label).toBe('twenty')
  })
  it('shuffles without losing or repeating slides', () => {
    const a = deck({ sets: ['shapes'] })
    const b = deck({ sets: ['shapes'], order: 'shuffle' })
    expect(b.map((x) => x.label)).not.toEqual(a.map((x) => x.label))
    expect(b.map((x) => x.label).sort()).toEqual(a.map((x) => x.label).sort())
    expect(shuffle([1, 2, 3], () => 0.99)).toEqual([1, 2, 3])
  })
})

describe('words', () => {
  const all = deck({ sets: SETS.map((x) => x.id), numberFrom: 0, numberTo: 20 })
  const find = (label) => all.find((x) => String(x.label) === String(label))
  const rows = (label, opts) => labelRows(find(label), opts)
  it('shows the word in the language asked for', () => {
    expect(rows('circle', { words: 'en' })).toEqual([{ lang: 'en', art: '', words: ['circle'] }])
    expect(rows('circle', { words: 'es' })).toEqual([{ lang: 'es', art: '', words: ['círculo'] }])
    expect(rowsText(rows('three', { words: 'both' }))).toBe('three / tres')
    expect(rowsText(rows('happy', { words: 'es' }))).toBe('feliz')
    expect(rowsText(rows('hearing aid', { words: 'es' }))).toBe('audífono')
  })
  it('keeps a pair of opposites side by side in each language', () => {
    expect(rows(['big', 'small'], { words: 'both' }).map((r) => r.words)).toEqual([['big', 'small'], ['grande', 'pequeño']])
  })
  it('puts el, la or los before Spanish nouns, and nothing else', () => {
    const es = (label) => rowsText(rows(label, { words: 'es', articles: true }))
    expect(es('circle')).toBe('el círculo')
    expect(es('star')).toBe('la estrella')
    expect(es('hand')).toBe('la mano')
    expect(es('eyes')).toBe('los ojos')
    expect(es('airplane')).toBe('el avión')
    // Not on numbers, colors, feelings, gestures or opposites.
    for (const label of ['three', 'red', 'happy', 'wave']) expect(es(label)).not.toMatch(/^(el|la|los) /)
    expect(rowsText(rows(['big', 'small'], { words: 'es', articles: true }))).toBe('grande, pequeño')
    // And never on the English row.
    expect(rowsText(rows('star', { words: 'both', articles: true }))).toBe('star / la estrella')
  })
  it('has a word for every letter that starts with it in both languages', () => {
    expect(LETTERS.length).toBe(26)
    LETTERS.forEach((x, i) => {
      const letter = String.fromCharCode(97 + i)
      expect(x.label[0], x.label).toBe(letter)
      expect(x.es[0], x.es).toBe(letter)
      expect(['el', 'la'], x.es).toContain(x.art)
    })
    const a = deck({ sets: ['letters'] })[0]
    expect(a).toMatchObject({ kind: 'glyph', text: 'Aa', label: 'airplane', es: 'avión' })
    expect(rowsText(labelRows(a, { words: 'both' }))).toBe('airplane / avión')
    // Letter words can be turned off.
    for (const words of ['en', 'es', 'both']) expect(labelRows(a, { words, letterWords: false })).toEqual([])
  })
  it('names a slide for a screen reader by the words showing', () => {
    expect(slideName(find('circle'), rows('circle', { words: 'both', articles: true }))).toBe('circle / el círculo')
    const a = all.find((x) => x.kind === 'glyph')
    expect(slideName(a, labelRows(a, { words: 'es', articles: true }))).toBe('A: el avión')
    expect(slideName(a, labelRows(a, { letterWords: false }))).toBe('A')
  })
  it('measures the longest word, so long ones can be drawn smaller', () => {
    expect(labelLen(rows('circle', { words: 'en' }), find('circle'))).toBe(6)
    expect(labelLen(rows('circle', { words: 'both', articles: true }), find('circle'))).toBe('el círculo'.length)
    // A letter's picture takes room too; a pair of opposites is sized another way.
    const a = all.find((x) => x.kind === 'glyph')
    expect(labelLen(labelRows(a, { words: 'en' }), a)).toBe('airplane'.length + 3)
    expect(labelLen(rows(['big', 'small'], { words: 'both' }), find(['big', 'small']))).toBe(1)
  })
  it('has a Spanish word wherever there is an English one', () => {
    for (const x of all) {
      const en = [x.label].flat().filter(Boolean)
      const es = [x.es].flat().filter(Boolean)
      expect(es.length, String(x.label)).toBe(en.length)
      for (const w of es) expect(w.trim(), String(x.label)).toBe(w)
    }
    // Spanish is not just the English again (letter words are shared on purpose).
    const same = all.filter((x) => x.kind !== 'glyph' && x.label.length && String(x.label) === String(x.es))
    expect(same.map((x) => x.label)).toEqual([])
  })
})

describe('color + shape slides', () => {
  const [circle, star] = [SHAPES[0], SHAPES.find((x) => x.label === 'star')]
  const color = (label) => COLORS.find((x) => x.label === label)
  it('puts the color first in English and last in Spanish, matched to the noun', () => {
    expect(colorShape(circle, color('red'))).toMatchObject({ kind: 'shape', label: 'red circle', es: 'círculo rojo', hex: '#d93a3a' })
    expect(colorShape(star, color('yellow')).es).toBe('estrella amarilla')
    expect(colorShape(star, color('green')).es).toBe('estrella verde')
    expect(rowsText(labelRows(colorShape(star, color('white')), { words: 'es', articles: true }))).toBe('la estrella blanca')
  })
  it('gives every shape a different color, dealt again each time', () => {
    const a = deck({ sets: ['colorShapes'] })
    expect(a.length).toBe(SHAPES.length)
    expect(new Set(a.map((x) => x.hex)).size).toBe(SHAPES.length)
    const b = buildDeck({ ...DEFAULTS, setNames: false, sets: ['colorShapes'] }, () => 0.9)
    expect(b.map((x) => x.hex)).not.toEqual(a.map((x) => x.hex))
  })
})

describe('mixing colors', () => {
  const names = COLORS.map((x) => x.label)
  it('mixes two real colors into a third, as paint does', () => {
    for (const m of MIXES) {
      for (const c of m) expect(names, c).toContain(c)
      expect(new Set(m).size, String(m)).toBe(3)
    }
  })
  it('says the mix in English and Spanish', () => {
    const red = colorMix(['red', 'yellow', 'orange'])
    expect(red).toMatchObject({ kind: 'mix', a: '#d93a3a', b: '#f4d21f', hex: '#ef8a1d' })
    expect(rowsText(labelRows(red, { words: 'both', articles: true }))).toBe('red + yellow = orange / rojo + amarillo = anaranjado')
  })
  it('plays only when chosen, and is named as it begins', () => {
    expect(deck({ sets: ['mixing'] }).map((x) => x.kind)).toEqual(MIXES.map(() => 'mix'))
    expect(deck({ sets: ['colors'] }).some((x) => x.kind === 'mix')).toBe(false)
    expect(deck({ sets: ['colors', 'mixing'], setNames: true })[COLORS.length + 1]).toMatchObject({ kind: 'title', label: 'Mixing colors', es: 'Mezclar colores' })
    expect(normalizeSettings({ sets: ['mixing'] }).sets).toEqual(['mixing'])
  })
})

describe('adding and subtracting', () => {
  it('has every fact within the limit, with no zeros', () => {
    for (const max of [5, 10]) {
      const add = mathFacts('+', max)
      const sub = mathFacts('−', max)
      expect(add.length).toBe(max === 5 ? 10 : 45)
      expect(sub.length).toBe(max === 5 ? 10 : 45)
      for (const [a, b] of add) {
        const x = sumSlide('+', a, b)
        expect(x.n).toBe(a + b)
        expect(Math.min(a, b)).toBeGreaterThan(0)
        expect(x.n).toBeLessThanOrEqual(max)
      }
      for (const [a, b] of sub) {
        const x = sumSlide('−', a, b)
        expect(x.n).toBe(a - b)
        expect(x.n).toBeGreaterThan(0)
        expect(a).toBeLessThanOrEqual(max)
      }
    }
  })
  it('says the fact in English and Spanish', () => {
    expect(rowsText(labelRows(sumSlide('+', 2, 3), { words: 'both' }))).toBe('two plus three is five / dos más tres son cinco')
    expect(rowsText(labelRows(sumSlide('−', 2, 1), { words: 'both' }))).toBe('two minus one is one / dos menos uno es uno')
  })
  it('plays every fact up to 5, smallest answers first', () => {
    const d = deck({ sets: ['adding'] })
    expect(d.length).toBe(10)
    expect(d.map((x) => x.n)).toEqual([...d.map((x) => x.n)].sort((a, b) => a - b))
  })
  it('deals a fresh handful of 10 up to 10', () => {
    const one = buildDeck({ ...DEFAULTS, setNames: false, sets: ['subtracting'], mathTo: 10 }, () => 0.42)
    const two = buildDeck({ ...DEFAULTS, setNames: false, sets: ['subtracting'], mathTo: 10 }, () => 0.9)
    expect(one.length).toBe(10)
    expect(new Set(one.map((x) => x.label)).size).toBe(10)
    expect(one.map((x) => x.label)).not.toEqual(two.map((x) => x.label))
  })
  it('keeps 5 or 10, and rebuilds the deck when it changes', () => {
    expect(normalizeSettings({ mathTo: 10 }).mathTo).toBe(10)
    expect(normalizeSettings({ mathTo: 7 }).mathTo).toBe(5)
    expect(deckKey({ ...DEFAULTS, mathTo: 10 })).not.toBe(deckKey(DEFAULTS))
  })
})

describe('set names', () => {
  it('names each set as it begins, in both languages', () => {
    const d = deck({ sets: ['shapes', 'colors'], setNames: true })
    expect(d[0]).toMatchObject({ kind: 'title', label: 'Shapes', es: 'Figuras' })
    expect(d[SHAPES.length + 1]).toMatchObject({ kind: 'title', label: 'Colors', es: 'Colores' })
    expect(d.length).toBe(SHAPES.length + COLORS.length + 2)
    expect(rowsText(labelRows(d[0], { words: 'both', articles: true }))).toBe('Shapes / Figuras')
  })
  it('leaves them out when the deck is mixed up, or there is only one set', () => {
    expect(deck({ setNames: true, order: 'shuffle' }).some((x) => x.kind === 'title')).toBe(false)
    expect(deck({ setNames: true, sets: ['shapes'] }).some((x) => x.kind === 'title')).toBe(false)
  })
  it('still names sets when the words under the pictures are hidden', () => {
    expect(deck({ setNames: true, showLabel: false }).some((x) => x.kind === 'title')).toBe(true)
  })
})

describe('what rebuilds the deck', () => {
  const key = (over) => deckKey({ ...DEFAULTS, ...over })
  it('is left alone by settings that only change the look', () => {
    for (const over of [{ showLabel: false }, { firstLetter: false }, { articles: false }, { letterWords: false }, { wordDelay: 3 }, { morph: false }, { words: 'es' }, { theme: 'night' }]) {
      expect(key(over), JSON.stringify(over)).toBe(key({}))
    }
    // Set names do nothing to a mixed-up deck, so they don't rebuild it either.
    expect(key({ order: 'shuffle', setNames: false })).toBe(key({ order: 'shuffle', setNames: true }))
  })
  it('changes when the slides themselves would', () => {
    expect(key({ setNames: false })).not.toBe(key({}))
    expect(key({ sets: ['shapes'] })).not.toBe(key({}))
    expect(key({ skin: '1f3fd' })).not.toBe(key({}))
  })
  it('gives the word at least the last second of its slide', () => {
    expect(wordWait({ wordDelay: 2, seconds: 4 })).toBe(2)
    expect(wordWait({ wordDelay: 5, seconds: 4 })).toBe(3)
    expect(wordWait({ wordDelay: 5, seconds: 1 })).toBe(0)
    expect(wordWait({ wordDelay: 0, seconds: 4 })).toBe(0)
  })
})

describe('shapes that change into each other', () => {
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
  const hit = (a, b, c, d) => cross(a, b, c) * cross(a, b, d) < -1e-9 && cross(c, d, a) * cross(c, d, b) < -1e-9
  const crossings = (p) => {
    let n = 0
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 2; j < p.length; j++) {
        if (i === 0 && j === p.length - 1) continue
        if (hit(p[i], p[(i + 1) % p.length], p[j], p[(j + 1) % p.length])) n++
      }
    }
    return n
  }
  const area = (p) => p.reduce((s, a, i) => s + a[0] * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * a[1], 0) / 2
  const has = (pts, [x, y]) => pts.some((p) => Math.hypot(p[0] - x, p[1] - y) < 1e-6)

  it('gives every shape the same number of points, clockwise from the top', () => {
    for (const x of SHAPES) {
      expect(x.pts.length, x.label).toBe(POINTS)
      expect(area(x.pts), x.label).toBeGreaterThan(0)
      expect(x.pts[0][0], x.label).toBeCloseTo(200, 6)
      for (const [px, py] of x.pts) expect(px >= 0 && px <= 400 && py >= 0 && py <= 400, x.label).toBe(true)
    }
  })
  it('keeps every shape the same on its left and right', () => {
    for (const x of SHAPES) {
      expect(x.pts[POINTS / 2][0], x.label).toBeCloseTo(200, 9)
      for (let i = 1; i < POINTS / 2; i++) {
        expect(x.pts[i][0] + x.pts[POINTS - i][0], x.label).toBeCloseTo(400, 9)
        expect(x.pts[i][1], x.label).toBeCloseTo(x.pts[POINTS - i][1], 9)
      }
    }
  })
  it('keeps one shape on screen through a run of shape slides', () => {
    // two numbers, then ten shapes, then colors (which are not shapes)
    const d = deck({ sets: ['numbers', 'shapes', 'colors'], numberFrom: 1, numberTo: 2 })
    expect(runStart(d, 0)).toBe(0)
    expect(runStart(d, 1)).toBe(1)
    expect(runStart(d, 2)).toBe(2)
    expect(runStart(d, 11)).toBe(2)
    expect(runStart(d, 12)).toBe(12)
    // Shapes followed straight away by color shapes are one run of twenty.
    const both = deck({ sets: ['shapes', 'colorShapes'] })
    expect(runStart(both, 19)).toBe(0)
    // A set name between two sets of shapes breaks the run.
    const named = deck({ sets: ['shapes', 'colorShapes'], setNames: true })
    expect(runStart(named, 5)).toBe(1)
    expect(runStart(named, 15)).toBe(12)
    // Shapes alone are one run, so the last shape changes into the first again.
    const only = deck({ sets: ['shapes'], setNames: true })
    expect(runStart(only, only.length - 1)).toBe(0)
  })
  it('keeps every corner exactly where it is', () => {
    const pts = (label) => SHAPES.find((x) => x.label === label).pts
    for (const c of [[330, 70], [330, 330], [70, 330], [70, 70]]) expect(has(pts('square'), c)).toBe(true)
    for (const c of [[200, 60], [350, 330], [50, 330]]) expect(has(pts('triangle'), c)).toBe(true)
    for (const c of [[365, 110], [365, 290], [35, 290], [35, 110]]) expect(has(pts('rectangle'), c)).toBe(true)
    for (const c of [[200, 40], [325, 200], [200, 360], [75, 200]]) expect(has(pts('diamond'), c)).toBe(true)
  })
  it('changes any shape into any other without crossing itself or pinching', () => {
    for (const a of SHAPES) {
      for (const b of SHAPES) {
        if (a === b) continue
        const least = Math.min(Math.abs(area(a.pts)), Math.abs(area(b.pts)))
        for (let t = 0.1; t < 0.95; t += 0.1) {
          const p = mix(a.pts, b.pts, ease(t))
          expect(crossings(p), `${a.label} to ${b.label} at ${t.toFixed(1)}`).toBe(0)
          expect(Math.abs(area(p)), `${a.label} to ${b.label} at ${t.toFixed(1)}`).toBeGreaterThan(least * 0.9)
        }
      }
    }
  })
  it('starts as the first shape and ends as the second', () => {
    const [a, b] = [SHAPES[0].pts, SHAPES[2].pts]
    expect(mix(a, b, 0)).toEqual(a)
    expect(mix(a, b, 1)).toEqual(b)
    expect([ease(0), ease(0.5), ease(1)]).toEqual([0, 0.5, 1])
    expect(pathOf([[1, 2], [3.04, 4.06], [5, 6]])).toBe('M1 2L3 4.1L5 6z')
  })
})

describe('pictures', () => {
  it('names picture files the way Noto does', () => {
    expect(emojiCode('\u{1F600}')).toBe('1f600')
    expect(emojiCode('\u2639\uFE0F')).toBe('2639_fe0f')
    // A skin tone replaces the variation selector.
    expect(emojiCode('\u270C\uFE0F', '1f3fd')).toBe('270c_1f3fd')
    expect(pictureSrc({ dir: 'feelings', code: '1f600' }, false)).toBe('feelings/1f600.avif')
    expect(pictureSrc({ dir: 'people', code: '1f44b_1f3fb' }, true)).toBe('people/1f44b_1f3fb.svg')
  })
  it('adds one slide per feeling, each with its own word and picture', () => {
    const d = deck({ sets: ['feelings'] })
    expect(d.length).toBe(FEELINGS.length)
    expect(d[0]).toMatchObject({ kind: 'picture', dir: 'feelings', label: 'happy', code: '1f600', say: 'happy' })
    expect(new Set(d.map((x) => x.label)).size).toBe(d.length)
    expect(new Set(d.map((x) => x.code)).size).toBe(d.length)
  })
  it('deals skin tones evenly across hands and body parts', () => {
    const d = deck({ sets: ['gestures', 'body'] })
    expect(d.length).toBe(GESTURES.length + BODY.length)
    const toned = d.filter((x) => x.code.includes('_'))
    expect(toned.length).toBe([...GESTURES, ...BODY].filter((x) => !x.plain).length)
    const count = Object.fromEntries(TONES.map((tone) => [tone, toned.filter((x) => x.code.endsWith(tone)).length]))
    expect(Math.max(...Object.values(count)) - Math.min(...Object.values(count))).toBeLessThanOrEqual(1)
    // Each hand of five is all different.
    expect(new Set(toned.slice(0, 5).map((x) => x.code.split('_')[1])).size).toBe(5)
    // The text fallback carries the same tone as the picture.
    for (const x of toned) expect(x.emoji.codePointAt(x.emoji.length - 2).toString(16)).toBe(x.code.split('_')[1])
    // Parts with no skin tone are left alone.
    expect(d.find((x) => x.label === 'eyes')).toMatchObject({ code: '1f440', emoji: '\u{1F440}' })
  })
  it('deals differently each time, and can hold one tone', () => {
    const a = buildDeck({ ...DEFAULTS, sets: ['gestures'] }, () => 0.1).map((x) => x.code)
    const b = buildDeck({ ...DEFAULTS, sets: ['gestures'] }, () => 0.9).map((x) => x.code)
    expect(a).not.toEqual(b)
    const one = deck({ sets: ['gestures', 'body'], skin: '1f3fe' }).filter((x) => x.code.includes('_'))
    expect(one.every((x) => x.code.endsWith('_1f3fe'))).toBe(true)
  })
  // `npm run pictures` fetches what is missing; delete what is left over.
  it('has a moving and a still picture on disk for every picture slide, and nothing extra', () => {
    const files = pictureFiles()
    for (const dir of ['feelings', 'people']) {
      const want = files.filter((f) => f.dir === dir).flatMap((f) => [`${f.code}.avif`, `${f.code}.svg`])
      const have = readdirSync(fileURLToPath(new URL(`../public/${dir}/`, import.meta.url))).filter((n) => !n.startsWith('.'))
      expect(have.sort(), dir).toEqual(want.sort())
    }
    expect(existsSync(fileURLToPath(new URL('../public/NOTICE.txt', import.meta.url)))).toBe(true)
  })
})

describe('school day', () => {
  it('reads clock times', () => {
    expect(toMin('08:30')).toBe(510)
    expect(toMin('8:05')).toBe(485)
    expect(toMin('14:30:00')).toBe(870)
    for (const bad of ['', '25:00', '9:75', 'noon', null]) expect(toMin(bad)).toBe(null)
  })
  it('puts parts in time order, one per start time, with an end after the last', () => {
    const t = normalizeDay([{ at: '12:00', icon: 'b' }, { at: '09:00', icon: 'a' }, { at: '12:00', icon: 'dup' }, { at: 'x', icon: 'bad' }], '11:00')
    expect(t.day).toEqual([{ at: '09:00', icon: 'a' }, { at: '12:00', icon: 'b' }])
    expect(t.dayEnd).toBe('13:00')
    expect(normalizeDay(null, null)).toEqual({ day: DAY_DEFAULT, dayEnd: '15:00' })
    expect(normalizeDay([], '10:00').day).toEqual(DAY_DEFAULT)
    expect(normalizeDay(Array.from({ length: 20 }, (_, i) => ({ at: `0${i % 10}:${10 + i}`, icon: '' })), '23:00').day.length).toBe(8)
  })
  it('shows where the day is', () => {
    const at = (time) => daySegments(DAY_DEFAULT, '15:00', toMin(time)).map((p) => p.state)
    expect(at('07:00')).toEqual(['next', 'next', 'next', 'next'])
    expect(at('08:00')).toEqual(['now', 'next', 'next', 'next'])
    expect(at('11:30')).toEqual(['past', 'now', 'next', 'next'])
    expect(at('14:45')).toEqual(['past', 'past', 'past', 'now'])
    expect(at('15:00')).toEqual(['past', 'past', 'past', 'past'])
    const mid = daySegments(DAY_DEFAULT, '15:00', toMin('09:45'))
    expect(mid[0]).toMatchObject({ minutes: 210, state: 'now', frac: 0.5 })
    expect(mid.map((p) => p.minutes)).toEqual([210, 45, 135, 30])
  })
})

describe('dotLayout', () => {
  it('puts one dot per count, in rows of five, inside the box', () => {
    expect(dotLayout(0, { top: 60, bottom: 340 })).toEqual([])
    for (let n = 1; n <= 20; n++) {
      const d = dotLayout(n, { top: 255, bottom: 395 })
      expect(d.length).toBe(n)
      expect(new Set(d.map((p) => p.cy)).size).toBe(Math.ceil(n / 5))
      for (const p of d) {
        expect(p.cx - p.r).toBeGreaterThanOrEqual(0)
        expect(p.cx + p.r).toBeLessThanOrEqual(400)
        expect(p.cy - p.r).toBeGreaterThanOrEqual(250)
        expect(p.cy + p.r).toBeLessThanOrEqual(400)
      }
    }
  })
})

describe('normalizeSettings', () => {
  it('falls back to defaults on junk', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULTS)
    expect(normalizeSettings({ theme: 'neon', seconds: 'x', sets: ['nope'], loop: 'yes' })).toEqual(DEFAULTS)
  })
  it('keeps valid values and clamps ranges', () => {
    const s = normalizeSettings({ theme: 'night', seconds: 99, numberFrom: 12, numberTo: 3, sets: ['colors', 'letters'], videoUrl: '  https://youtu.be/abc  ' })
    expect(s.theme).toBe('night')
    expect(s.seconds).toBe(30)
    expect([s.numberFrom, s.numberTo]).toEqual([12, 12])
    expect(s.sets).toEqual(['letters', 'colors'])
    expect(s.videoUrl).toBe('https://youtu.be/abc')
    expect(normalizeSettings({ feelingMotion: 'still' }).feelingMotion).toBe('still')
    expect(normalizeSettings({ feelingMotion: 'spin' }).feelingMotion).toBe('moving')
    expect(normalizeSettings({ skin: '1f3fd' }).skin).toBe('1f3fd')
    expect(normalizeSettings({ skin: 'green' }).skin).toBe('mixed')
    expect(normalizeSettings({ words: 'both' }).words).toBe('both')
    expect(normalizeSettings({ words: 'fr' }).words).toBe('en')
    expect(normalizeSettings({ wordDelay: 3, morph: false, articles: false }).wordDelay).toBe(3)
    expect(normalizeSettings({ wordDelay: 99 }).wordDelay).toBe(5)
    expect(normalizeSettings({ morph: false }).morph).toBe(false)
  })
  it('never hands out the defaults themselves', () => {
    const a = normalizeSettings(null)
    a.sets.push('x')
    a.day[0].icon = 'x'
    expect(normalizeSettings(null)).toEqual(DEFAULTS)
    expect(normalizeSettings({ day: [{ at: '10:00', icon: 'a' }], dayEnd: '11:00', dayBar: false })).toMatchObject({
      day: [{ at: '10:00', icon: 'a' }],
      dayEnd: '11:00',
      dayBar: false
    })
  })
})

describe('video links', () => {
  it.each([
    ['https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'aqz-KE-bpKQ'],
    ['https://youtu.be/aqz-KE-bpKQ?t=20', 'aqz-KE-bpKQ'],
    ['youtube.com/shorts/aqz-KE-bpKQ', 'aqz-KE-bpKQ'],
    ['https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ', 'aqz-KE-bpKQ'],
    ['aqz-KE-bpKQ', 'aqz-KE-bpKQ'],
    ['https://vimeo.com/123456', ''],
    ['not a link', ''],
    ['', '']
  ])('finds the video in %s', (url, id) => expect(videoId(url)).toBe(id))
  it('reads where a link asks to start', () => {
    expect(startSeconds('https://www.youtube.com/watch?v=aqz-KE-bpKQ&t=20')).toBe(20)
    expect(startSeconds('https://youtu.be/aqz-KE-bpKQ?t=1m5s')).toBe(65)
    expect(startSeconds('youtube.com/watch?v=aqz-KE-bpKQ&start=90')).toBe(90)
    expect(startSeconds('https://youtu.be/aqz-KE-bpKQ')).toBe(0)
    expect(startSeconds('')).toBe(0)
    expect(toSeconds('1:02:03')).toBe(3723)
    expect(toSeconds('abc')).toBeNull()
  })
})

// Same math as scripts/check-contrast.mjs.
function lum(hex) {
  const c = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('stage themes', () => {
  for (const [name, t] of Object.entries(THEMES)) {
    it(`${name}: label text 4.5:1, drawing colors 3:1, on both grounds`, () => {
      for (const g of [t.bg, t.bg2]) {
        expect(ratio(t.ink, g)).toBeGreaterThanOrEqual(4.5)
        for (const c of t.colors) expect(ratio(c, g), `${c} on ${g}`).toBeGreaterThanOrEqual(3)
      }
    })
  }
})

describe('settings links', () => {
  it('is just the marker when nothing differs from the defaults', () => {
    expect(linkQuery(DEFAULTS)).toBe('v=1')
    expect(linkSettings('?v=1')).toEqual(normalizeSettings({}))
  })
  it('carries every kind of setting there and back', () => {
    const s = normalizeSettings({
      sets: ['adding', 'subtracting'], mathTo: 10, words: 'both', seconds: 7, morph: false, theme: 'night',
      day: [{ at: '09:00', icon: '🎒' }, { at: '12:00', icon: '🍎🥪' }], dayEnd: '15:15',
      videoUrl: 'https://www.youtube.com/watch?v=abc123DEF45&t=30'
    })
    const q = linkQuery(s)
    expect(q).toContain('sets=adding.subtracting')
    expect(q).not.toContain('order=')
    expect(linkSettings('?' + q)).toEqual(s)
  })
  it('is not a link without the marker, and drops what it does not know', () => {
    expect(linkSettings('?sets=adding')).toBe(null)
    expect(linkSettings('')).toBe(null)
    const s = linkSettings('?v=1&sets=adding.nonsense&theme=purple&seconds=999&day=%5Bbroken&evil=1')
    expect(s.sets).toEqual(['adding'])
    expect(s.theme).toBe(DEFAULTS.theme)
    expect(s.seconds).toBe(30)
    expect(s.day).toEqual(DEFAULTS.day)
    expect('evil' in s).toBe(false)
  })
  it('names a shortcut after its sets', () => {
    expect(setupName(DEFAULTS)).toBe('Looksee')
    expect(setupName({ ...DEFAULTS, sets: ['adding', 'subtracting'] })).toBe('Looksee · Adding, Subtracting')
    expect(setupName({ ...DEFAULTS, sets: ['letters', 'numbers', 'shapes'] })).toBe('Looksee · 3 sets')
  })
})
