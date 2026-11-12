// What to say for a slide, and which voice says it. Pure: speak.js does the
// speaking. Lines follow the words shown (English, Spanish or both), so what
// a child hears matches what they see.

const SPOKEN = {
  en: [[/\s*\+\s*/g, ' plus '], [/\s*=\s*/g, ' equals ']],
  es: [[/\s*\+\s*/g, ' más '], [/\s*=\s*/g, ' es igual a ']]
}

// "enojado/a" can't be read aloud: it is said as both words.
const spoken = (text, lang) => {
  let t = text.replace(/(\p{L}+)o\/a\b/gu, '$1o, $1a')
  for (const [from, to] of SPOKEN[lang]) t = t.replace(from, to)
  return t
}

// One line per row of words shown: [{ lang, text }]. A letter slide's English
// line starts with the letter itself; a slide with no words shown says its name.
export function speechLines(item, rows) {
  if (!rows.length) return item.say ? [{ lang: 'en', text: item.say }] : []
  return rows.map((r) => {
    let text = spoken((r.art ? r.art + ' ' : '') + r.words.join(', '), r.lang)
    if (item.kind === 'glyph' && r.lang === 'en') text = `${item.say}. ${text}`
    return { lang: r.lang, text }
  })
}

// The device's own voice for a language, never an online one: online voices
// send the text away to be spoken, and nothing may leave the device. Prefers
// US English, then US or Mexican Spanish.
const PREFER = { en: ['en-US', 'en'], es: ['es-US', 'es-MX', 'es'] }
export function pickVoice(voices, lang) {
  const local = voices.filter((v) => v.localService)
  const norm = (v) => v.lang.replace('_', '-')
  for (const want of PREFER[lang]) {
    const hit = local.find((v) => (want.includes('-') ? norm(v) === want : norm(v).split('-')[0] === want))
    if (hit) return hit
  }
  return null
}
