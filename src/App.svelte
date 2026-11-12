<script>
  // Looksee. One screen: a stage that plays through the deck, a control
  // bar that gets out of the way while playing, a settings drawer that
  // changes the stage live, a school-day bar along the top, and an optional
  // corner video.
  import { untrack } from 'svelte'
  import Visual from './Visual.svelte'
  import { SETS, GROUPS, buildDeck, pictureSrc, labelRows, labelLen, slideName, runStart, rowsText } from './concepts.js'
  import { THEMES, OPTIONS, deckKey as deckKeyOf, wordWait, loadSettings, saveSettings, normalizeSettings } from './settings.js'
  import { daySegments, normalizeDay, toMin, toTime, DAY_MAX_PARTS } from './day.js'
  import { PipPlayer } from './pip.js'
  import { VIDEOS, sides } from './videos.js'
  import { linkQuery, linkSettings, setupName } from './share.js'
  import { setHome } from './home.js'
  import { videoId, startSeconds } from './link.js'

  let { update = null } = $props()

  // A settings link (?v=1&…) wins over what this device has saved, every
  // time it opens, and changes made in its window stay with its address
  // (the device's own saved settings are left alone). See share.js.
  const fromLink = linkSettings(location.search)
  const s = $state(fromLink ?? loadSettings())
  const query = $derived(linkQuery(s))
  const shareUrl = $derived(new URL('./', document.baseURI).href + '?' + query)
  $effect(() => {
    const snap = $state.snapshot(s)
    if (!fromLink) return saveSettings(snap)
    const q = query
    try {
      history.replaceState(null, '', '?' + q)
    } catch {}
    setHome(q, setupName(snap))
  })
  let shareMsg = $state('')
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      shareMsg = 'Link copied.'
    } catch {
      shareMsg = 'Couldn’t copy: select the link above and copy it.'
    }
  }
  // Keep a link's settings as this device's own, and open the plain app.
  function keepHere() {
    saveSettings($state.snapshot(s))
    location.href = new URL('./', document.baseURI).href
  }

  // ---- deck ----
  const deckKey = $derived(deckKeyOf(s))
  // `round` goes up each time the deck starts over, which deals it again:
  // new skin tones, and a new order when it is mixed up.
  let round = $state(0)
  const deck = $derived.by(() => {
    deckKey
    round
    return untrack(() => buildDeck($state.snapshot(s)))
  })
  let index = $state(0)
  let playing = $state(false)
  $effect(() => {
    deckKey
    index = 0
  })
  const item = $derived(deck[Math.min(index, deck.length - 1)])
  // The words under the slide, in the language chosen, and the same words as
  // the slide's name for a screen reader.
  const rows = $derived(item ? labelRows(item, s) : [])
  const say = $derived(item ? slideName(item, rows) : '')
  const len = $derived(item ? labelLen(rows, item) : 1)
  const wait = $derived(wordWait(s))
  const theme = $derived(THEMES[s.theme])
  const color = $derived(s.colorMode === 'rainbow' ? theme.colors[index % theme.colors.length] : theme.ink)
  // Adding and subtracting color-code their two numbers, whatever the Color
  // setting: two colors from opposite ends of the theme's list.
  const two = $derived([0, 3].map((d) => theme.colors[(index + d) % theme.colors.length]))

  // Pictures move unless the device asks for reduced motion or Still is chosen.
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
  let reduced = $state(motionQuery.matches)
  $effect(() => {
    const f = (e) => (reduced = e.matches)
    motionQuery.addEventListener('change', f)
    return () => motionQuery.removeEventListener('change', f)
  })
  const still = $derived(reduced || s.feelingMotion === 'still')
  // Have the next picture ready before its slide arrives.
  $effect(() => {
    const next = deck[(index + 1) % deck.length]
    if (next?.kind === 'picture') new Image().src = pictureSrc(next, still)
  })

  // One shape after another stays on screen as a single picture that changes
  // from each shape into the next, so those slides share a key. Every other
  // slide is made fresh, which is what plays its entrance.
  const slideKey = $derived((s.morph && !reduced && item?.pts ? 'run' + runStart(deck, index) : index) + deckKey)

  function step(by) {
    if (!deck.length) return
    const n = index + by
    if (n >= deck.length && !s.loop) {
      playing = false
      index = 0
    } else {
      if (n >= deck.length) round++
      index = (n + deck.length) % deck.length
    }
  }
  $effect(() => {
    if (!playing || !deck.length) return
    index
    const t = setTimeout(() => step(1), s.seconds * 1000)
    return () => clearTimeout(t)
  })
  // Keep the screen awake while the deck plays, where the browser allows it.
  $effect(() => {
    if (!playing || !navigator.wakeLock) return
    let lock
    navigator.wakeLock.request('screen').then((l) => (lock = l)).catch(() => {})
    return () => lock?.release().catch(() => {})
  })

  let stageEl = $state()
  function toggle() {
    if (!deck.length) return
    playing = !playing
    if (playing) stageEl?.focus({ preventScroll: true })
    wake()
  }

  // ---- controls that fade while playing ----
  let drawer = $state(false)
  let quiet = $state(false)
  let quietTimer
  function wake() {
    quiet = false
    clearTimeout(quietTimer)
    quietTimer = setTimeout(() => (quiet = true), 2500)
  }
  const hideBar = $derived(playing && quiet && !drawer)

  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else document.documentElement.requestFullscreen?.().catch(() => {})
  }

  // ---- school-day bar ----
  const clock = () => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
  }
  let now = $state(clock())
  $effect(() => {
    const t = setInterval(() => (now = clock()), 15000)
    return () => clearInterval(t)
  })
  const parts = $derived(s.dayBar ? daySegments(s.day, s.dayEnd, now) : [])
  const dayLabel = $derived.by(() => {
    const i = parts.findIndex((p) => p.state === 'now')
    if (i >= 0) return `School day, part ${i + 1} of ${parts.length}: ${parts[i].icon}`
    return parts[0]?.state === 'past' ? 'The school day is over' : 'The school day has not started'
  })
  function addPart() {
    const t = normalizeDay(s.day, s.dayEnd)
    const mid = (toMin(t.day.at(-1).at) + toMin(t.dayEnd)) / 2
    s.day.push({ at: toTime(Math.round(mid / 5) * 5), icon: '⭐' })
  }
  // Put the parts back in time order once focus leaves the list, not while
  // a time is being typed.
  function tidyDay(e) {
    if (e.currentTarget.contains(e.relatedTarget)) return
    const t = normalizeDay(s.day, s.dayEnd)
    if (JSON.stringify(t.day) !== JSON.stringify(s.day) || t.dayEnd !== s.dayEnd) Object.assign(s, t)
  }
  const DAY_ICONS = [
    ['✏️📚', 'Morning work'],
    ['📖', 'Reading'],
    ['🔢', 'Math'],
    ['🎨', 'Art'],
    ['🎵', 'Music'],
    ['⚽', 'Recess'],
    ['🍎🥪', 'Lunch'],
    ['🧃', 'Snack'],
    ['😴', 'Rest'],
    ['🚌🚗', 'Going home']
  ]

  // ---- corner video ----
  const vid = $derived(videoId(s.videoUrl))
  let pipHost = $state()
  let pip = null
  let pipOn = $state(false)
  let pipStatus = $state('')
  const PIP_MSG = {
    loading: 'Loading the video…',
    playing: 'Playing in the corner.',
    blocked: 'YouTube could not be reached (offline, or blocked on this network).',
    unavailable: 'This video can’t be played here. Its owner may not allow embedding.',
    timeout: 'The video took too long to start.',
    waiting: 'Waiting for the video, probably an ad. It starts by itself when the ad ends.'
  }
  function stopVideo() {
    pip?.destroy()
    pip = null
    pipOn = false
    pipStatus = ''
  }
  function startVideo() {
    if (!vid || !pipHost) return
    stopVideo()
    pipOn = true
    pipStatus = 'loading'
    pip = new PipPlayer(
      pipHost,
      { videoId: vid, start: startSeconds(s.videoUrl), muted: s.videoMuted },
      {
        onPlaying: () => (pipStatus = 'playing'),
        onWaiting: () => (pipStatus = 'waiting'),
        onError: (why) => {
          pip = null
          pipOn = false
          pipStatus = why
        }
      }
    )
  }
  const toggleVideo = () => (pipOn ? stopVideo() : startVideo())
  $effect(() => {
    vid
    untrack(() => pipOn && stopVideo())
  })
  $effect(() => {
    const m = s.videoMuted
    pip?.setMuted(m)
  })
  $effect(() => () => pip?.destroy())

  // ---- Watch: a preset video in the middle, its words around it ----
  // The presets, plus the link from Settings when there is one.
  const watchList = $derived(
    vid ? [...VIDEOS, { id: 'yours', title: 'Your link', emoji: '🔗', url: s.videoUrl, words: [] }] : VIDEOS
  )
  let picking = $state(false)
  let watching = $state(null)
  let watchHost = $state()
  let watchStatus = $state('')
  let lit = $state(0)
  function watch(v) {
    playing = false
    stopVideo()
    picking = false
    lit = 0
    watching = v
  }
  function stopWatch() {
    watching = null
    stageEl?.focus({ preventScroll: true })
  }
  // One player per video chosen; leaving Watch destroys it (no pause, as in the corner).
  $effect(() => {
    const v = watching
    if (!v || !watchHost) return
    watchStatus = 'loading'
    const player = (watchPlayer = untrack(
      () =>
        new PipPlayer(
          watchHost,
          { videoId: videoId(v.url), start: startSeconds(v.url), muted: s.videoMuted },
          {
            onPlaying: () => (watchStatus = 'playing'),
            onWaiting: () => (watchStatus = 'waiting'),
            onError: (why) => (watchStatus = why)
          }
        )
    ))
    return () => {
      player.destroy()
      watchPlayer = null
    }
  })
  let watchPlayer = null
  $effect(() => {
    const m = s.videoMuted
    watchPlayer?.setMuted(m)
  })
  // Every 4 s the next word is lit, so eyes move calmly from word to word.
  $effect(() => {
    const n = watching?.words.length ?? 0
    if (!n || !s.wordWeb) return
    const t = setInterval(() => (lit = (lit + 1) % n), 4000)
    return () => clearInterval(t)
  })
  // The words split between the four sides of the video.
  const web = $derived.by(() => {
    if (!watching || !s.wordWeb) return null
    const c = sides(watching.words.length)
    // A name that is the same in both languages ("Paw Patrol") shows once.
    const ws = watching.words.map((x, i) => ({ ...x, i, rows: labelRows(x, s).filter((r, j, all) => !j || rowsText([r]) !== rowsText([all[0]])) }))
    let at = 0
    const take = (k) => ws.slice(at, (at += k))
    return { top: take(c.top), bottom: take(c.bottom), right: take(c.right), left: take(c.left) }
  })

  // ---- keyboard ----
  function onKey(e) {
    wake()
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const tag = e.target?.tagName
    if (e.key === 'Escape') {
      if (picking) picking = false
      else if (watching) stopWatch()
      else if (drawer) {
        drawer = false
        stageEl?.focus({ preventScroll: true })
      } else playing = false
      return
    }
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if (tag === 'BUTTON' && (e.key === ' ' || e.key === 'Enter')) return
    const k = e.key.toLowerCase()
    if (k === ' ') toggle()
    else if (k === 'arrowright') step(1)
    else if (k === 'arrowleft') step(-1)
    else if (k === 's') drawer = !drawer
    else if (k === 'v') toggleVideo()
    else if (k === 'w') watching ? stopWatch() : (picking = !picking)
    else if (k === 'm') s.videoMuted = !s.videoMuted
    else if (k === 'f') fullscreen()
    else return
    e.preventDefault()
  }

  // A whole group of sets on or off, keeping the order of SETS.
  function toggleGroup(g, allOn) {
    const want = new Set(s.sets)
    for (const id of g.sets) allOn ? want.delete(id) : want.add(id)
    s.sets = SETS.map((x) => x.id).filter((id) => want.has(id))
  }

  function fixRange() {
    Object.assign(s, normalizeSettings($state.snapshot(s)))
  }
  // Back to the defaults, but the video link and the school day are kept:
  // those are set up once and are not part of the look.
  function reset() {
    const keep = $state.snapshot({ videoUrl: s.videoUrl, dayBar: s.dayBar, day: s.day, dayEnd: s.dayEnd })
    Object.assign(s, normalizeSettings(keep))
  }

  const L = {
    order: { inOrder: 'In order', shuffle: 'Mixed up' },
    letterCase: { upper: 'A', lower: 'a', both: 'Aa' },
    numberStyle: { digit: 'Numeral', dots: 'Dots', both: 'Both' },
    mathTo: { 5: 'Up to 5', 10: 'Up to 10' },
    feelingMotion: { moving: 'Moving', still: 'Still' },
    words: { en: 'English', es: 'Español', both: 'Both' },
    skin: { mixed: 'Mixed', '1f3fb': 'Light', '1f3fc': 'Medium-light', '1f3fd': 'Medium', '1f3fe': 'Medium-dark', '1f3ff': 'Dark' },
    theme: Object.fromEntries(Object.entries(THEMES).map(([k, t]) => [k, t.label])),
    background: { plain: 'Plain', glow: 'Soft glow', dots: 'Dotted' },
    fill: { solid: 'Solid', outline: 'Outline', soft: 'Soft fill' },
    colorMode: { rainbow: 'Changing', one: 'One color' },
    size: { small: 'Small', medium: 'Medium', large: 'Large' },
    entrance: { none: 'None', fade: 'Fade', grow: 'Grow', slide: 'Slide' },
    idle: { still: 'Still', float: 'Float', breathe: 'Breathe' },
    font: { atkinson: 'Atkinson', rounded: 'Rounded', serif: 'Serif' },
    corner: { tl: 'Top left', tr: 'Top right', bl: 'Bottom left', br: 'Bottom right' },
    videoSize: { small: 'Small', medium: 'Medium', large: 'Large' }
  }
  const FONTS = {
    atkinson: "'Atkinson Hyperlegible', Verdana, sans-serif",
    rounded: "ui-rounded, 'Arial Rounded MT Bold', 'Varela Round', 'Comic Sans MS', sans-serif",
    serif: "Georgia, 'Times New Roman', serif"
  }
  const SIZE = { small: 46, medium: 62, large: 76 }
