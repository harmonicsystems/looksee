// Build gate: both palettes in src/styles.css must meet WCAG AA on the color
// pairs the controls and the settings drawer render. The focus ring is held
// to 3:1 (non-text contrast, WCAG 1.4.11). The stage themes are a separate
// set of colors, held to their own ratios by tests/looksee.test.js.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/styles.css'), 'utf8')

function block(name) {
  const m = css.match(new RegExp(`/\\* @palette ${name} \\*/[\\s\\S]*?:root\\s*{([^}]+)}`))
  if (!m) {
    console.error(`✗ could not find the "${name}" palette in src/styles.css`)
    process.exit(1)
  }
  const out = {}
  for (const t of m[1].matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) out[t[1]] = t[2]
  return out
}

function luminance(hex) {
  const c = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const PAIRS = [
  ['ink', 'surface', 4.5, 'drawer text, buttons'],
  ['ink', 'sunk', 4.5, 'inputs, kbd, banner'],
  ['muted', 'surface', 4.5, 'hints, unselected choices'],
  ['brand', 'surface', 4.5, 'links'],
  ['brand-ink', 'brand', 4.5, 'primary button, selected choices'],
  ['bad', 'surface', 4.5, 'error hints'],
  ['focus', 'focus-edge', 3, 'focus ring against its dark edge']
]

// The two-tone ring (yellow + dark edge) must stand out from the drawer: at
// least one of its two colors at 3:1 against the ground.
const RING_GROUNDS = ['surface']

let failed = 0
for (const name of ['light', 'dark']) {
  const t = block(name)
  for (const [fg, bg, min, where] of PAIRS) {
    if (!t[fg] || !t[bg]) {
      console.error(`✗ ${name}: missing token --${t[fg] ? bg : fg}`)
      failed++
      continue
    }
    const r = ratio(t[fg], t[bg])
    const ok = r >= min
    if (!ok) failed++
    console.log(`${ok ? '✓' : '✗'} ${name.padEnd(5)} ${fg} on ${bg}: ${r.toFixed(2)} (min ${min}) — ${where}`)
  }
  for (const g of RING_GROUNDS) {
    const r = Math.max(ratio(t.focus, t[g]), ratio(t['focus-edge'], t[g]))
    const ok = r >= 3
    if (!ok) failed++
    console.log(`${ok ? '✓' : '✗'} ${name.padEnd(5)} focus ring on ${g}: ${r.toFixed(2)} (min 3)`)
  }
}
if (failed) {
  console.error(`\n✗ ${failed} contrast check(s) failed`)
  process.exit(1)
}
console.log('✓ All palettes pass')
