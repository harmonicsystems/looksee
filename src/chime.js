// The timer's chime: two soft notes, made by the browser itself. No sound
// file and nothing fetched. It plays only where someone has already clicked
// or pressed a key on the page (starting the timer counts).

let ctx

export function chime() {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)()
    ctx.resume()
    const t0 = ctx.currentTime + 0.05
    for (const [hz, at] of [[659, 0], [523, 0.45]]) {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = hz
      g.gain.setValueAtTime(0.0001, t0 + at)
      g.gain.exponentialRampToValueAtTime(0.25, t0 + at + 0.04)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 1.4)
      o.connect(g).connect(ctx.destination)
      o.start(t0 + at)
      o.stop(t0 + at + 1.5)
    }
  } catch {}
}
