// Keeping the screen awake, where the browser allows it: while the slides
// play or a timer runs. One lock for the whole app.
//
// A request takes a moment to be granted, so the answer can arrive after the
// lock is no longer wanted: it is let go then, instead of being held for
// good. The browser drops a lock when the tab is hidden, so it is asked for
// again when the tab comes back.

let want = false
let lock = null
let asking = false

async function sync() {
  if (!navigator.wakeLock) return
  if (!want) {
    lock?.release().catch(() => {})
    lock = null
  } else if (!lock && !asking && document.visibilityState === 'visible') {
    asking = true
    try {
      const l = await navigator.wakeLock.request('screen')
      if (want) {
        lock = l
        l.addEventListener('release', () => lock === l && (lock = null))
      } else l.release().catch(() => {})
    } catch {}
    asking = false
  }
}

export function keepAwake(on) {
  want = on
  sync()
}

document.addEventListener('visibilitychange', sync)
