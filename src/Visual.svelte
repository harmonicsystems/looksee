<script>
  // One slide's picture, drawn in a 400×400 SVG. Pure presentation:
  // `item` from buildDeck, `s` the settings, `color`/`ink` from the theme.
  // The 'picture' kind (feelings, gestures, body) is a file, not drawn here.
  import { dotLayout, pictureSrc } from './concepts.js'

  let { item, s, color, ink, still = false } = $props()

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
    alt={item.say}
    draggable="false"
    onerror={() => (tier = still || tier ? 2 : 1)}
  />
{:else}
<svg viewBox="0 0 400 400" role="img" aria-label={item.say}>
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
    <path d={item.d} {fill} fill-opacity={fillOpacity} {stroke} stroke-width="12" stroke-linejoin="round" />
  {:else if item.kind === 'color'}
    <rect x="50" y="50" width="300" height="300" rx="70" fill={item.hex} stroke={ink} stroke-width="6" />
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
  .glyph { font-family: var(--stage-font); font-weight: 700; text-anchor: middle; dominant-baseline: central; stroke-linejoin: round; }
</style>
