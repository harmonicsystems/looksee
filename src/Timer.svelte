<script>
  // The timer (timer.js): a sheet to start one, a clock in a top corner while
  // it runs, and "Time's up" at the end. It is apart from the slides, Watch
  // and the school day, and never changes what they are doing. Its state is
  // kept on the device under its own name, not in the settings, so it is
  // never in a settings link.
  import { tick } from 'svelte'
  import { PRESETS, MAX_MIN, normalizeTimer, timerState, remaining, share, startTimer, pauseTimer, resumeTimer, endTimer, addTime, clockText, milestone } from './timer.js'
  import { chime } from './chime.js'

  // `open`: the sheet (no timer yet) or the clock's buttons (a timer on).
  // `status` and `text` tell the control bar what its Timer button shows.
  // `anchor` is that button: focus goes back to it. `onLeft` puts the clock
  // in the top left corner, when the corner video has the top right.
  let { open = $bindable(false), status = $bindable('idle'), text = $bindable(''), anchor = null, onLeft = false, reduced = false } = $props()

  const KEY = 'looksee-timer-v1'
  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY))
    } catch {}
  }
  let now = $state(Date.now())
  let t = $state(normalizeTimer(load(), Date.now()))
  $effect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(t))
    } catch {}
  })

  const st = $derived(timerState(t, now))
  const ms = $derived(remaining(t, now))
  const digits = $derived(clockText(ms))
  // Under reduced motion the ring moves in tenths, not all the time.
  const ring = $derived(reduced ? Math.ceil(share(t, now) * 10) * 10 : share(t, now) * 100)
  $effect(() => {
    status = st
    text = st === 'idle' ? '' : st === 'done' ? 'Time’s up' : digits
  })

  // What a screen reader is told: one minute, ten seconds, the end.
  const SAY = { minute: '1 minute left', ten: '10 seconds left', done: 'Time’s up' }
  let said = $state('')
  let before = 0
  function beat() {
    now = Date.now()
    const after = remaining(t, now)
    const m = t.endsAt ? milestone(before, after) : null
    before = after
    if (!m) return
    said = SAY[m]
    if (m === 'done' && t.chime) chime()
  }
  $effect(() => {
    if (st !== 'running') return
    const id = setInterval(beat, 250)
    // A tab in the background ticks slowly: catch up the moment it is back.
    document.addEventListener('visibilitychange', beat)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', beat)
    }
  })

  // Every change goes through here, so the clock and the count are in step.
  function set(next) {
    now = Date.now()
    t = next(t, now)
    before = remaining(t, now)
    said = ''
  }
  let pick = $state(t.last)
  function close() {
    open = false
    anchor?.focus()
  }
  function start(min) {
    set((x, n) => startTimer(x, min, n))
    close()
  }
  const end = () => {
    set(endTimer)
    pick = t.last
    close()
  }

  // Opening puts focus on the first thing to press: Start, or the clock's
  // first button.
  let root = $state()
  let first = true
  $effect(() => {
    const on = open
    if (first) return void (first = false)
    if (on) tick().then(() => root?.querySelector('[data-first]')?.focus())
  })
</script>

