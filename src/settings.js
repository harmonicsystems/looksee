// Looksee settings: every option, its allowed values, and the stage
// themes. normalizeSettings() makes anything read from storage safe to use.
import { SETS, TONES, namesSets } from './concepts.js'
import { normalizeDay } from './day.js'

// Stage themes. `colors` are what letters, numbers and shapes are drawn in;
// tests/look.test.js holds each to 3:1 against `bg` (large graphics) and
// `ink` to 4.5:1.
export const THEMES = {
  calm: {
    label: 'Calm',
    bg: '#f4efe6', bg2: '#fbf8f2', ink: '#2c2a26', dot: '#e3dccf',
    colors: ['#a8452f', '#8a5a0c', '#3f7a3a', '#1f7a80', '#39689e', '#75559c']
  },
  bright: {
    label: 'Bright',
    bg: '#ffffff', bg2: '#f1f6ff', ink: '#14181f', dot: '#e3e8f0',
    colors: ['#d62839', '#c75100', '#1b8a3e', '#0b7f96', '#1f6fd6', '#8a3fd0']
  },
  night: {
    label: 'Night',
    bg: '#101820', bg2: '#1a2733', ink: '#f0ede6', dot: '#1d2a36',
    colors: ['#ff8a7a', '#ffc857', '#7bd88f', '#5fd3d8', '#7cc0ff', '#c9a3ff']
  },
  contrast: {
    label: 'High contrast',
    bg: '#000000', bg2: '#000000', ink: '#ffffff', dot: '#2a2a2a',
    colors: ['#ffffff', '#ffe600', '#00e5ff', '#7dff6a', '#ff9d5c', '#ff8ad8']
  }
}

export const OPTIONS = {
  order: ['inOrder', 'shuffle'],
  letterCase: ['upper', 'lower', 'both'],
  numberStyle: ['digit', 'dots', 'both'],
  mathTo: [5, 10],
  feelingMotion: ['moving', 'still'],
  words: ['en', 'es', 'both'],
  skin: ['mixed', ...TONES],
  theme: Object.keys(THEMES),
  background: ['plain', 'glow', 'dots'],
  fill: ['solid', 'outline', 'soft'],
  colorMode: ['rainbow', 'one'],
  size: ['small', 'medium', 'large'],
  entrance: ['none', 'fade', 'grow', 'slide'],
  idle: ['still', 'float', 'breathe'],
  font: ['atkinson', 'rounded', 'serif'],
  corner: ['tl', 'tr', 'bl', 'br'],
  videoSize: ['small', 'medium', 'large']
}

export const DEFAULTS = {
  sets: ['letters', 'numbers', 'adding', 'subtracting', 'shapes', 'colors', 'colorShapes', 'mixing', 'feelings', 'gestures', 'body'],
  order: 'inOrder',
  loop: true,
  seconds: 4,
  letterCase: 'both',
  numberFrom: 1,
  numberTo: 10,
  numberStyle: 'both',
  mathTo: 5,
  feelingMotion: 'moving',
  words: 'en',
  letterWords: true,
  articles: true,
  firstLetter: true,
  setNames: true,
  wordDelay: 0,
  morph: true,
  skin: 'mixed',
  dayBar: true,
  ...normalizeDay(),
  theme: 'calm',
  background: 'plain',
  fill: 'solid',
  colorMode: 'rainbow',
  size: 'medium',
  entrance: 'fade',
  idle: 'still',
  font: 'atkinson',
  showLabel: true,
  showProgress: true,
  videoUrl: '',
  corner: 'br',
  videoSize: 'medium',
  videoMuted: false
}

const int = (v, lo, hi, d) => {
  const n = Math.round(Number(v))
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d
}

export function normalizeSettings(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  const s = { ...DEFAULTS }
  for (const k of Object.keys(OPTIONS)) if (OPTIONS[k].includes(r[k])) s[k] = r[k]
  for (const k of ['loop', 'showLabel', 'showProgress', 'videoMuted', 'dayBar', 'letterWords', 'articles', 'firstLetter', 'setNames', 'morph']) if (typeof r[k] === 'boolean') s[k] = r[k]
  // Fresh arrays every time, so editing settings never edits DEFAULTS.
  s.sets = [...s.sets]
  if (Array.isArray(r.sets)) {
    const ids = SETS.map((x) => x.id).filter((id) => r.sets.includes(id))
    if (ids.length) s.sets = ids
  }
  Object.assign(s, normalizeDay(r.day, r.dayEnd))
  s.seconds = int(r.seconds, 1, 30, DEFAULTS.seconds)
  s.wordDelay = int(r.wordDelay, 0, 5, DEFAULTS.wordDelay)
  s.numberFrom = int(r.numberFrom, 0, 20, DEFAULTS.numberFrom)
  s.numberTo = int(r.numberTo, 0, 20, DEFAULTS.numberTo)
  if (s.numberTo < s.numberFrom) s.numberTo = s.numberFrom
  if (typeof r.videoUrl === 'string') s.videoUrl = r.videoUrl.trim().slice(0, 300)
  return s
}

const KEY = 'look-settings-v1'

export function loadSettings() {
  try {
    return normalizeSettings(JSON.parse(localStorage.getItem(KEY)))
  } catch {
    return normalizeSettings(null)
  }
}

export function saveSettings(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {}
}

// The settings that change which slides there are. Look-only settings must
// not restart or reshuffle a running deck, so they are not here.
export const DECK_KEYS = ['sets', 'order', 'letterCase', 'numberFrom', 'numberTo', 'mathTo', 'skin']

// Changes exactly when the deck has to be built again. Set names count only
// when they would actually appear (see namesSets).
export const deckKey = (s) => JSON.stringify([...DECK_KEYS.map((k) => s[k]), namesSets(s)])

// How long the word really waits after the picture: what was asked for, but
// it always gets the last second of the slide.
export const wordWait = (s) => Math.min(s.wordDelay, Math.max(0, s.seconds - 1))
