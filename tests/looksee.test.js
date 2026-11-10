import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildDeck, dotLayout, shuffle, emojiCode, pictureSrc, pictureFiles, SHAPES, COLORS, OPPOSITES, FEELINGS, GESTURES, BODY, TONES } from '../src/concepts.js'
import { DEFAULTS, THEMES, normalizeSettings } from '../src/settings.js'
import { toMin, normalizeDay, daySegments, DAY_DEFAULT } from '../src/day.js'
import { videoId, toSeconds, startSeconds } from '../src/link.js'

const deck = (over) => buildDeck({ ...DEFAULTS, ...over }, () => 0.42)

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
