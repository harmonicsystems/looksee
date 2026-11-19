import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  buildDeck, dotLayout, shuffle, numberWord, emojiCode, pictureSrc, pictureFiles, labelRows, rowsText, labelLen, slideName, runStart, colorShape, colorMix, mathFacts, sumSlide, genderForm,
  SETS, GROUPS, MIXES, LETTERS, SHAPES, COLORS, OPPOSITES, FEELINGS, GESTURES, BODY, TONES
} from '../src/concepts.js'
import { POINTS, mix, ease, pathOf } from '../src/morph.js'
import { DEFAULTS, THEMES, normalizeSettings, deckKey, wordWait, upgrade } from '../src/settings.js'
import { toMin, normalizeDay, daySegments, partAt, partEnd, clock12, DAY_DEFAULT } from '../src/day.js'
import { videoId, toSeconds, startSeconds } from '../src/link.js'
import { linkQuery, linkSettings, setupName, setsName } from '../src/share.js'
import { MINUTES, PLAN_MAX, normalizePlan, blockDone, minutesLeft, blockAfter, setsInUse } from '../src/plan.js'
import { PRESETS, FACES, normalizeTimer, timerState, remaining, share, startTimer, pauseTimer, resumeTimer, endTimer, addTime, clockText, milestone, faceTrack, faceFill } from '../src/timer.js'
import { VIDEOS, sides } from '../src/videos.js'
import { ROUTINE } from '../src/routine.js'
import { speechLines, pickVoice } from '../src/speech.js'
import { THINGS, THINGS_DIR, thingFiles, thingName } from '../src/things.js'
import { PLAYLISTS, MUSIC_DIR, VOLUMES, duckLevel } from '../src/music.js'
import { PLACE, TEMPS, weatherUrl, tempBand, sky, readWeather, weatherLines } from '../src/weather.js'

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
  const [circle, star] = ['circle', 'star'].map((label) => SHAPES.find((x) => x.label === label))
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