</script>

<svelte:window onkeydown={onKey} onpointermove={wake} onpointerdown={wake} />

{#snippet seg(key, legend)}
  <fieldset class="fld">
    <legend>{legend}</legend>
    <div class="seg">
      {#each OPTIONS[key] as v}
        <label class:on={s[key] === v}><input type="radio" name={key} value={v} bind:group={s[key]} />{L[key][v]}</label>
      {/each}
    </div>
  </fieldset>
{/snippet}

<div
  class="look bg-{s.background}"
  class:drawer
  class:has-day={s.dayBar}
  class:quiet={hideBar}
  style="--stage-bg:{theme.bg}; --stage-bg2:{theme.bg2}; --stage-ink:{theme.ink}; --stage-dot:{theme.dot}; --stage-font:{FONTS[s.font]}; --k:{SIZE[s.size]}"
>
  {#if s.dayBar}
    <div class="day" role="img" aria-label={dayLabel}>
      {#each parts as p}
        <div class="part {p.state}" style="flex-grow:{p.minutes}">
          {#if p.state === 'now'}<i style="width:{p.frac * 100}%"></i>{/if}
          <span>{p.icon}</span>
        </div>
      {/each}
    </div>
  {/if}

  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="scene" id="focus-home" tabindex="-1" bind:this={stageEl} onclick={toggle}>
    {#if item}
      {#key slideKey}
        <div class="slide in-{s.entrance}">
          {#if item.kind !== 'title'}
            <div class="vis idle-{s.idle}">
              <Visual {item} {s} {color} {two} {still} {say} lang={s.words === 'es' ? 'es' : undefined} ink={theme.ink} />
            </div>
          {/if}
          <!-- The words are made fresh for every slide, so the pause before them starts again. -->
          {#key index + deckKey}
            {#if (s.showLabel || item.kind === 'title') && rows.length}
              <p
                class="label"
                class:both={rows.length > 1}
                class:title={item.kind === 'title'}
                class:wait={wait > 0 && item.kind !== 'title'}
                style="--len:{len};--wait:{wait}s;--first:{item.hex ? theme.ink : color}"
              >
                {#if item.kind === 'glyph' && item.emoji}<span class="pic" aria-hidden="true">{item.emoji}</span>{/if}
                <span class="rows">
                  {#each rows as r (r.lang)}
                    <span class="words" class:two={r.words.length > 1} lang={r.lang}>
                      {#each r.words as w (w)}
                        <span>{r.art ? r.art + ' ' : ''}<span class="word" class:first={s.firstLetter}>{w}</span></span>
                      {/each}
                    </span>
                  {/each}
                </span>
              </p>
            {/if}
          {/key}
        </div>
      {/key}
    {:else}
      <p class="nothing">Nothing to show yet. Open Settings and pick a set.</p>
    {/if}
  </div>

  {#if s.showProgress && deck.length}
    <div class="prog" aria-hidden="true"><i style="width:{((index + 1) / deck.length) * 100}%"></i></div>
  {/if}

  <div class="pip pip-{s.corner} pip-{s.videoSize}" class:on={pipOn} aria-hidden="true">
    <div class="pip-host" bind:this={pipHost}></div>
    <div class="pip-shield"></div>
  </div>

  {#snippet word(x)}
    <div class="ww" class:lit={x.i === lit}>
      <span class="ww-pic" aria-hidden="true">{x.emoji}</span>
      {#each x.rows as r (r.lang)}
        <span class="ww-word" lang={r.lang}>{r.art ? r.art + ' ' : ''}{r.words.join(' ')}</span>
      {/each}
    </div>
  {/snippet}

  {#if watching}
    <section class="watch" class:bare={!web} aria-label={watching.title}>
      {#if web}
        <div class="ww-side top">{#each web.top as x (x.i)}{@render word(x)}{/each}</div>
        <div class="ww-side left">{#each web.left as x (x.i)}{@render word(x)}{/each}</div>
        <div class="ww-side right">{#each web.right as x (x.i)}{@render word(x)}{/each}</div>
        <div class="ww-side bottom">{#each web.bottom as x (x.i)}{@render word(x)}{/each}</div>
      {/if}
      <div class="watch-video" aria-hidden="true">
        <div class="pip-host" bind:this={watchHost}></div>
        <div class="pip-shield"></div>
        {#if watchStatus !== 'playing'}<p class="watch-msg">{PIP_MSG[watchStatus] ?? ''}</p>{/if}
      </div>
    </section>
  {/if}

  {#if picking}
    <div class="pick" role="dialog" aria-modal="true" aria-label="Choose a video">
      <div class="pick-grid">
        {#each watchList as v (v.id)}
          <button class="btn tile" onclick={() => watch(v)}><span class="tile-pic" aria-hidden="true">{v.emoji}</span>{v.title}</button>
        {/each}
        <button class="btn tile close" onclick={() => (picking = false)}>Close</button>
      </div>
    </div>
  {/if}

  <nav class="ctl" aria-label="Controls">
    {#if watching}
      <button class="btn primary big" onclick={stopWatch}>Back to slides</button>
      <button class="btn big" onclick={() => (s.videoMuted = !s.videoMuted)} aria-pressed={s.videoMuted}>{s.videoMuted ? 'Sound on' : 'Sound off'}</button>
      <button class="btn big" onclick={() => (picking = true)} aria-haspopup="dialog">Other video</button>
    {:else}
    <button class="btn" onclick={() => step(-1)} disabled={!deck.length}>Back</button>
    <button class="btn primary play" onclick={toggle} disabled={!deck.length}>{playing ? 'Pause' : 'Play'}</button>
    <button class="btn" onclick={() => step(1)} disabled={!deck.length}>Next</button>
    <span class="count mono">{deck.length ? index + 1 : 0}/{deck.length}</span>
    <button class="btn" onclick={toggleVideo} disabled={!vid} aria-pressed={pipOn}>{pipOn ? 'Hide video' : 'Video'}</button>
    <button class="btn" onclick={() => (picking = true)} aria-haspopup="dialog">Watch</button>
    <button class="btn" onclick={() => (drawer = !drawer)} aria-expanded={drawer}>Settings</button>
    {/if}
  </nav>

  {#if drawer}
    <aside class="drawer-panel" aria-label="Settings">
      <header>
        <h1>Looksee</h1>
        <button class="btn small" onclick={() => (drawer = false)}>Close</button>
      </header>

      {#if update}
        <p class="banner update">A new version is ready. <button class="btn small" onclick={update.reload}>Reload</button></p>
      {/if}

      <h2>What to show</h2>
      <fieldset class="fld">
        <legend>Sets</legend>
        <!-- One click on a group turns it all on, or all off when it is all on. -->
        {#each GROUPS as g}
          {@const on = g.sets.filter((id) => s.sets.includes(id)).length}
          <div class="grp">
            <button
              class="btn grp-head"
              aria-pressed={on === g.sets.length ? 'true' : on ? 'mixed' : 'false'}
              onclick={() => toggleGroup(g, on === g.sets.length)}
            ><span aria-hidden="true">{g.emoji}</span> {g.label}</button>
            {#if g.sets.length > 1}
              <div class="seg">
                {#each g.sets as id}
                  <label class:on={s.sets.includes(id)}><input type="checkbox" value={id} bind:group={s.sets} />{SETS.find((x) => x.id === id).label}</label>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </fieldset>
      {@render seg('words', 'Words')}
      <label class="chk"><input type="checkbox" bind:checked={s.letterWords} /> A word for each letter</label>
      <label class="chk"><input type="checkbox" bind:checked={s.firstLetter} /> Highlight the first letter</label>
      <label class="chk"><input type="checkbox" bind:checked={s.articles} /> El / la with Spanish words</label>
      <label class="chk"><input type="checkbox" bind:checked={s.setNames} /> Name each set as it begins</label>
      <label class="fld">
        <span>The word appears: <b class="mono">{s.wordDelay ? `after ${wait} s` : 'with the picture'}</b></span>
        <input type="range" min="0" max="5" bind:value={s.wordDelay} />
      </label>
      {#if wait < s.wordDelay}
        <p class="hint">Each slide lasts {s.seconds} s, and the word always gets the last one.</p>
      {/if}
      {@render seg('letterCase', 'Letters')}
      {@render seg('numberStyle', 'Numbers')}
      <div class="fld row">
        <label>From <input type="number" min="0" max="20" bind:value={s.numberFrom} onchange={fixRange} /></label>
        <label>to <input type="number" min="0" max="20" bind:value={s.numberTo} onchange={fixRange} /></label>
      </div>
      {@render seg('mathTo', 'Adding and subtracting')}
      {@render seg('feelingMotion', 'Faces and hands')}
      {@render seg('skin', 'Skin tone')}

      <h2>Pace</h2>
      <label class="fld">
        <span>Seconds on each: <b class="mono">{s.seconds}</b></span>
        <input type="range" min="1" max="15" bind:value={s.seconds} />
      </label>
      {@render seg('order', 'Order')}
      <label class="chk"><input type="checkbox" bind:checked={s.loop} /> Start over at the end</label>

      <h2>School day</h2>
      <label class="chk"><input type="checkbox" bind:checked={s.dayBar} /> Show the day bar at the top</label>
      {#if s.dayBar}
        <div class="fld" role="group" aria-label="Parts of the day" onfocusout={tidyDay}>
          {#each s.day as p, i (p)}
            <div class="day-row">
              <input type="time" bind:value={p.at} aria-label="Part {i + 1} starts at" />
              <input type="text" bind:value={p.icon} list="day-icons" aria-label="Pictures for part {i + 1}" />
              <button class="btn small" onclick={() => s.day.splice(i, 1)} disabled={s.day.length < 2} aria-label="Remove part {i + 1}">Remove</button>
            </div>
          {/each}
          <div class="day-row">
            <input type="time" bind:value={s.dayEnd} aria-label="The day ends at" />
            <span class="hint">the day ends</span>
            <button class="btn small" onclick={addPart} disabled={s.day.length >= DAY_MAX_PARTS}>Add a part</button>
          </div>
        </div>
        <p class="hint">
          Each part starts at its time and runs until the next one. Type or paste any emoji for a part, or pick a
          suggestion.
        </p>
        <datalist id="day-icons">
          {#each DAY_ICONS as [value, label]}<option {value} {label}></option>{/each}
        </datalist>
      {/if}

      <h2>Look</h2>
      {@render seg('theme', 'Theme')}
      {@render seg('background', 'Background')}
      {@render seg('fill', 'Drawing')}
      {@render seg('colorMode', 'Color')}
      {@render seg('size', 'Size')}
      {@render seg('font', 'Lettering')}
      {@render seg('entrance', 'Arrives with')}
      {@render seg('idle', 'While showing')}
      <label class="chk"><input type="checkbox" bind:checked={s.morph} /> Shapes change into each other</label>
      <p class="hint motion-note">Your device asks for reduced motion, so movement is off.</p>
      <label class="chk"><input type="checkbox" bind:checked={s.showLabel} /> Show the word underneath</label>
      <label class="chk"><input type="checkbox" bind:checked={s.showProgress} /> Show the progress line</label>

      <h2>Videos</h2>
      <label class="chk"><input type="checkbox" bind:checked={s.wordWeb} /> Words around the video in Watch</label>
      <label class="fld">
        <span>YouTube link</span>
        <input type="url" placeholder="https://www.youtube.com/watch?v=…" bind:value={s.videoUrl} spellcheck="false" autocomplete="off" />
      </label>
      {#if s.videoUrl && !vid}<p class="hint bad">That doesn’t look like a YouTube link.</p>{/if}
      <div class="fld row">
        <button class="btn primary" onclick={toggleVideo} disabled={!vid}>{pipOn ? 'Stop video' : 'Start video'}</button>
        <span class="hint" class:bad={pipStatus && !['loading', 'playing'].includes(pipStatus)} role="status">{PIP_MSG[pipStatus] ?? ''}</span>
      </div>
      {@render seg('corner', 'Corner')}
      {@render seg('videoSize', 'Video size')}
      <label class="chk"><input type="checkbox" bind:checked={s.videoMuted} /> Sound off</label>
      <p class="hint">
        The video plays through YouTube’s privacy-enhanced player with no controls, suggestions or end screen, and loops.
        It can’t be paused (a paused YouTube player shows other videos) — stop it instead. This app adds no ads, but it
        can’t remove ads YouTube itself places on a video; pick videos that don’t carry them.
      </p>

      <h2>Share this setup</h2>
      {#if fromLink}
        <p class="hint">
          This window opened from a settings link, as <b>{setupName(s)}</b>. Its settings come from the link every time,
          and changes made here stay with this window’s link, not this device.
        </p>
      {:else}
        <p class="hint">A link that opens Looksee with exactly these settings, school day and video included, on any device.</p>
      {/if}
      <input class="link" type="text" readonly value={shareUrl} aria-label="Link to this setup" onfocus={(e) => e.currentTarget.select()} />
      <div class="fld row">
        <button class="btn" onclick={copyLink}>Copy link</button>
        {#if fromLink}
          <button class="btn" onclick={keepHere}>Use these on this device</button>
        {:else}
          <a class="btn" href={shareUrl}>Open as its own page</a>
        {/if}
        <span class="hint" role="status">{shareMsg}</span>
      </div>
      <p class="hint">
        To keep a setup, open its page and click the <b>☆</b> star in the address bar: the bookmark is named after its sets
        and language, and opens this setup every time. One bookmark per setup, side by side on the bookmarks bar.
        A bookmark keeps the name it was saved with: to rename one, right-click it → Delete, open the link again
        and click ☆.
      </p>
      <p class="hint">
        Or as its own app: Chrome’s <b>⋮</b> menu → <b>Cast, save and share</b> → <b>Install page</b> (or <b>Create
        shortcut</b>, with “Open as window”). On an iPad: Share → <b>Add to Home Screen</b>.
      </p>

      <h2>Keys</h2>
      <p class="hint keyhelp">
        <kbd>Space</kbd> play / pause · <kbd>←</kbd> <kbd>→</kbd> back / next · <kbd>S</kbd> settings · <kbd>V</kbd> video · <kbd>W</kbd> watch ·
        <kbd>M</kbd> sound · <kbd>F</kbd> full screen · <kbd>Esc</kbd> close
      </p>
      <p><button class="btn small" onclick={reset}>Reset look and pace</button></p>
      <p class="hint">
        Faces, hands and body pictures are Noto Emoji by Google, used under CC BY 4.0.
        <a href="NOTICE.txt" target="_blank" rel="noopener">Credits</a>
      </p>
    </aside>
  {/if}
</div>

<style>
  .look { position: fixed; inset: 0; overflow: hidden; --inset-r: 0px; --inset-b: 0px; --bar-h: 0px; color: var(--stage-ink); background: var(--stage-bg); }
  .look.bg-glow { background: radial-gradient(circle at 50% 42%, var(--stage-bg2), var(--stage-bg) 70%); }
  .look.bg-dots { background: radial-gradient(var(--stage-dot) 3px, transparent 3.5px) 0 0 / 34px 34px var(--stage-bg); }
  .look.drawer { --inset-r: min(380px, 100vw); }
  .look.has-day { --bar-h: 50px; }
  .look.quiet { cursor: none; }

  /* School-day bar: one box per part, as wide as the part is long (never
     narrower than its pictures). Past parts are shaded; the line is now. */
  .day { position: absolute; top: 0; left: 0; right: var(--inset-r); height: var(--bar-h); display: flex; gap: 3px; padding: 6px 8px 4px; }
  .part { position: relative; flex: 1 0 3em; min-width: 0; display: grid; place-items: center; overflow: hidden; border-radius: 8px; font-size: 22px; line-height: 1; white-space: nowrap; background: color-mix(in srgb, var(--stage-ink) 9%, transparent); }
  .part.past { background: color-mix(in srgb, var(--stage-ink) 24%, transparent); }
  .part.past span { opacity: 0.5; }
  .part i { position: absolute; inset: 0 auto 0 0; background: color-mix(in srgb, var(--stage-ink) 24%, transparent); border-right: 3px solid var(--stage-ink); }
  .part span { position: relative; }

  .scene { position: absolute; inset: var(--bar-h) var(--inset-r) calc(var(--inset-b) + 70px) 0; container-type: size; display: grid; place-items: center; outline: none; cursor: pointer; }
  .look.quiet .scene { cursor: none; }
  .slide { display: flex; flex-direction: column; align-items: center; gap: 2cqmin; }
  .vis { width: calc(var(--k) * 1cqmin); height: calc(var(--k) * 1cqmin); }
  /* One row of words per language; a pair of opposites puts a word under each half. */
  /* --len is the longest word's length: the font shrinks for long words so
     they never run off the screen. 150 keeps the widest word under 80% of the
     width in Atkinson, and on screen in the wider fonts it can fall back to. */
  .label { --fit: calc(150cqw / var(--len, 1)); margin: 0; font-family: var(--stage-font); font-weight: 700; font-size: min(8cqmin, var(--fit)); line-height: 1.1; display: flex; align-items: center; justify-content: center; gap: 0.35em; }
  .label.both { font-size: min(6.5cqmin, var(--fit)); }
  .label.title { font-size: min(15cqmin, var(--fit)); }
  .label.both.title { font-size: min(11cqmin, var(--fit)); }
  .rows { display: flex; flex-direction: column; align-items: center; gap: 0.6cqmin; }
  .pic { font-size: 1.5em; line-height: 1; }
  .label.both .pic { font-size: 2.2em; }
  .words { display: flex; justify-content: center; text-align: center; white-space: nowrap; }
  .words.two { width: calc(var(--k) * 1cqmin); font-size: 6.5cqmin; white-space: normal; }
  .words.two > span { flex: 1; }
  /* The first letter: the slide's color (plain ink on a color slide, where the
     picture has a color of its own), and underlined so it is not color alone.
     Done in CSS so the word stays one piece of text for a screen reader. */
  .word { display: inline-block; }
  .word.first::first-letter { color: var(--first); text-decoration: underline; text-decoration-thickness: 0.07em; text-underline-offset: 0.14em; }
  /* The word waits before it shows. Not motion, so it applies with reduced motion too. */
  .label.wait { animation: reveal 0s var(--wait) both; }
  @keyframes reveal { from { visibility: hidden; } }
  .nothing { font-size: 20px; max-width: 24em; text-align: center; padding: 16px; }

  .prog { position: absolute; left: 0; right: var(--inset-r); bottom: var(--inset-b); height: 6px; background: color-mix(in srgb, var(--stage-ink) 12%, transparent); }
  .prog i { display: block; height: 100%; background: color-mix(in srgb, var(--stage-ink) 55%, transparent); }

  .ctl { position: absolute; left: 0; right: var(--inset-r); bottom: calc(var(--inset-b) + 18px); display: flex; justify-content: center; align-items: center; gap: 8px; flex-wrap: wrap; padding: 0 12px; pointer-events: none; }
  .ctl > * { pointer-events: auto; }
  .ctl .btn { min-height: 44px; padding-inline: 16px; }
  .ctl .play { min-width: 6.5em; }
  .count { font-size: 13px; padding: 4px 8px; border-radius: 6px; background: var(--surface); color: var(--muted); border: 1px solid var(--line); }
  .look.quiet .ctl:not(:has(:focus-visible)) { opacity: 0; }
  .look.quiet .ctl:not(:has(:focus-visible)) > * { pointer-events: none; }

  .pip { position: absolute; display: none; aspect-ratio: 16 / 9; border-radius: 12px; overflow: hidden; background: #000; border: 3px solid var(--stage-ink); box-shadow: 0 6px 24px rgb(0 0 0 / 0.25); max-width: calc(100vw - var(--inset-r) - 32px); }
  .pip.on { display: block; }
  .pip-small { width: 240px; }
  .pip-medium { width: 360px; }
  .pip-large { width: 500px; }
  .pip-tl { top: calc(var(--bar-h) + 16px); left: 16px; }
  .pip-tr { top: calc(var(--bar-h) + 16px); right: calc(var(--inset-r) + 16px); }
  .pip-bl { bottom: calc(var(--inset-b) + 78px); left: 16px; }
  .pip-br { bottom: calc(var(--inset-b) + 78px); right: calc(var(--inset-r) + 16px); }
  .pip-host { position: absolute; inset: 0; }
  .pip-host :global(iframe) { width: 100%; height: 100%; border: 0; display: block; pointer-events: none; }
  /* Clicks never reach YouTube: no links out, no focus in the iframe. */
  .pip-shield { position: absolute; inset: 0; }

  /* Watch: the video in the middle, its words in a frame around it. */
  .watch { position: absolute; inset: var(--bar-h) var(--inset-r) calc(var(--inset-b) + 78px) 0; container-type: size; display: grid;
    grid-template: 'top top top' 1fr 'left video right' auto 'bottom bottom bottom' 1fr / 1fr minmax(0, 54cqw) 1fr; gap: 2cqmin; padding: 2cqmin; background: var(--stage-bg); z-index: 2; }
  .watch.bare { grid-template: '. . .' 1fr '. video .' auto '. . .' 1fr / 1fr minmax(0, 80cqw) 1fr; }
  .watch-video { grid-area: video; position: relative; aspect-ratio: 16 / 9; max-height: 62cqh; border-radius: 12px; overflow: hidden; background: #000; border: 3px solid var(--stage-ink); justify-self: center; width: 100%; }
  .watch.bare .watch-video { max-height: 80cqh; }
  .watch-msg { position: absolute; inset: 0; display: grid; place-items: center; margin: 0; padding: 16px; color: #fff; font-size: clamp(14px, 2.4cqmin, 22px); text-align: center; }
  .ww-side { display: flex; align-items: center; justify-content: space-evenly; gap: 2cqmin; min-height: 0; min-width: 0; }
  .ww-side.top { grid-area: top; }
  .ww-side.bottom { grid-area: bottom; }
  .ww-side.left { grid-area: left; flex-direction: column; }
  .ww-side.right { grid-area: right; flex-direction: column; }
  .ww { display: flex; flex-direction: column; align-items: center; padding: 0.6cqmin 1.6cqmin; border-radius: 14px; font-family: var(--stage-font); font-weight: 700;
    color: var(--stage-ink); font-size: 3.6cqmin; line-height: 1.15; text-align: center; transition: background-color 0.6s; }
  .ww-pic { font-size: 2em; line-height: 1.1; }
  .ww.lit { background: color-mix(in srgb, var(--stage-ink) 12%, transparent); }
  @media (prefers-reduced-motion: no-preference) {
    .ww { transition: background-color 0.6s, transform 0.6s; }
    .ww.lit { transform: scale(1.15); }
  }

  /* The video picker: big tiles, one click each. */
  .pick { position: absolute; inset: 0; z-index: 5; display: grid; place-items: center; background: color-mix(in srgb, var(--stage-bg) 92%, transparent); padding: 24px; overflow: auto; }
  .pick-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 260px)); gap: 16px; justify-content: center; width: min(100%, 900px); }
  .tile { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 160px; font-size: 20px; text-align: center; }
  .tile-pic { font-size: 64px; line-height: 1; }
  .tile.close { min-height: 160px; font-size: 18px; }
  .ctl .big { min-height: 52px; padding-inline: 22px; font-size: 17px; }

  .drawer-panel { position: absolute; top: 0; right: 0; bottom: 0; width: var(--inset-r); overflow-y: auto; padding: 14px 16px 40px; background: var(--surface); color: var(--ink); border-left: 1px solid var(--line); font-size: 15px; }
  .drawer-panel header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  h1 { font-size: 20px; margin: 0; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin: 22px 0 8px; padding-top: 14px; border-top: 1px solid var(--line); }
  .fld { display: block; border: 0; padding: 0; margin: 0 0 12px; min-width: 0; }
  .fld legend, .fld > span { display: block; padding: 0; margin-bottom: 4px; color: var(--muted); font-size: 14px; }
  .fld.row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .fld input[type='url'], .fld input[type='number'], .fld input[type='time'], .fld input[type='text'] { border: 1px solid var(--line); border-radius: 6px; background: var(--sunk); padding: 6px 8px; }
  .fld input[type='url'] { width: 100%; }
  .fld input[type='number'] { width: 4.5em; }
  .day-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .day-row input[type='text'] { width: 5.5em; font-size: 18px; }
  .day-row .hint { margin: 0; flex: 1; }
  .fld input[type='range'] { width: 100%; accent-color: var(--brand); }
  .seg { display: flex; flex-wrap: wrap; gap: 6px; }
  .seg label { position: relative; border: 1px solid var(--line); border-radius: 6px; padding: 6px 11px; cursor: pointer; font-weight: 700; background: var(--surface); color: var(--muted); }
  .seg label.on { background: var(--brand); color: var(--brand-ink); border-color: var(--brand); }
  .seg input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
  .seg label:has(:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; box-shadow: var(--ring); }
  .chk { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; }
  .chk input { width: 18px; height: 18px; accent-color: var(--brand); }
  .hint { color: var(--muted); font-size: 14px; margin: 0 0 12px; }
  .hint.bad { color: var(--bad); }
  .grp { margin-bottom: 10px; }
  .grp-head { display: block; width: 100%; min-height: 44px; text-align: left; font-size: 16px; margin-bottom: 6px; }
  .grp-head[aria-pressed='true'] { background: var(--brand); color: var(--brand-ink); border-color: var(--brand); }
  .grp-head[aria-pressed='mixed'] { border: 2px solid var(--brand); }
  a.btn { text-decoration: none; display: inline-flex; align-items: center; }
  .link { width: 100%; box-sizing: border-box; font: 13px/1.4 ui-monospace, monospace; padding: 8px; margin-bottom: 8px; }
  .keyhelp { line-height: 2; }
  .motion-note { display: none; }

  /* Narrow screens: the drawer becomes a bottom sheet so the stage stays visible. */
  @media (max-width: 760px) {
    .look.drawer { --inset-r: 0px; --inset-b: 58vh; }
    .scene { bottom: calc(var(--inset-b) + 124px); }
    .ctl { gap: 6px; }
    .ctl .btn { padding-inline: 11px; font-size: 15px; }
    .ctl .count { display: none; }
    .drawer-panel { top: auto; left: 0; width: auto; height: var(--inset-b); border-left: 0; border-top: 1px solid var(--line); }
    .pip-small { width: 160px; }
    .pip-medium { width: 220px; }
    .pip-large { width: 300px; }
  }

  @media (prefers-reduced-motion: no-preference) {
    .ctl { transition: opacity 0.3s ease; }
    .prog i { transition: width 0.3s ease; }
    .part i { transition: width 1s linear; }
    .in-fade { animation: fade 0.5s ease both; }
    .in-grow { animation: grow 0.5s cubic-bezier(0.2, 0.8, 0.3, 1) both; }
    .in-slide { animation: slide 0.5s cubic-bezier(0.2, 0.8, 0.3, 1) both; }
    .idle-float { animation: float 5s ease-in-out 0.5s infinite; }
    .idle-breathe { animation: breathe 5s ease-in-out 0.5s infinite; }
    @keyframes fade { from { opacity: 0; } }
    @keyframes grow { from { opacity: 0; transform: scale(0.6); } }
    @keyframes slide { from { opacity: 0; transform: translateX(12cqw); } }
    @keyframes float { 50% { transform: translateY(-2.5cqmin); } }
    @keyframes breathe { 50% { transform: scale(1.05); } }
  }
  @media (prefers-reduced-motion: reduce) {
    .motion-note { display: block; }
  }
</style>
