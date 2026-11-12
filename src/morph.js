// Shapes that can change into each other.
//
// Every shape is an outline, resampled to the same number of points in the
// same order (clockwise from the top). Changing one shape into another is then
// just sliding point i of the first to point i of the second. The idea comes
// from the Lottie shape playground, which gives its triangle and circle the
// same six points; here the browser draws the result itself, so there is no
// player to ship. Pure: no DOM, tested in Node.
//
// Every shape here is the same on its left and right, so only the right-hand
// half is described and sampled; the left half is its mirror image. That keeps
// a symmetrical shape exactly symmetrical all the way through a change.

export const POINTS = 120
const AXIS = 200 // the middle of the 400 × 400 box the shapes are drawn in

// ---- right-hand halves: open runs of segments from the top point to the
// ---- bottom point, both on the axis. A segment has a length and a point at t.

const line = (a, b) => ({
  len: Math.hypot(b[0] - a[0], b[1] - a[1]),
  at: (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
})

function cubic(p0, p1, p2, p3) {
  const at = (t) => {
    const u = 1 - t
    return [0, 1].map((i) => u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i])
  }
  let len = 0
  let prev = p0
  for (let i = 1; i <= 24; i++) {
    const q = at(i / 24)
    len += Math.hypot(q[0] - prev[0], q[1] - prev[1])
    prev = q
  }
  return { len, at }
}

// A polygon, from its corners listed clockwise starting at the top-middle
// (a corner, or the middle of a flat top edge). Only the corners down the
// right-hand side are used: the run ends where the outline meets the axis again.
export function polygon(corners) {
  const half = [[AXIS, corners[0][1]]]
  for (let i = 1; i <= corners.length; i++) {
    const p = corners[i % corners.length]
    const last = half.at(-1)
    if (p[0] > AXIS + 1e-9) {
      half.push(p)
      continue
    }
    // Back at the middle, or past it: finish on the axis.
    const t = (AXIS - last[0]) / (p[0] - last[0])
    half.push([AXIS, last[1] + (p[1] - last[1]) * t])
    break
  }
  return half.slice(1).map((p, i) => line(half[i], p))
}

// A run of cubic curves down the right-hand side:
// [top, handle, handle, point, handle, handle, bottom].
export function curves(p) {
  const out = []
  for (let i = 0; i + 3 < p.length; i += 3) out.push(cubic(p[i], p[i + 1], p[i + 2], p[i + 3]))
  return out
}

// A circle or oval centred on the axis: its right-hand half, top to bottom.
export const ellipse = (cy, rx, ry) => [
  { len: 1, at: (t) => [AXIS + rx * Math.sin(Math.PI * t), cy - ry * Math.cos(Math.PI * t)] }
]

// The corners of a regular polygon, or of a star when `inner` is given,
// around (200, 205), first corner at the top.
export function regular(n, r, inner) {
  const steps = inner ? n * 2 : n
  return Array.from({ length: steps }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / steps
    const rr = inner && i % 2 ? inner : r
    return [AXIS + rr * Math.cos(a), 205 + rr * Math.sin(a)]
  })
}

// ---- the same number of points for every shape ----

// `count` points along a run. They are shared out between the segments by
// length, and each segment's first point is always one of them, so every
// corner stays exactly where it is. The run's last point is not included.
function share(segments, count) {
  const total = segments.reduce((sum, s) => sum + s.len, 0)
  const want = segments.map((s) => (s.len / total) * count)
  const got = want.map((x) => Math.max(1, Math.floor(x)))
  let left = count - got.reduce((a, b) => a + b, 0)
  const byRemainder = want.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0])
  for (let k = 0; left > 0; k++, left--) got[byRemainder[k % segments.length][1]]++
  for (; left < 0; left++) got[got.indexOf(Math.max(...got))]--
  return segments.flatMap((s, i) => Array.from({ length: got[i] }, (_, j) => s.at(j / got[i])))
}

// A whole outline from its right-hand half: down the right, the bottom
// point, then the mirror image back up the left.
export function resample(half, n = POINTS) {
  const right = share(half, n / 2)
  const bottom = half.at(-1).at(1)
  const left = right.slice(1).reverse().map(([x, y]) => [2 * AXIS - x, y])
  return [...right, bottom, ...left]
}

// ---- morphing ----

// The shape that is t of the way from a to b (0 = a, 1 = b).
export const mix = (a, b, t) => a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t])

// Slow, fast, slow.
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const r1 = (v) => Math.round(v * 10) / 10

// Points → an SVG path.
export const pathOf = (pts) => 'M' + pts.map((p) => r1(p[0]) + ' ' + r1(p[1])).join('L') + 'z'