describe('count to 100', () => {
  it('names every number to 100 in both languages', () => {
    const en = [0, 7, 20, 21, 22, 30, 31, 47, 99, 100].map((n) => numberWord(n))
    expect(en).toEqual(['zero', 'seven', 'twenty', 'twenty-one', 'twenty-two', 'thirty', 'thirty-one', 'forty-seven', 'ninety-nine', 'one hundred'])
    const es = [0, 7, 20, 21, 22, 23, 26, 30, 31, 47, 99, 100].map((n) => numberWord(n, 'es'))
    expect(es).toEqual(['cero', 'siete', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veintiséis', 'treinta', 'treinta y uno', 'cuarenta y siete', 'noventa y nueve', 'cien'])
    for (let n = 0; n <= 100; n++) expect(numberWord(n) && numberWord(n, 'es'), String(n)).toBeTruthy()
  })
  it('counts by 1s, 5s or 10s, always to 100', () => {
    for (const [by, len] of [[1, 100], [5, 20], [10, 10]]) {
      const d = deck({ sets: ['hundred'], countBy: by })
      expect(d.length).toBe(len)
      expect(d[0]).toMatchObject({ kind: 'chart', n: by, by, say: String(by) })
      expect(d.at(-1)).toMatchObject({ n: 100, label: 'one hundred', es: 'cien' })
    }
    expect(deckKey({ ...DEFAULTS, countBy: 5 })).not.toBe(deckKey(DEFAULTS))
    expect(linkSettings('?' + linkQuery({ ...DEFAULTS, countBy: 10 })).countBy).toBe(10)
    expect(normalizeSettings({ countBy: 3 }).countBy).toBe(1)
  })
  it('still counts in order when the slides are mixed up', () => {
    const d = buildDeck({ ...DEFAULTS, sets: ['colors', 'shapes', 'hundred'], countBy: 10, order: 'shuffle' }, () => 0.42)
    const at = d.findIndex((x) => x.set === 'hundred')
    expect(d.slice(at, at + 10).map((x) => x.n)).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
    expect(d.length).toBe(10 + COLORS.length + SHAPES.length)
  })
  it('keeps one chart on screen through the count', () => {
    const d = deck({ sets: ['numbers', 'hundred'], numberFrom: 1, numberTo: 3, countBy: 10 })
    expect(runStart(d, 2)).toBe(2)
    expect(runStart(d, 3 + 9)).toBe(3)
    expect(GROUPS.find((g) => g.sets.includes('hundred')).emoji).toBe('💯')
  })
  it('plays the aquarium with the Good morning words', () => {
    expect(VIDEOS.find((v) => v.id === 'aquarium').words).toBe(ROUTINE.arrival)
  })
})

describe('our day', () => {
  it('puts every routine set in the Our day group, in order', () => {
    expect(GROUPS.find((g) => g.id === 'day').sets).toEqual(Object.keys(ROUTINE))
    for (const id in ROUTINE) expect(SETS.some((x) => x.id === id), id).toBe(true)
  })
  it('gives every word Spanish, an article that fits and an emoji', () => {
    for (const id in ROUTINE)
      for (const x of ROUTINE[id]) {
        expect(x.es, x.label).toBeTruthy()
        expect(['', 'el', 'la', 'los', 'las'], x.label).toContain(x.art)
        expect(x.emoji, x.label).toMatch(/\p{Extended_Pictographic}/u)
      }
  })
  it('writes no word in the child\'s gender, and uses only emoji most devices have', () => {
    // "o/a" follows the child (esGender); these words describe things, not the child.
    // A word slide has no picture behind its emoji, so nothing newer than Emoji 13 (2020).
    const newer = /[\u{1F7F0}\u{1F6DD}-\u{1F6DF}\u{1F979}\u{1F9CC}\u{1FAA9}-\u{1FAAF}\u{1FAB7}-\u{1FABF}\u{1FAC3}-\u{1FACF}\u{1FAD7}-\u{1FAFF}]/u
    for (const id in ROUTINE)
      for (const x of ROUTINE[id]) {
        expect(x.es, x.label).not.toMatch(/o\/a\b/)
        expect(x.emoji, x.label).not.toMatch(newer)
      }
  })
  it('draws a routine word as the still picture of its emoji, the emoji behind it', () => {
    const d = deck({ sets: ['packUp'] })
    expect(d.length).toBe(ROUTINE.packUp.length)
    expect(d[0]).toMatchObject({ kind: 'picture', word: true, label: 'jacket', emoji: '🧥', say: 'jacket', dir: 'words', code: '1f9e5' })
    expect(pictureSrc(d[0], false)).toBe('words/1f9e5.svg')
    expect(rowsText(labelRows(d[0], { words: 'both', articles: true }))).toBe('jacket / la chaqueta')
  })
  it('names a bookmark after the group', () => {
    expect(setupName({ ...DEFAULTS, sets: Object.keys(ROUTINE) })).toMatch(/^🏫 Our day/)
    expect(setupName({ ...DEFAULTS, sets: ['packUp'] })).toMatch(/^🏫 Going home/)
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
    for (const dir of ['feelings', 'people', 'words']) {
      const want = files.filter((f) => f.dir === dir).flatMap((f) => (f.still ? [`${f.code}.svg`] : [`${f.code}.avif`, `${f.code}.svg`]))
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
    expect(normalizeDay(Array.from({ length: 20 }, (_, i) => ({ at: `0${i % 10}:${10 + i}`, icon: '' })), '23:00').day.length).toBe(12)
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

describe('school day sets', () => {
  // The teacher's day (2026-11-18), shortened.
  const day = [
    { at: '07:50', icon: '🐠', sets: ['arrival'] },
    { at: '09:14', icon: '🚶', sets: ['lineUp'] },
    { at: '11:20', icon: '➕' },
    { at: '12:05', icon: '🍎', sets: ['requesting', 'senses'] }
  ]
  it('finds the part the clock is in, and nothing outside the day', () => {
    const at = (t) => partAt(day, '14:09', toMin(t))
    expect([at('07:49'), at('07:50'), at('09:13'), at('09:14'), at('12:30'), at('14:08'), at('14:09')]).toEqual([-1, 0, 0, 1, 3, 3, -1])
    // Mid-edit the parts can be out of order; the answer is still by time.
    expect(partAt([day[1], day[0]], '14:09', toMin('08:00'))).toBe(1)
  })
  it('says when a part ends, on a US clock', () => {
    expect(partEnd(day, '14:09', 1)).toBe('11:20')
    expect(partEnd(day, '14:09', 3)).toBe('14:09')
    expect(['07:50', '12:05', '14:09', '00:30'].map(clock12)).toEqual(['7:50', '12:05', '2:09', '12:30'])
  })
  it('keeps a part\'s known sets, in order, and only when it has some', () => {
    const t = normalizeDay([{ at: '09:00', icon: 'a', sets: ['senses', 'nope', 'letters'] }, { at: '10:00', icon: 'b', sets: [] }], '11:00')
    expect(t.day).toEqual([{ at: '09:00', icon: 'a', sets: ['letters', 'senses'] }, { at: '10:00', icon: 'b' }])
  })
  it('travels in a link and names the bookmark', () => {
    const s = { ...DEFAULTS, daySets: true, day, dayEnd: '14:09' }
    const back = linkSettings('?' + linkQuery(s))
    expect(back.daySets).toBe(true)
    expect(back.day).toEqual(day)
    expect(setupName(s)).toBe('🏫 School day · EN')
    expect(setupName({ ...s, day: [...day, { at: '13:00', icon: '🔤', sets: ['letters'] }] })).toBe('🏫🔤 School day · EN')
  })
  it('offers the options of every part\'s sets', () => {
    expect(setsInUse({ ...DEFAULTS, sets: ['colors'], daySets: true, day })).toEqual(['colors', 'arrival', 'lineUp', 'requesting', 'senses'])
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
  it('names a bookmark after its group and language', () => {
    const name = (sets, words = 'en') => setupName({ ...DEFAULTS, sets, words })
    expect(name(['adding', 'subtracting'], 'both')).toBe('➕ Math · EN+ES')
    expect(name(['adding'])).toBe('➕ Adding · EN')
    expect(name(['shapes', 'mixing'], 'es')).toBe('🎨 Shapes, Mixing colors · ES')
    expect(name(['letters', 'numbers', 'adding', 'subtracting'])).toBe('🔤➕ Letters & Numbers + Math · EN')
    expect(name(['feelings', 'body'])).toBe('😊 Feelings, Body · EN')
    expect(name(['letters', 'adding', 'opposites'])).toBe('🔤➕↔️ Mix · EN')
    expect(name(SETS.map((x) => x.id), 'both')).toBe('Looksee · All · EN+ES')
  })
  it('puts every set in exactly one group, in the order of SETS', () => {
    expect(GROUPS.flatMap((g) => g.sets)).toEqual(SETS.map((x) => x.id))
  })
})

describe('preset videos', () => {
  it('has a playable link, a title, a tile picture and words in both languages', () => {
    const ids = new Set()
    for (const v of VIDEOS) {
      expect(videoId(v.url), v.title).toMatch(/^[\w-]{11}$/)
      expect(v.title && v.emoji && v.id).toBeTruthy()
      ids.add(v.id)
      expect(v.words.length).toBeGreaterThan(3)
      for (const x of v.words) {
        expect(x.label && x.es && x.emoji, `${v.title}: ${x.label}`).toBeTruthy()
        expect(['', 'el', 'la', 'los', 'las']).toContain(x.art)
      }
    }
    expect(ids.size).toBe(VIDEOS.length)
  })
  it('shows a word in the language asked for, with el or la', () => {
    const dog = VIDEOS.find((v) => v.id === 'pawPenguins').words.find((x) => x.label === 'dog')
    expect(rowsText(labelRows(dog, { words: 'both', articles: true }))).toBe('dog / el perro')
  })
  it('spreads words evenly around the video', () => {
    for (let n = 0; n <= 16; n++) {
      const s = sides(n)
      const counts = Object.values(s)
      expect(counts.reduce((a, b) => a + b)).toBe(n)
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1)
      expect(s.top).toBeGreaterThanOrEqual(s.left)
    }
  })
})

describe('Spanish feelings: -o, -a or both', () => {
  it('shows the form asked for', () => {
    expect(genderForm('enojado/a', 'o')).toBe('enojado')
    expect(genderForm('enojado/a', 'a')).toBe('enojada')
    expect(genderForm('enojado/a', 'both')).toBe('enojado/a')
    expect(genderForm('feliz', 'a')).toBe('feliz')
  })
  it('applies to the words under a feeling, read at render time', () => {
    const angry = deck({ sets: ['feelings'] }).find((x) => x.label === 'angry')
    expect(rowsText(labelRows(angry, { words: 'es', esGender: 'a' }))).toBe('enojada')
    expect(rowsText(labelRows(angry, { words: 'both' }))).toBe('angry / enojado/a')
    expect(normalizeSettings({ esGender: 'a' }).esGender).toBe('a')
    expect(deckKey({ ...DEFAULTS, esGender: 'a' })).toBe(deckKey(DEFAULTS))
  })
})

describe('speech', () => {
  const say = (item, s) => speechLines(item, labelRows(item, { ...DEFAULTS, ...s }))
  const find = (sets, label) => deck({ sets }).find((x) => x.label === label || String(x.label) === label)
  it('says each language shown, in its own language', () => {
    expect(say(find(['shapes'], 'circle'), { words: 'both' })).toEqual([
      { lang: 'en', text: 'circle' },
      { lang: 'es', text: 'el círculo' }
    ])
  })
  it('reads letters, sums, mixes and pairs aloud as words', () => {
    expect(say(deck({ sets: ['letters'] })[0], { words: 'both' })).toEqual([
      { lang: 'en', text: 'A. airplane' },
      { lang: 'es', text: 'el avión' }
    ])
    expect(say(sumSlide('+', 2, 3), { words: 'es' })).toEqual([{ lang: 'es', text: 'dos más tres son cinco' }])
    expect(say(colorMix(['red', 'yellow', 'orange']), { words: 'both' }).map((l) => l.text)).toEqual([
      'red plus yellow equals orange',
      'rojo más amarillo es igual a anaranjado'
    ])
    expect(say(find(['opposites'], 'big,small'))[0].text).toBe('big, small')
  })
  it('says both forms of a feeling when both are shown, else the one shown', () => {
    const angry = find(['feelings'], 'angry')
    expect(say(angry, { words: 'es' })[0].text).toBe('enojado, enojada')
    expect(say(angry, { words: 'es', esGender: 'a' })[0].text).toBe('enojada')
  })
  it('says the slide name when no words are shown', () => {
    expect(say(deck({ sets: ['letters'] })[1], { letterWords: false })).toEqual([{ lang: 'en', text: 'B' }])
  })
  it("uses only the device's own voices, US English and US Spanish first", () => {
    const v = (name, lang, localService) => ({ name, lang, localService })
    const all = [v('Google español', 'es-US', false), v('Mónica', 'es-ES', true), v('Paulina', 'es-MX', true), v('Samantha', 'en-US', true)]
    expect(pickVoice(all, 'es').name).toBe('Paulina')
    expect(pickVoice(all, 'en').name).toBe('Samantha')
    expect(pickVoice([v('Google US English', 'en-US', false)], 'en')).toBe(null)
    expect(pickVoice([v('Mónica', 'es_ES', true)], 'es').name).toBe('Mónica')
  })
})

describe('for a classroom', () => {
  it('shows the picture as big as fits, and opens Settings on the left, unless told otherwise', () => {
    expect(DEFAULTS).toMatchObject({ size: 'full', drawerSide: 'left' })
    expect(normalizeSettings({ size: 'medium', drawerSide: 'right' })).toMatchObject({ size: 'medium', drawerSide: 'right' })
    expect(normalizeSettings({ drawerSide: 'top' }).drawerSide).toBe('left')
    // A link says only what differs from the defaults, so old bookmarks get both.
    expect(linkQuery(DEFAULTS)).toBe('v=1')
    expect(linkSettings('?v=1&sets=shapes')).toMatchObject({ size: 'full', drawerSide: 'left' })
    expect(linkSettings('?v=1&drawerSide=right&size=large')).toMatchObject({ size: 'large', drawerSide: 'right' })
  })
  it('moves a device still on the old default size to the new one, once', () => {
    expect(upgrade({ size: 'medium', words: 'es' })).toEqual({ size: 'full', words: 'es' })
    expect(upgrade({ size: 'medium', sized: 1 }).size).toBe('medium')
    expect(upgrade({ size: 'small' }).size).toBe('small')
    expect(upgrade(null)).toBe(null)
  })
})

// The Things sets come with no pictures: the ones they were made for are from
// the Thiings library, which may not be redistributed, so they are never in
// the repo. Each device is given its own copies (local.js).
describe('things', () => {
  const at = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url))
  it('is four groups of sets, each set a run of single still pictures', () => {
    expect(GROUPS.filter((g) => g.own).map((g) => g.id)).toEqual(['animals', 'food', 'things', 'places'])
    expect(GROUPS.filter((g) => g.own).flatMap((g) => g.sets)).toEqual(Object.keys(THINGS))
    for (const id of Object.keys(THINGS)) {
      const d = deck({ sets: [id] })
      expect(d.map((x) => x.label), id).toEqual(THINGS[id].map((x) => x.label))
      for (const x of d) expect(x).toMatchObject({ kind: 'picture', set: id, dir: THINGS_DIR, one: true })
    }
    const dog = deck({ sets: ['animals'] })[0]
    expect(pictureSrc(dog, false)).toBe('things/dog.avif')
    // There is no separate still picture: reduced motion asks for the same file.
    expect(pictureSrc(dog, true)).toBe('things/dog.avif')
    expect(rowsText(labelRows(dog, { words: 'both', articles: true }))).toBe('dog / el perro')
  })
  it('gives every thing two words, an article and a file of its own', () => {
    const all = thingFiles()
    for (const x of all) {
      expect(x.label && x.es, x.label).toBeTruthy()
      expect(['el', 'la', 'los', 'las'], x.label).toContain(x.art)
      expect(x.file, x.label).toMatch(/^[a-z]+(-[a-z]+)*$/)
    }
    expect(new Set(all.map((x) => x.file)).size).toBe(all.length)
    expect(new Set(all.map((x) => x.from)).size).toBe(all.length)
  })
  it('keeps the pictures out of the repo and out of what is stored offline', () => {
    expect(readFileSync(at('.gitignore'), 'utf8').split('\n')).toContain(`public/${THINGS_DIR}/`)
    expect(readFileSync(at('vite.config.js'), 'utf8')).toContain(`globIgnores: ['${THINGS_DIR}/**', 'music/**'`)
    // None of them is one of the pictures the app ships and credits.
    expect(pictureFiles().some((f) => f.dir === THINGS_DIR)).toBe(false)
  })
  it('knows which thing a picture file is for, by its name', () => {
    expect(thingName('dog.avif')).toBe('dog')
    expect(thingName('Fire Truck.PNG')).toBe('fire-truck')
    expect(thingName('teddy_bear.webp')).toBe('teddy-bear')
    expect(thingName('things/horse-domestic.png')).toBe('horse') // the library's own name
    expect(thingName('holiday.png')).toBe(null)
    expect(thingName('dog.txt')).toBe(null)
    expect(thingName('dog')).toBe(null)
    for (const x of thingFiles()) expect(thingName(`${x.file}.avif`), x.label).toBe(x.file)
  })
  // `npm run things` makes what is missing and removes what is left over.
  // On a computer without the library there is no folder, and nothing to check.
  it('has exactly the pictures the sets ask for, where they have been copied', () => {
    const dir = at(`public/${THINGS_DIR}/`)
    if (!existsSync(dir)) return
    const have = readdirSync(dir).filter((n) => !n.startsWith('.'))
    expect(have.sort()).toEqual(thingFiles().map((x) => `${x.file}.avif`).sort())
  })
})

describe('a plan: sets in timed blocks', () => {
  const plan = [
    { sets: ['letters', 'numbers'], min: 10 },
    { sets: ['adding'], min: 15 },
    { sets: ['feelings'], min: 5 }
  ]
  it('is off and empty for a new visitor, and adds nothing to a link', () => {
    expect(DEFAULTS.planOn).toBe(false)
    expect(DEFAULTS.plan).toEqual([])
    expect(linkQuery(DEFAULTS)).toBe('v=1')
  })
  it('offers blocks of 5 to 25 minutes', () => {
    expect(MINUTES).toEqual([5, 10, 15, 20, 25])
  })
  it('keeps only blocks that can be played', () => {
    const raw = [{ sets: ['numbers', 'letters', 'nope'], min: 15 }, { sets: [], min: 5 }, { sets: ['feelings'], min: 7 }, 'x', null]
    expect(normalizePlan(raw)).toEqual([{ sets: ['letters', 'numbers'], min: 15 }, { sets: ['feelings'], min: 10 }])
    expect(normalizePlan('x')).toEqual([])
    expect(normalizePlan(Array(20).fill({ sets: ['letters'], min: 5 }))).toHaveLength(PLAN_MAX)
    // Editing one device's plan must never edit the defaults.
    normalizeSettings({}).plan.push(plan[0])
    expect(DEFAULTS.plan).toEqual([])
    expect(normalizeSettings({ planOn: true, plan }).plan).toEqual(plan)
  })
  it('counts a block down in minutes of playing', () => {
    expect(minutesLeft(10, 0)).toBe(10)
    expect(minutesLeft(10, 60000)).toBe(9)
    expect(minutesLeft(10, 9.5 * 60000)).toBe(1)
    expect(minutesLeft(10, 11 * 60000)).toBe(0)
    expect(blockDone(10, 10 * 60000 - 1)).toBe(false)
    expect(blockDone(10, 10 * 60000)).toBe(true)
  })
  it('goes from block to block, and starts over or stops after the last', () => {
    expect(blockAfter(plan, 0, true)).toBe(1)
    expect(blockAfter(plan, 2, true)).toBe(0)
    expect(blockAfter(plan, 2, false)).toBe(-1)
    expect(blockAfter([plan[0]], 0, true)).toBe(0)
  })
  it('travels in a settings link, readable in the address bar', () => {
    const q = linkQuery({ ...DEFAULTS, planOn: true, plan })
    expect(q).toBe('v=1&planOn=1&plan=letters.numbers-10_adding-15_feelings-5')
    const back = linkSettings('?' + q)
    expect(back.planOn).toBe(true)
    expect(back.plan).toEqual(plan)
    expect(linkSettings('?v=1&plan=nope-10_letters-99').plan).toEqual([{ sets: ['letters'], min: 10 }])
    expect(linkSettings('?v=1&plan=').plan).toEqual([])
  })
  it('knows which sets are in use, so Settings offers only the options that apply', () => {
    expect(setsInUse({ ...DEFAULTS, sets: ['colors'] })).toEqual(['colors'])
    expect(setsInUse({ ...DEFAULTS, sets: ['colors'], planOn: true, plan })).toEqual(['letters', 'numbers', 'adding', 'feelings'])
    // A plan that is off, or has no blocks, does not count.
    expect(setsInUse({ ...DEFAULTS, sets: ['colors'], plan })).toEqual(['colors'])
    expect(setsInUse({ ...DEFAULTS, sets: ['colors'], planOn: true })).toEqual(['colors'])
  })
  it('is not a deck key: a block plays by lending the deck its sets', () => {
    expect(deckKey({ ...DEFAULTS, planOn: true, plan })).toBe(deckKey(DEFAULTS))
    expect(deckKey({ ...DEFAULTS, sets: plan[1].sets })).not.toBe(deckKey(DEFAULTS))
  })
  it('names a block by its sets', () => {
    expect(setsName(['letters', 'numbers'])).toBe('🔤 Letters & Numbers')
    expect(setsName(['adding'])).toBe('➕ Adding')
    expect(setsName(SETS.map((x) => x.id))).toBe('All')
    expect(setsName([])).toBe('')
  })
  it('names a bookmark after the groups it plays, in order, and its length', () => {
    expect(setupName({ ...DEFAULTS, planOn: true, plan })).toBe('🔤➕😊 Plan, 30 min · EN')
    expect(setupName({ ...DEFAULTS, planOn: true, plan: [plan[2], plan[0]], words: 'both' })).toBe('😊🔤 Plan, 15 min · EN+ES')
    // A plan that is switched off, or has no blocks, is named after the sets as before.
    expect(setupName({ ...DEFAULTS, plan, sets: ['adding', 'subtracting'] })).toBe('➕ Math · EN')
    expect(setupName({ ...DEFAULTS, planOn: true, sets: ['adding', 'subtracting'] })).toBe('➕ Math · EN')
  })
})

describe('a timer', () => {
  const MIN = 60000
  const T0 = 1_700_000_000_000
  const fresh = normalizeTimer(null, T0)
  it('is idle for a new visitor, at five minutes, with the chime on, drawn as a small disc with its numbers', () => {
    expect(fresh).toEqual({ last: 5, chime: true, face: 'disc', big: false, nums: true, total: 0, endsAt: 0, left: 0 })
    expect(timerState(fresh, T0)).toBe('idle')
    expect(remaining(fresh, T0)).toBe(0)
    expect(PRESETS).toEqual([1, 3, 5, 10, 15])
  })
  it('starts, and remembers the minutes for next time', () => {
    const t = startTimer(fresh, 3, T0)
    expect(t.endsAt).toBe(T0 + 3 * MIN)
    expect(t.last).toBe(3)
    expect(timerState(t, T0)).toBe('running')
    expect(remaining(t, T0 + MIN)).toBe(2 * MIN)
    expect(share(t, T0)).toBe(1)
    expect(share(t, T0 + 1.5 * MIN)).toBe(0.5)
    // Between 1 and 60 whole minutes, whatever is asked for.
    expect(startTimer(fresh, 0, T0).last).toBe(1)
    expect(startTimer(fresh, 500, T0).last).toBe(60)
  })
  it('is the moment it ends, so time that passed in the background has passed', () => {
    const t = startTimer(fresh, 5, T0)
    expect(remaining(t, T0 + 4 * MIN + 59000)).toBe(1000)
    expect(timerState(t, T0 + 5 * MIN - 1)).toBe('running')
    expect(timerState(t, T0 + 5 * MIN)).toBe('done')
    expect(remaining(t, T0 + 99 * MIN)).toBe(0)
  })
  it('pauses and goes on from where it was', () => {
    const p = pauseTimer(startTimer(fresh, 5, T0), T0 + 2 * MIN)
    expect(timerState(p, T0 + 50 * MIN)).toBe('paused')
    expect(remaining(p, T0 + 50 * MIN)).toBe(3 * MIN)
    const r = resumeTimer(p, T0 + 50 * MIN)
    expect(timerState(r, T0 + 50 * MIN)).toBe('running')
    expect(r.endsAt).toBe(T0 + 53 * MIN)
    // Pausing an idle or ended timer, or resuming a running one, changes nothing.
    expect(pauseTimer(fresh, T0)).toBe(fresh)
    expect(resumeTimer(r, T0)).toBe(r)
  })
  it('takes more time while running, paused or after the end', () => {
    const t = startTimer(fresh, 1, T0)
    expect(remaining(addTime(t, MIN, T0 + 30000), T0 + 30000)).toBe(1.5 * MIN)
    const p = addTime(pauseTimer(t, T0 + 30000), MIN, T0 + 40000)
    expect(timerState(p, T0 + 40000)).toBe('paused')
    expect(remaining(p, T0 + 40000)).toBe(1.5 * MIN)
    const again = addTime(t, 2 * MIN, T0 + 10 * MIN)
    expect(timerState(again, T0 + 10 * MIN)).toBe('running')
    expect(remaining(again, T0 + 10 * MIN)).toBe(2 * MIN)
    expect(share(again, T0 + 10 * MIN)).toBe(1)
    expect(addTime(fresh, MIN, T0)).toBe(fresh)
    // Never more than 99 minutes, and the ring never shows more than full.
    let long = startTimer(fresh, 60, T0)
    for (let i = 0; i < 80; i++) long = addTime(long, MIN, T0)
    expect(remaining(long, T0)).toBe(99 * MIN)
    expect(share(long, T0)).toBeLessThanOrEqual(1)
  })
  it('ends, keeping the minutes, the chime choice and how it is drawn', () => {
    expect(endTimer({ ...startTimer(fresh, 10, T0), chime: false })).toEqual({ ...fresh, last: 10, chime: false })
    expect(endTimer({ ...startTimer(fresh, 10, T0), face: 'glass', big: true, nums: false })).toEqual({ ...fresh, last: 10, face: 'glass', big: true, nums: false })
  })
  it('keeps how it is drawn through a reload, and drops a face it does not know', () => {
    const drawn = normalizeTimer({ face: 'dots', big: true, nums: false }, T0)
    expect(drawn).toMatchObject({ face: 'dots', big: true, nums: false })
    expect(normalizeTimer(JSON.parse(JSON.stringify(startTimer(drawn, 3, T0))), T0 + MIN)).toMatchObject({ face: 'dots', big: true, nums: false })
    expect(normalizeTimer({ face: 'sundial', big: 'yes', nums: 0 }, T0)).toMatchObject({ face: 'disc', big: false, nums: true })
    expect(FACES).toEqual(['disc', 'bar', 'dots', 'glass'])
  })
  it('draws the time left as a disc that closes, clockwise from twelve', () => {
    expect(faceFill('disc', 1, 5)).toBe(faceTrack('disc', 5))
    expect(faceFill('disc', 0.75, 5)).toBe('M50,50V5A45,45 0 1,1 5,50z')
    expect(faceFill('disc', 0.5, 5)).toBe('M50,50V5A45,45 0 0,1 50,95z')
    expect(faceFill('disc', 0.25, 5)).toBe('M50,50V5A45,45 0 0,1 95,50z')
    expect(faceFill('disc', 0, 5)).toBe('M50,50V5A45,45 0 0,1 50,5z')
  })
  it('draws it as a bar that empties from the right', () => {
    expect(faceTrack('bar', 5)).toBe('M5,35h90v30h-90z')
    expect(faceFill('bar', 1, 5)).toBe('M5,35h90v30h-90z')
    expect(faceFill('bar', 0.5, 5)).toBe('M5,35h45v30h-45z')
    expect(faceFill('bar', 0, 5)).toBe('M5,35h0v30h0z')
    // Never more than full or less than empty, whatever it is handed.
    expect(faceFill('bar', 7, 5)).toBe(faceFill('bar', 1, 5))
    expect(faceFill('bar', -1, 5)).toBe(faceFill('bar', 0, 5))
  })
  it('draws it as a dot for each minute, one going out as its minute ends', () => {
    const count = (d) => d.split('M').length - 1
    expect(count(faceTrack('dots', 10))).toBe(10)
    expect(count(faceFill('dots', 1, 10))).toBe(10)
    expect(count(faceFill('dots', 0.95, 10))).toBe(10)
    expect(count(faceFill('dots', 0.9, 10))).toBe(9)
    expect(count(faceFill('dots', 0.01, 10))).toBe(1)
    expect(faceFill('dots', 0, 10)).toBe('')
    // The dots that are lit are the first of the dots that are drawn.
    expect(faceTrack('dots', 10).startsWith(faceFill('dots', 0.3, 10))).toBe(true)
    // Any length fits in the box: 1 minute to 99.
    for (const n of [1, 3, 5, 6, 15, 20, 21, 60, 99]) {
      const d = faceTrack('dots', n)
      expect(count(d), n).toBe(n)
      for (const [, x, y] of d.matchAll(/M([\d.]+),([\d.]+)/g)) {
        expect(+x >= 0 && +x <= 100 && +y >= 0 && +y <= 100, `${n}: ${x},${y}`).toBe(true)
      }
    }
  })
  it('draws it as an hourglass whose sand is the time: half the time, half the sand', () => {
    // The area of a path made of straight lines, one closed piece at a time.
    const area = (d) =>
      d.split('z').filter(Boolean).reduce((sum, piece) => {
        const pts = []
        let x = 0, y = 0
        for (const [, c, a, b] of piece.matchAll(/([MLh])(-?[\d.]+)(?:,(-?[\d.]+))?/g)) {
          if (c === 'h') x += +a
          else [x, y] = [+a, +b]
          pts.push([x, y])
        }
        return sum + Math.abs(pts.reduce((s, [px, py], i) => s + px * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * py, 0)) / 2
      }, 0)
    const bulb = (38 * 2 * 42) / 2
    const [top, bottom] = [0, 1].map((i) => (d) => area(d.split('z')[i] + 'z'))
    expect(top(faceFill('glass', 1, 5))).toBeCloseTo(bulb, 0)
    expect(bottom(faceFill('glass', 1, 5))).toBeCloseTo(0, 0)
    expect(top(faceFill('glass', 0, 5))).toBeCloseTo(0, 0)
    expect(bottom(faceFill('glass', 0, 5))).toBeCloseTo(bulb, 0)
    for (const p of [0.25, 0.5, 0.75]) {
      expect(top(faceFill('glass', p, 5)) / bulb, `top at ${p}`).toBeCloseTo(p, 1)
      expect(bottom(faceFill('glass', p, 5)) / bulb, `bottom at ${p}`).toBeCloseTo(1 - p, 1)
    }
  })
  it('comes back after a reload: running, paused, or ended while away', () => {
    const back = (t, now) => normalizeTimer(JSON.parse(JSON.stringify(t)), now)
    const t = startTimer(fresh, 5, T0)
    expect(back(t, T0 + MIN)).toEqual(t)
    expect(timerState(back(t, T0 + 60 * MIN), T0 + 60 * MIN)).toBe('done')
    const p = pauseTimer(t, T0 + MIN)
    expect(back(p, T0 + 9 * MIN)).toEqual(p)
  })
  it('drops stored state that makes no sense', () => {
    for (const raw of ['x', 7, [], { endsAt: 'soon' }, { total: -5, endsAt: T0 + MIN }, { total: MIN, endsAt: T0 + 9 * MIN }, { total: MIN, left: NaN }]) {
      expect(timerState(normalizeTimer(raw, T0), T0)).toBe('idle')
    }
    expect(normalizeTimer({ last: 'many', chime: false }, T0)).toEqual({ ...fresh, chime: false })
    expect(remaining(normalizeTimer({ total: MIN, left: 5 * MIN }, T0), T0)).toBe(MIN)
  })
  it('reads as minutes and seconds, 0:00 only when the time is up', () => {
    expect(clockText(5 * MIN)).toBe('5:00')
    expect(clockText(4 * MIN + 31001)).toBe('4:32')
    expect(clockText(1)).toBe('0:01')
    expect(clockText(0)).toBe('0:00')
    expect(clockText(99 * MIN)).toBe('99:00')
  })
  it('announces one minute, ten seconds and the end, and nothing else', () => {
    expect(milestone(60250, 60000)).toBe('minute')
    expect(milestone(60000, 59750)).toBe(null)
    expect(milestone(10100, 9900)).toBe('ten')
    expect(milestone(200, 0)).toBe('done')
    expect(milestone(0, 0)).toBe(null)
    expect(milestone(5 * MIN, 5 * MIN - 250)).toBe(null)
    // A tab that slept through all three says only the last.
    expect(milestone(3 * MIN, 0)).toBe('done')
  })
  it('is not a setting: it is in no link and no bookmark name', () => {
    expect(Object.keys(DEFAULTS).filter((k) => /timer|chime/i.test(k))).toEqual([])
  })
})

// The weather is the one thing besides YouTube that Looksee asks of an
// outside service, so it is off unless a teacher turns it on.
describe('weather', () => {
  it('is off for a new visitor, travels in a link, and is not part of the deck', () => {
    expect(DEFAULTS.weather).toBe(false)
    expect(linkQuery({ ...DEFAULTS, weather: true })).toBe('v=1&weather=1')
    expect(linkSettings('?v=1&weather=1').weather).toBe(true)
    expect(normalizeSettings({ weather: 'yes' }).weather).toBe(false)
    expect(deckKey({ ...DEFAULTS, weather: true })).toBe(deckKey(DEFAULTS))
  })
  it('asks Open-Meteo about the place and nothing else', () => {
    const u = new URL(weatherUrl())
    expect(u.origin).toBe('https://api.open-meteo.com')
    expect(Object.fromEntries(u.searchParams)).toEqual({
      latitude: String(PLACE.lat),
      longitude: String(PLACE.lon),
      current: 'temperature_2m,weather_code,is_day',
      temperature_unit: 'fahrenheit'
    })
  })
  it('is asked only by outside.js, and is never stored for offline use', () => {
    const src = (f) => readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8')
    for (const f of readdirSync(new URL('../src', import.meta.url))) {
      if (f !== 'outside.js') expect(src(f), f).not.toMatch(/\bfetch\(/)
    }
    expect(src('outside.js')).toMatch(/credentials: 'omit'/)
    expect(readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8')).not.toMatch(/runtimeCaching|open-meteo/)
  })
  it('names how it feels, coldest to hottest', () => {
    expect(TEMPS.map((t) => t.label)).toEqual(['freezing', 'cold', 'cool', 'warm', 'hot'])
    expect([-20, 31, 32, 49, 50, 64, 65, 79, 80, 104].map(tempBand)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4])
    for (const t of TEMPS) expect(t.es, t.label).toBeTruthy()
  })
  it('gives every theme a different color for each band', () => {
    for (const [name, t] of Object.entries(THEMES)) {
      expect(t.heat.length, name).toBe(TEMPS.length)
      expect(new Set(t.heat).size, name).toBe(TEMPS.length)
      for (const i of t.heat) expect(t.colors[i], name).toBeTruthy()
    }
  })
  it('has a picture and both words for every weather code', () => {
    for (let code = 0; code <= 99; code++) {
      const x = sky(code)
      expect(x.emoji && x.label && x.es, `code ${code}`).toBeTruthy()
    }
    expect([0, 2, 3, 45, 55, 63, 73, 81, 86, 95].map((c) => sky(c).label)).toEqual(
      ['sunny', 'partly cloudy', 'cloudy', 'foggy', 'drizzly', 'rainy', 'snowy', 'rainy', 'snowy', 'stormy']
    )
    expect(sky(0, false)).toMatchObject({ emoji: '🌙', label: 'clear' })
    expect(sky(3, false).label).toBe('cloudy')
  })
  it('reads an answer, and refuses one with no temperature', () => {
    const w = readWeather({ current: { temperature_2m: 41.6, weather_code: 3, is_day: 1 } })
    expect(w).toMatchObject({ temp: 42, band: 1, sky: { label: 'cloudy' } })
    expect(readWeather({ current: { temperature_2m: 70, weather_code: 0, is_day: 0 } }).sky.label).toBe('clear')
    expect(readWeather({ current: { temperature_2m: 70 } }).sky.label).toBe('cloudy')
    for (const bad of [null, {}, { current: {} }, { current: { temperature_2m: '42' } }, { error: true }]) expect(readWeather(bad)).toBeNull()
  })
  it('says it in the languages shown', () => {
    const w = readWeather({ current: { temperature_2m: 42, weather_code: 3, is_day: 1 } })
    expect(weatherLines(w, ['en', 'es'])).toEqual([
      { lang: 'en', text: '42 degrees. cold. cloudy.' },
      { lang: 'es', text: '42 grados. frío. nublado.' }
    ])
    const cold = readWeather({ current: { temperature_2m: -1, weather_code: 71, is_day: 1 } })
    expect(weatherLines(cold, ['en'])[0].text).toBe('minus 1 degree. freezing. snowy.')
    expect(weatherLines(cold, ['es'])[0].text).toBe('menos 1 grado. helado. con nieve.')
  })
})

// Background music: quiet playlists in public/music/, all free to publish,
// off for a new visitor and never stored for offline use unless saved.
describe('music', () => {
  const at = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url))
  it('has exactly the files its playlists play, each with a title and a credit', () => {
    const files = PLAYLISTS.flatMap((p) => p.tracks.map((t) => `${t.file}.m4a`))
    expect(new Set(files).size).toBe(files.length)
    expect(readdirSync(at(`public/${MUSIC_DIR}/`)).filter((n) => !n.startsWith('.')).sort()).toEqual([...files].sort())
    for (const p of PLAYLISTS) {
      expect(p.credit, p.id).toMatch(/CC0|public domain/i)
      for (const t of p.tracks) expect(t.title, t.file).toBeTruthy()
    }
    expect(readFileSync(at('public/NOTICE.txt'), 'utf8')).toMatch(/music/i)
  })
  it('credits every recording it did not make, by file, with its source', () => {
    const notice = readFileSync(at('public/NOTICE.txt'), 'utf8')
    for (const p of PLAYLISTS.filter((p) => !/made for Looksee/.test(p.credit)))
      for (const t of p.tracks) expect(notice, t.file).toMatch(new RegExp(`- ${t.file}\\.m4a: [^]*?https://commons\\.wikimedia\\.org/`))
  })
  it('never splits a title on a comma', () => {
    for (const p of PLAYLISTS) for (const t of p.tracks) expect(t.file, t.title).toMatch(/^[a-z0-9-]+$/)
  })
  it('is off for a new visitor, soft, and kept out of the offline store', () => {
    expect(DEFAULTS.music).toBe(false)
    expect(DEFAULTS.musicVol).toBe('soft')
    expect(readFileSync(at('vite.config.js'), 'utf8')).toContain("'music/**'")
  })
  it('gives way: silent under a video, a third for speech or the chime', () => {
    const v = VOLUMES.soft
    expect(duckLevel(v, new Set())).toBe(v)
    expect(duckLevel(v, new Set(['speak']))).toBeCloseTo(v * 0.3)
    expect(duckLevel(v, new Set(['chime', 'speak']))).toBeCloseTo(v * 0.3)
    expect(duckLevel(v, new Set(['video', 'speak']))).toBe(0)
  })
})

// public/where-is-it/: a page of picture drafts to show people (made by
// art/where-is-it/cutout.mjs). It is published with the site but is not part
// of the app.
describe('where-is-it drafts page', () => {
  const at = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url))
  it('is never stored offline or answered with the app', () => {
    const config = readFileSync(at('vite.config.js'), 'utf8')
    expect(config).toContain("'where-is-it/**'")
    expect(config).toContain('navigateFallbackDenylist: [/\\/where-is-it\\//]')
  })
  it('asks not to be indexed, and every picture it shows is there', () => {
    const html = readFileSync(at('public/where-is-it/index.html'), 'utf8')
    expect(html).toContain('<meta name="robots" content="noindex">')
    const srcs = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1])
    expect(srcs.length).toBeGreaterThan(0)
    for (const src of srcs) expect(existsSync(at(`public/where-is-it/${src}`)), src).toBe(true)
  })
})