<div bind:this={root}>
  {#if st === 'idle'}
    {#if open}
      <div class="sheet" role="dialog" aria-label="Timer">
        <div class="row">
          {#each PRESETS as m}
            <button class="btn big" onclick={() => start(m)}>{m} min</button>
          {/each}
        </div>
        <div class="row">
          <button class="btn big rnd" onclick={() => pick--} disabled={pick <= 1} aria-label="One minute less">−</button>
          <b class="pick">{pick}:00</b>
          <button class="btn big rnd" onclick={() => pick++} disabled={pick >= MAX_MIN} aria-label="One minute more">+</button>
          <button class="btn primary big" data-first onclick={() => start(pick)}>Start</button>
        </div>
        <div class="row">
          <label class="chk"><input type="checkbox" bind:checked={t.chime} /> Chime at the end</label>
          <button class="btn" onclick={close}>Close</button>
        </div>
      </div>
    {/if}
  {:else}
    <section class="tm" class:left={onLeft} class:done={st === 'done'} aria-label="Timer">
      {#if st === 'done'}
        <b class="up">Time’s up</b>
        <div class="row">
          <button class="btn primary big" data-first onclick={end}>Done</button>
          <button class="btn big" onclick={() => set((x, n) => addTime(x, 120000, n))}>+2 min</button>
        </div>
      {:else}
        <button class="face" onclick={() => (open = !open)} aria-expanded={open}>
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="16" />
            <circle class="arc" class:smooth={!reduced} cx="20" cy="20" r="16" pathLength="100" stroke-dasharray="{ring} 100" />
          </svg>
          <span>
            <span class="digits" role="timer" aria-live="off">{digits}</span>
            {#if st === 'paused'}<span class="word">Paused</span>{/if}
          </span>
        </button>
        {#if open}
          <div class="row">
            {#if st === 'paused'}
              <button class="btn primary big" data-first onclick={() => set(resumeTimer)}>Resume</button>
            {:else}
              <button class="btn big" data-first onclick={() => set(pauseTimer)}>Pause</button>
            {/if}
            <button class="btn big" onclick={() => set((x, n) => addTime(x, 60000, n))}>+1 min</button>
            <button class="btn big" onclick={end}>End</button>
          </div>
        {/if}
      {/if}
    </section>
  {/if}
  <p class="sr" aria-live="polite">{said}</p>
</div>

<style>
  .sheet, .tm { position: absolute; z-index: 3; background: var(--surface); color: var(--ink); border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 6px 24px rgb(0 0 0 / 0.22); font-family: var(--font); }
  /* The sheet rises from the control bar; the lesson stays in view above it. */
  .sheet { left: var(--inset-l); right: var(--inset-r); bottom: calc(var(--inset-b) + 84px); width: max-content; max-width: calc(100vw - var(--inset-l) - var(--inset-r) - 24px); margin: 0 auto; padding: 14px; display: grid; gap: 12px; }
  .row { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
  .big { min-height: 52px; min-width: 52px; padding-inline: 16px; font-size: 17px; }
  .rnd { border-radius: 50%; padding: 0; font-size: 26px; line-height: 1; }
  .pick { min-width: 3.2em; text-align: center; font-size: 34px; font-variant-numeric: tabular-nums; }
  .chk { display: flex; align-items: center; gap: 8px; margin-right: auto; }
  .chk input { width: 20px; height: 20px; accent-color: var(--brand); }

  /* The clock: a top corner under the day bar, away from the corner video. */
  .tm { top: calc(var(--bar-h) + 16px); right: calc(var(--inset-r) + 16px); display: grid; gap: 8px; padding: 6px; max-width: calc(100vw - var(--inset-l) - var(--inset-r) - 32px); }
  .tm.left { right: auto; left: calc(var(--inset-l) + 16px); }
  .face { display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 2px 12px 2px 6px; border: 0; border-radius: 10px; background: none; color: inherit; cursor: pointer; font: inherit; text-align: left; }
  .face:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; box-shadow: var(--ring); }
  .face > span { display: grid; }
  svg { width: 46px; height: 46px; transform: rotate(-90deg); }
  circle { fill: none; stroke: var(--line); stroke-width: 5; }
  .arc { stroke: var(--brand); stroke-linecap: round; }
  .digits { font-size: 34px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
  .word { font-size: 14px; font-weight: 700; color: var(--muted); }
  /* Time's up: bigger and edged, in the same calm colors. It does not move. */
  .tm.done { padding: 16px 20px; border: 4px solid var(--brand); text-align: center; }
  .up { font-size: 34px; line-height: 1.1; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); margin: 0; }

  @media (max-width: 760px) {
    /* Little room here, least of all with Settings open below: the sheet hangs from the top. */
    .sheet { top: calc(var(--bar-h) + 8px); bottom: auto; }
    svg { display: none; }
    .face { padding-left: 12px; }
    .digits, .up { font-size: 26px; }
  }
  @media (prefers-reduced-motion: no-preference) {
    .smooth { transition: stroke-dasharray 0.25s linear; }
  }
</style>
