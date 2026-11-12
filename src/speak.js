// Speaking aloud with the browser's own speech (the Web Speech API). Not
// pure: speech.js decides what to say and with which voice. Only the
// device's own voices are used (see pickVoice); a language with none is
// skipped.
import { pickVoice } from './speech.js'

const synth = typeof speechSynthesis === 'undefined' ? null : speechSynthesis

export const voices = () => synth?.getVoices() ?? []

// Calls back now and whenever the device's voices change (they load late).
export function onVoices(fn) {
  if (!synth) return () => {}
  fn(voices())
  const f = () => fn(voices())
  synth.addEventListener('voiceschanged', f)
  return () => synth.removeEventListener('voiceschanged', f)
}

export function stopSpeaking() {
  synth?.cancel()
}

// Says each line in turn, each in its own language's voice. Cancels whatever
// was being said. onStart / onEnd bracket the whole thing.
export function speak(lines, { onStart, onEnd } = {}) {
  if (!synth) return
  synth.cancel()
  const all = voices()
  const queue = lines.map((l) => ({ ...l, voice: pickVoice(all, l.lang) })).filter((l) => l.voice)
  queue.forEach((l, i) => {
    const u = new SpeechSynthesisUtterance(l.text)
    u.voice = l.voice
    u.lang = l.voice.lang
    u.rate = 0.9
    if (i === 0) u.onstart = () => onStart?.()
    if (i === queue.length - 1) u.onend = u.onerror = () => onEnd?.()
    synth.speak(u)
  })
}
