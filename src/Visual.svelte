<script>
  // One slide's picture, drawn in a 400×400 SVG. Pure presentation:
  // `item` from buildDeck, `s` the settings, `color`/`ink` from the theme.
  // The 'picture' kind (feelings, gestures, body) is a file, not drawn here.
  import { dotLayout, pictureSrc } from './concepts.js'
  import { untrack } from 'svelte'
  import { mix, ease, pathOf } from './morph.js'

  // `say` is the slide's name for a screen reader, in the language shown.
  let { item, s, color, ink, still = false, say = item.say, lang } = $props()

  // The outline on screen. Through a run of shape slides this one picture
  // stays put and `item` changes under it: the outline then moves from
  // wherever it is now to the new shape. Stepping on before it has finished
  // just sets off again from where it had got to.
  let pts = $state.raw(item.pts)
  $effect(() => {
    const to = item.pts
    const was = untrack(() => pts)
    if (!to || !was || was === to) {
      pts = to
      return
    }
    const began = performance.now()
    let frame
    const tick = () => {
      const k = Math.min(1, (performance.now() - began) / 700)
      pts = k < 1 ? mix(was, to, ease(k)) : to
      if (k < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    // A page that isn't being drawn (a background tab) gets no frames. Don't
    // leave the old shape up under the new word: finish on a timer instead.
    const finish = setTimeout(() => (pts = to), 800)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(finish)
    }
  })
  // Mixing and math slides play out once: `k` goes from 0 to 1 after a short
  // pause, so the start is seen first. With reduced motion they start finished.
  const plays = item.kind === 'mix' || item.kind === 'sum'
  let k = $state(plays && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1)
  $effect(() => {
    if (untrack(() => k) === 1) return
    let frame
    let began
    const tick = (now) => {
      began ??= now
      k = Math.min(1, Math.max(0, (now - began - 500) / 1200))
      if (k < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    // No frames in a background tab: finish anyway.
    const finish = setTimeout(() => (k = 1), 1800)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(finish)
    }
  })

  // Two blobs of paint slide together; where they overlap is the color they
  // make. Apart they just miss each other; together they overlap by a third.
  const MIX_R = 92
  const uid = 'mix' + Math.random().toString(36).slice(2, 8)
  const mixX = $derived(MIX_R * 0.68 + (1 - ease(k)) * MIX_R * 0.42)

  // Adding: the two groups start apart and slide into one ten-frame.
  // Subtracting: the dots taken away are crossed out one after another, and
  // stay, so both what was there and what is left can be seen.
  const sumDots = $derived.by(() => {
    if (item.kind !== 'sum' || digitOnly) return []
    const total = item.op === '+' ? item.n : item.a
    const box = dotsOnly ? { top: 60, bottom: 340 } : { top: 200, bottom: 390 }
    const apart = (1 - ease(k)) * 36
    return dotLayout(total, box).map((d, i) => {
      const second = item.op === '+' && i >= item.a
      const gone = item.op !== '+' && i >= item.n
      return {
        ...d,
        cx: d.cx + (item.op === '+' ? (second ? apart : -apart) : 0),
        second,
        gone,
        // How far this dot's X is drawn: each one after the last.
        x: gone ? Math.min(1, Math.max(0, k * item.b - (i - item.n))) : 0
      }
    })
  })
  const sentence = $derived(item.kind === 'sum' ? `${item.a} ${item.op} ${item.b} = ${item.n}` : '')
  const sentenceSize = $derived(sentence.length > 9 ? 66 : 74)

  // A color + shape slide is painted its own true color, outlined in ink so
  // white and yellow show; any other shape follows the drawing-style setting.
  const own = $derived(item.kind === 'shape' && item.hex)

  // A picture slide shows the best this browser can manage: the moving
  // picture, else the still one, else the device's own emoji as text.
  // 0 = as asked, 1 = still picture, 2 = text.
  let tier = $state(0)

  const soft = $derived(s.fill === 'soft')
  const fill = $derived(s.fill === 'outline' ? 'none' : color)
  const fillOpacity = $derived(soft ? 0.28 : 1)
  const stroke = $derived(s.fill === 'solid' ? 'none' : color)

  const digitOnly = $derived(s.numberStyle === 'digit')
  const dotsOnly = $derived(s.numberStyle === 'dots')
  const dots = $derived(
    item.kind === 'number' && !digitOnly ? dotLayout(item.n, dotsOnly ? { top: 60, bottom: 340 } : { top: 255, bottom: 395 }) : []
  )
  // Two letters or two digits share the box, so they're drawn smaller.
  const glyphSize = $derived(item.kind === 'glyph' ? (item.text.length > 1 ? 215 : 300) : 0)
  const digitSize = $derived((digitOnly ? 300 : 220) * (item.n > 9 ? 0.82 : 1))
</script>

{#if item.kind === 'picture' && tier < 2}
  <img
    src={pictureSrc(item, still || tier > 0)}
    alt={say}
    {lang}
    draggable="false"
    onerror={() => (tier = still || tier ? 2 : 1)}
  />
{:else}
<svg viewBox="0 0 400 400" role="img" aria-label={say} {lang}>
  {#if item.kind === 'picture'}
    <text x="200" y="212" font-size="290" class="glyph" fill={ink}>{item.emoji}</text>
  {:else if item.kind === 'glyph'}
    <text x="200" y="205" font-size={glyphSize} class="glyph" {fill} fill-opacity={fillOpacity} {stroke} stroke-width="5">{item.text}</text>
  {:else if item.kind === 'number'}
    {#if !dotsOnly}
      <text x="200" y={digitOnly ? 205 : 130} font-size={digitSize} class="glyph" {fill} fill-opacity={fillOpacity} {stroke} stroke-width="5">{item.n}</text>
    {/if}
    {#each dots as d}
      <circle cx={d.cx} cy={d.cy} r={d.r} {fill} fill-opacity={fillOpacity} {stroke} stroke-width="4" />
    {/each}
  {:else if item.kind === 'shape'}
    <path
      class="shape"
      d={pathOf(pts ?? item.pts)}
      fill={own || fill}
      fill-opacity={own ? 1 : fillOpacity}
      stroke={own ? ink : stroke}
      stroke-width={own ? 6 : 12}
      stroke-linejoin="round"
    />
  {:else if item.kind === 'color'}
    <rect x="50" y="50" width="300" height="300" rx="70" fill={item.hex} stroke={ink} stroke-width="6" />
  {:else if item.kind === 'mix'}
    <defs>
      <clipPath id={uid}><circle cx={200 - mixX} cy="200" r={MIX_R} /></clipPath>
    </defs>
    <circle cx={200 - mixX} cy="200" r={MIX_R} fill={item.a} />
    <circle cx={200 + mixX} cy="200" r={MIX_R} fill={item.b} />
    <circle cx={200 + mixX} cy="200" r={MIX_R} fill={item.hex} clip-path="url(#{uid})" />
    <circle cx={200 - mixX} cy="200" r={MIX_R} fill="none" stroke={ink} stroke-width="6" />
    <circle cx={200 + mixX} cy="200" r={MIX_R} fill="none" stroke={ink} stroke-width="6" />
  {:else if item.kind === 'sum'}
    {#if !dotsOnly}
      <text x="200" y={digitOnly ? 205 : 110} font-size={digitOnly ? sentenceSize * 1.15 : sentenceSize} class="glyph" {fill} fill-opacity={fillOpacity} {stroke} stroke-width="4">{sentence}</text>
    {/if}
    {#each sumDots as d}
      <circle cx={d.cx} cy={d.cy} r={d.r} fill={d.second ? ink : fill} fill-opacity={d.second ? 1 : fillOpacity} stroke={d.second ? 'none' : stroke} stroke-width="4" />
      {#if d.x > 0}
        {@const e = d.r * 0.95 * d.x}
        <path d="M{d.cx - e} {d.cy - e}L{d.cx + e} {d.cy + e}M{d.cx + e} {d.cy - e}L{d.cx - e} {d.cy + e}" stroke={ink} stroke-width={d.r * 0.32} stroke-linecap="round" />
      {/if}
    {/each}
  {:else if item.kind === 'pair'}
    {#each item.sides as side, i}
      <g transform="translate({i * 200} 0)">
        {#each side.parts as p}
          {#if p.line}
            <path d={p.d} fill="none" stroke={color} stroke-width="10" stroke-linejoin="round" stroke-linecap="round" />
          {:else}
            <path d={p.d} fill={p.solid ? color : fill} fill-opacity={p.solid ? 0.55 : fillOpacity} stroke={p.solid ? 'none' : stroke} stroke-width="9" stroke-linejoin="round" />
          {/if}
        {/each}
      </g>
    {/each}
    <line x1="200" y1="90" x2="200" y2="310" stroke={ink} stroke-opacity="0.18" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round" />
  {/if}
</svg>
{/if}

<style>
  svg { display: block; width: 100%; height: 100%; overflow: visible; }
  img { display: block; width: 100%; height: 100%; object-fit: contain; user-select: none; }
  /* The color changes along with the shape. */
  @media (prefers-reduced-motion: no-preference) {
    .shape { transition: fill 0.7s, stroke 0.7s; }
  }
  .glyph { font-family: var(--stage-font); font-weight: 700; text-anchor: middle; dominant-baseline: central; stroke-linejoin: round; }
</style>
