// Bundle budget (CLAUDE.md): app JS ≤ 60 KB gzipped — everything a visitor
// downloads to run Looksee, service worker included. Runs in every
// `npm run build`, so CI fails on regressions.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { gzipSync } from 'node:zlib'

const LIMIT = 60 * 1024
const rows = []
let total = 0
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (['.js', '.mjs'].includes(extname(p))) {
      const gz = gzipSync(readFileSync(p), { level: 9 }).length
      total += gz
      rows.push([p, gz])
    }
  }
}
walk('dist')
rows.sort((a, b) => b[1] - a[1])
for (const [p, gz] of rows) console.log(`${(gz / 1024).toFixed(1).padStart(7)} KB  ${p}`)
console.log(`\nApp JS (gzipped): ${(total / 1024).toFixed(1)} KB — budget ${LIMIT / 1024} KB`)
if (total > LIMIT) {
  console.error('\n✗ Bundle budget exceeded (CLAUDE.md: app JS ≤ 60 KB gzipped)')
  process.exit(1)
}
console.log('✓ Within budget')
