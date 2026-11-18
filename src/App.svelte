<script>
  // Looksee. One screen: a stage that plays through the deck, a control
  // bar that gets out of the way while playing, a settings drawer that
  // changes the stage live, a school-day bar along the top, and an optional
  // corner video.
  import { untrack } from 'svelte'
  import Visual from './Visual.svelte'
  import Timer from './Timer.svelte'
  import { SETS, GROUPS, buildDeck, pictureSrc, labelRows, labelLen, slideName, runStart, rowsText } from './concepts.js'
  import { THEMES, OPTIONS, deckKey as deckKeyOf, wordWait, loadSettings, saveSettings, normalizeSettings } from './settings.js'
  import { daySegments, normalizeDay, toMin, toTime, DAY_MAX_PARTS } from './day.js'
  import { PipPlayer } from './pip.js'
  import { VIDEOS, sides } from './videos.js'
  import { speechLines, pickVoice } from './speech.js'
  import { speak, onVoices } from './speak.js'
  import { linkQuery, linkSettings, setupName, setsName } from './share.js'
  import { MINUTES, PLAN_MAX, blockDone, minutesLeft, blockAfter, setsInUse } from './plan.js'
  import { setHome } from './home.js'
  import { keepAwake } from './awake.js'
  import { PLAYLISTS, VOLUMES } from './music.js'
  import { playMusic, stopMusic, setMusicVolume, dip, onMusic, saveMusic, savedMusic } from './player.js'
  import { videoId, startSeconds } from './link.js'
  import { thingFiles } from './things.js'
  import { canKeep, localPictures, addPictures, removePictures } from './local.js'
  import { PLACE, TEMPS, weatherLines } from './weather.js'
  import { getWeather } from './outside.js'

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

  // ---- plan ----
  // With a plan, its blocks play in turn, each for its minutes (plan.js).
  // `block` is the one playing now. `cur` is whose sets are playing and being
  // chosen in Settings: the block's or, with no plan, the settings' own.
  let blk = $state(0)
  const bi = $derived(Math.min(blk, s.plan.length - 1))
  const block = $derived(s.planOn && s.plan.length ? s.plan[bi] : null)
  const cur = $derived(block ?? s)

  // ---- deck ----
  const deckKey = $derived(deckKeyOf({ ...s, sets: cur.sets }) + (block ? bi : ''))
  // `round` goes up each time the deck starts over, which deals it again:
  // new skin tones, and a new order when it is mixed up.
  let round = $state(0)
  const deck = $derived.by(() => {
    deckKey
    round
    return untrack(() => buildDeck({ ...$state.snapshot(s), sets: [...cur.sets] }))
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

  // ---- speech ----
  // A click on the slide says its words. With "Read each slide aloud", each
  // slide is also said once its word shows, while playing. Nothing is said
  // before someone clicks (Play counts), and only the device's own voices
  // are used (speech.js).
  const speakSlide = () => item && speak(speechLines(item, rows))
  $effect(() => {
    if (!playing || !s.speakSlides || !item) return
    const lines = untrack(() => speechLines(item, rows))
    const t = setTimeout(() => speak(lines), wait * 1000)
    return () => clearTimeout(t)
  })
  let voiceList = $state([])
  $effect(() => onVoices((v) => (voiceList = v)))
  const voiceFor = $derived({ en: pickVoice(voiceList, 'en'), es: pickVoice(voiceList, 'es') })
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
  // Safari, and every browser on an iPhone or iPad, draws the moving pictures
  // on a black square (it loses their clear background), so those get the
  // still ones.
  const APPLE = navigator.vendor.startsWith('Apple')
  const still = $derived(APPLE || reduced || s.feelingMotion === 'still')
  // Have the next picture ready before its slide arrives.
  $effect(() => {
    const next = deck[(index + 1) % deck.length]
    if (next?.kind === 'picture' && !next.word && !(next.one && pics[next.code])) new Image().src = pictureSrc(next, still)
  })

  // Pictures this device keeps for the Things sets (local.js): added from the
  // device's own files in Settings, kept in the browser, never uploaded.
  let pics = $state.raw({})
  let picsNote = $state('')
  const THING_COUNT = thingFiles().length
  const picsHave = $derived(thingFiles().filter((x) => pics[x.file]).length)
  $effect(() => {
    localPictures().then((p) => (pics = p)).catch(() => {})
  })
  async function addPics(e) {
    const files = [...e.target.files]
    e.target.value = ''
    if (!files.length) return
    try {
      const r = await addPictures(files)
      pics = await localPictures()
      picsNote = r.added ? `Added ${r.added}.` : 'None of those files is named after a thing (dog, apple, bus…).'
      if (r.added && r.unknown.length) picsNote += ` ${r.unknown.length} other ${r.unknown.length === 1 ? 'file was' : 'files were'} not used.`
    } catch {
      picsNote = 'The pictures could not be kept on this device.'
    }
  }
  async function removePics() {
    await removePictures().catch(() => {})
    pics = await localPictures().catch(() => ({}))
    picsNote = 'Removed.'
  }

  // One shape after another stays on screen as a single picture that changes
  // from each shape into the next, so those slides share a key. Every other
  // slide is made fresh, which is what plays its entrance.
  const slideKey = $derived((s.morph && !reduced && item?.pts ? 'run' + runStart(deck, index) : index) + deckKey)

  // A block's minutes are minutes of playing: `spent` is what it had played
  // before `since`, the moment playing last began (0 while paused).
  let spent = 0
  let since = 0
  const played = () => spent + (since && Date.now() - since)
  $effect(() => {
    if (!playing) return
    since = Date.now()
    return () => {
      spent += Date.now() - since
      since = 0
    }
  })
  // Make block `i` the one that plays, from its start.
  function goBlock(i) {
    blk = i
    spent = 0
    if (since) since = Date.now()
  }
  function addBlock() {
    s.plan.push({ sets: [...cur.sets], min: 10 })
    goBlock(s.plan.length - 1)
  }
  function removeBlock(i) {
    s.plan.splice(i, 1)
    goBlock(Math.max(0, i - 1))
  }
  // One place earlier in the plan.
  function moveBlock(i) {
    s.plan.splice(i - 1, 0, ...s.plan.splice(i, 1))
    goBlock(i - 1)
  }

  function step(by) {
    if (!deck.length) return
    // A block that has had its minutes hands over to the next at a slide's end.
    if (by > 0 && block && blockDone(block.min, played())) {
      const was = bi
      const to = blockAfter(s.plan, was, s.loop)
      if (to < 0) {
        playing = false
        index = 0
      }
      goBlock(Math.max(0, to))
      if (to !== was) return
    }
    const n = index + by
    // Inside a block the slides always start over: the block decides when to stop.
    if (n >= deck.length && !s.loop && !block) {
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
  // Keep the screen awake while the deck plays or a timer runs (awake.js).
  $effect(() => keepAwake(playing || timerStatus === 'running' || !!tune))

  // ---- timer and tools ----
  // The timer is its own thing (Timer.svelte); the bar only has its button.
  // Tools holds what is used less often: Watch, the corner video, Settings.
  let timerOpen = $state(false)
  let timerStatus = $state('idle')
  let timerText = $state('')
  let timerBtn = $state()
  let tools = $state(false)
  let toolsBtn = $state()
  function toggleTimer() {
    tools = false
    timerOpen = !timerOpen
  }
  // One thing from Tools, which closes it.
  function tool(f) {
    tools = false
    f()
  }

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
  const hideBar = $derived(playing && quiet && !drawer && !tools && !timerOpen)

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
  // Minutes the block playing now still has, for the control bar.
  const left = $derived.by(() => {
    now
    index
    playing
    return block ? minutesLeft(block.min, played()) : 0
  })
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
  // A word around the video says itself when clicked, over the video turned down.
  function speakWord(x) {
    speak(speechLines({ say: x.label }, x.rows), {
      onStart: () => watchPlayer?.setVolume(30),
      onEnd: () => watchPlayer?.setVolume(100)
    })
  }
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

  // ---- background music (music.js, player.js) ----
  // Chosen in Tools; while it plays, a button in the bar stops it. It is its
  // own thing, like the timer: the slides, plans and the timer never start or
  // stop it. It gives way to a video with sound, to speech and to the chime.
  let tune = $state(null)
  let choosing = $state(false)
  let lastList = null
  let musicNote = $state('')
  let musicSaved = $state(0)
  const MUSIC_COUNT = PLAYLISTS.reduce((n, p) => n + p.tracks.length, 0)
  onMusic((id, err) => {
    tune = id
    if (err) musicNote = 'The music could not be played: offline, and not saved on this device.'
  })
  function startMusic(p) {
    lastList = p
    musicNote = ''
    choosing = false
    playMusic(p, VOLUMES[s.musicVol])
  }
  $effect(() => setMusicVolume(VOLUMES[s.musicVol]))
  $effect(() => dip('video', (pipOn || !!watching) && !s.videoMuted))
  $effect(() => {
    if (!s.music) untrack(stopMusic)
  })
  $effect(() => {
    if (s.music) savedMusic(PLAYLISTS).then((n) => (musicSaved = n))
  })
  async function keepMusic() {
    musicNote = 'Saving…'
    try {
      await saveMusic(PLAYLISTS, (n) => (musicSaved = n))
      musicNote = ''
    } catch {
      musicNote = 'Saving stopped: the site could not be reached.'
    }
  }

  // ---- weather ----
  // The temperature outside as its own big slide, for circle time. Nothing is
  // asked until someone opens it (Weather in Tools, or O), and the button
  // is there only when the Weather setting is on.
  let wx = $state(null)
  function showWeather() {
    if (!s.weather || watching) return
    playing = false
    picking = tools = timerOpen = false
    wx = { status: 'loading' }
    getWeather().then(
      (w) => wx && (wx = { status: 'ok', ...w }),
      () => wx && (wx = { status: 'failed' })
    )
  }
  function stopWeather() {
    wx = null
    stageEl?.focus({ preventScroll: true })
  }
  $effect(() => {
    if (!s.weather) wx = null
  })
  // Its two words, in the languages the slides use.
  const wxWords = $derived(wx?.status === 'ok' ? { temp: labelRows(TEMPS[wx.band], s), sky: labelRows(wx.sky, s) } : null)
  const wxTime = $derived(wx?.at ? new Date(wx.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '')
  const wxSay = $derived(wxWords ? `${PLACE.name}: ${wx.temp}°F, ${rowsText(wxWords.temp)}, ${rowsText(wxWords.sky)}` : '')
  const speakWeather = () => wxWords && speak(weatherLines(wx, wxWords.temp.map((r) => r.lang)))

  // ---- keyboard ----
  function onKey(e) {
    wake()
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const tag = e.target?.tagName
    if (e.key === 'Escape') {
      if (timerOpen) {
        timerOpen = false
        timerBtn?.focus()
      } else if (tools) {
        tools = false
        toolsBtn?.focus()
      } else if (picking) picking = false
      else if (choosing) choosing = false
      else if (wx) stopWeather()
      else if (watching) stopWatch()
      else if (drawer) {
        drawer = false
        stageEl?.focus({ preventScroll: true })
      } else playing = false
      return
    }
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if ((tag === 'BUTTON' || tag === 'SUMMARY') && (e.key === ' ' || e.key === 'Enter')) return
    const k = e.key.toLowerCase()
    if (k === 'o') wx ? stopWeather() : showWeather()
    // The weather is on screen instead of the slides: their keys wait.
    else if (wx && [' ', 'arrowright', 'arrowleft', 'v', 'w', 'm'].includes(k)) return
    else if (k === ' ') toggle()
    else if (k === 'arrowright') step(1)
    else if (k === 'arrowleft') step(-1)
    else if (k === 's') drawer = !drawer
    else if (k === 'v') toggleVideo()
    else if (k === 'r') wx ? speakWeather() : speakSlide()
    else if (k === 'w') watching ? stopWatch() : (picking = !picking)
    else if (k === 'm') s.videoMuted = !s.videoMuted
    else if (k === 'b') tune ? stopMusic() : lastList ? startMusic(lastList) : s.music && (choosing = true)
    else if (k === 'f') fullscreen()
    else if (k === 't') {
      toggleTimer()
      if (!timerOpen) timerBtn?.focus()
    }
    else return
    e.preventDefault()
  }

  // A whole group of sets on or off, keeping the order of SETS. With a plan
  // it is the sets of the block playing now that change.
  function toggleGroup(g, allOn) {
    const want = new Set(cur.sets)
    for (const id of g.sets) allOn ? want.delete(id) : want.add(id)
    cur.sets = SETS.map((x) => x.id).filter((id) => want.has(id))
  }
  const toggleSet = (id) => toggleGroup({ sets: [id] }, cur.sets.includes(id))

  // Settings lists the groups; the sets inside them are shown when one is
  // wanted alone, and from the start when a group is only partly on.
  let single = $state(GROUPS.some((g) => g.sets.filter((id) => cur.sets.includes(id)).length % g.sets.length))
  // A set's own options are offered in Settings only while that set is in use.
  const used = $derived(setsInUse(s))
  const has = (...ids) => ids.some((id) => used.includes(id))

  function fixRange() {
    Object.assign(s, normalizeSettings($state.snapshot(s)))
  }
  // Back to the defaults, but the video link, the school day and the plan are
  // kept: those are set up once and are not part of the look.
  function reset() {
    const keep = $state.snapshot({ videoUrl: s.videoUrl, dayBar: s.dayBar, day: s.day, dayEnd: s.dayEnd, planOn: s.planOn, plan: s.plan, weather: s.weather, music: s.music })
    Object.assign(s, normalizeSettings(keep))
  }

  const L = {
    order: { inOrder: 'In order', shuffle: 'Mixed up' },
    letterCase: { upper: 'A', lower: 'a', both: 'Aa' },
    musicVol: { soft: 'Soft', medium: 'Medium' },
    numberStyle: { digit: 'Numeral', dots: 'Dots', both: 'Both' },
    mathTo: { 5: 'Up to 5', 10: 'Up to 10' },
    feelingMotion: { moving: 'Moving', still: 'Still' },
    words: { en: 'English', es: 'Español', both: 'Both' },
    esGender: { both: 'enojado/a', o: 'enojado', a: 'enojada' },
    skin: { mixed: 'Mixed', '1f3fb': 'Light', '1f3fc': 'Medium-light', '1f3fd': 'Medium', '1f3fe': 'Medium-dark', '1f3ff': 'Dark' },
    theme: Object.fromEntries(Object.entries(THEMES).map(([k, t]) => [k, t.label])),
    background: { plain: 'Plain', glow: 'Soft glow', dots: 'Dotted' },
    fill: { solid: 'Solid', outline: 'Outline', soft: 'Soft fill' },
    colorMode: { rainbow: 'Changing', one: 'One color' },
    size: { small: 'Small', medium: 'Medium', large: 'Large', full: 'Biggest' },
    drawerSide: { left: 'Left', right: 'Right' },
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
  // How big the picture is, as a share of the stage's shorter side. 'full' is
  // as big as fits once the words under it have their room: one row of words,
  // two (both languages), a letter's own small picture, or none at all.
  const SIZE = { small: 46, medium: 62, large: 76 }
  const k = $derived.by(() => {
    if (s.size !== 'full') return SIZE[s.size]
    if (!item || !s.showLabel || !rows.length) return 94
    return rows.length > 1 ? 79 : item.kind === 'glyph' && item.emoji ? 82 : 85
  })
</script>

<svelte:window onkeydown={onKey} onpointermove={wake} onpointerdown={wake} />

<!-- One setting as a row of choices to click. A number setting gives its own list. -->
{#snippet seg(key, legend, list = OPTIONS[key], lab = L[key], unit = '')}
  <fieldset class="fld">
    <legend>{legend}</legend>
    <div class="seg">
      {#each list as v}
        <label class:on={s[key] === v}><input type="radio" name={key} value={v} bind:group={s[key]} />{lab[v] ?? v + unit}</label>
      {/each}
    </div>
  </fieldset>
{/snippet}

<div
  class="look bg-{s.background}"
  class:drawer
  class:has-day={s.dayBar}
  class:side-left={s.drawerSide === 'left'}
  class:quiet={hideBar}
  style="--stage-bg:{theme.bg}; --stage-bg2:{theme.bg2}; --stage-ink:{theme.ink}; --stage-dot:{theme.dot}; --stage-font:{FONTS[s.font]}; --k:{k}"
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
  <div class="scene" id="focus-home" tabindex="-1" bind:this={stageEl} onclick={speakSlide} title="Click to hear it">
    {#if item}
      {#key slideKey}
        <div class="slide in-{s.entrance}">
          {#if item.kind !== 'title'}
            <div class="vis idle-{s.idle}">
              <Visual {item} {s} {color} {two} {still} {say} {pics} lang={s.words === 'es' ? 'es' : undefined} ink={theme.ink} />
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
    <button class="ww" class:lit={x.i === lit} onclick={() => speakWord(x)}>
      <span class="ww-pic" aria-hidden="true">{x.emoji}</span>
      {#each x.rows as r (r.lang)}
        <span class="ww-word" lang={r.lang}>{r.art ? r.art + ' ' : ''}{r.words.join(' ')}</span>
      {/each}
    </button>
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

  {#if wx}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
    <section class="wx" aria-label={wxSay || 'The weather'} onclick={speakWeather} title="Click to hear it">
      {#if wxWords}
        <p class="wx-place">{PLACE.name} · {wxTime}</p>
        <div class="wx-cols">
          {#each [['sky', wx.sky.emoji], ['temp', wx.temp + '°F']] as [key, big] (key)}
            <div class="wx-col">
              <span class="wx-big {key}" style="color:{theme.colors[theme.heat[wx.band]]}" aria-hidden="true">{big}</span>
              {#each wxWords[key] as r (r.lang)}
                <span class="wx-word" lang={r.lang}>{r.words[0]}</span>
              {/each}
            </div>
          {/each}
        </div>
        <!-- Cold to hot, with today's place on it: not color alone. -->
        <div class="wx-scale" aria-hidden="true">
          {#each theme.heat as c, i}
            <i class:on={i === wx.band} style="background:{theme.colors[c]}"></i>
          {/each}
        </div>
      {:else}
        <p class="wx-msg" role="status">
          {wx.status === 'loading' ? 'Looking outside…' : 'The weather could not be reached (offline, or blocked on this network).'}
        </p>
      {/if}
    </section>
  {/if}

  {#if choosing}
    <div class="pick" role="dialog" aria-modal="true" aria-label="Choose music">
      <div class="pick-grid">
        {#each PLAYLISTS as p (p.id)}
          <button class="btn tile" aria-pressed={tune === p.id} onclick={() => startMusic(p)}><span class="tile-pic" aria-hidden="true">{p.emoji}</span>{p.label}</button>
        {/each}
        {#if tune}<button class="btn tile close" onclick={() => ((choosing = false), stopMusic())}>Stop music</button>{/if}
        <button class="btn tile close" onclick={() => (choosing = false)}>Close</button>
      </div>
      <div class="vol">{@render seg('musicVol', 'Volume')}</div>
      {#if musicNote}<p class="wx-msg" role="status">{musicNote}</p>{/if}
    </div>
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
    {#if wx}
      <button class="btn primary big" onclick={stopWeather}>Back to slides</button>
      {#if wx.status === 'failed'}<button class="btn big" onclick={showWeather}>Try again</button>{/if}
    {:else if watching}
      <button class="btn primary big" onclick={stopWatch}>Back to slides</button>
      <button class="btn big" onclick={() => (s.videoMuted = !s.videoMuted)} aria-pressed={s.videoMuted}>{s.videoMuted ? 'Sound on' : 'Sound off'}</button>
      <button class="btn big" onclick={() => (picking = true)} aria-haspopup="dialog">Other video</button>
    {:else}
    <button class="btn" onclick={() => step(-1)} disabled={!deck.length}>Back</button>
    <button class="btn primary play" onclick={toggle} disabled={!deck.length}>{playing ? 'Pause' : 'Play'}</button>
    <button class="btn" onclick={() => step(1)} disabled={!deck.length}>Next</button>
    <span class="count mono">{deck.length ? index + 1 : 0}/{deck.length}</span>
    {#if block}<span class="count mono">Block {bi + 1}/{s.plan.length} · {left} min</span>{/if}
    {/if}
    <button class="btn big" class:primary={timerStatus !== 'idle'} bind:this={timerBtn} onclick={toggleTimer} aria-expanded={timerOpen}>
      <span aria-hidden="true">⏱️</span> <span class:mono={timerStatus !== 'idle' && timerStatus !== 'done'}>{timerText || 'Timer'}</span>
    </button>
    {#if tune}
      <button class="btn big" onclick={stopMusic} aria-label="Stop music: {PLAYLISTS.find((p) => p.id === tune)?.label}"><span aria-hidden="true">🎵</span> Stop</button>
    {/if}
    {#if !watching && !wx}
      <button class="btn big corner" bind:this={toolsBtn} onclick={() => ((timerOpen = false), (tools = !tools))} aria-expanded={tools}><span aria-hidden="true">🧰</span> Tools</button>
    {/if}
  </nav>

  <!-- Tools: what is used less often than the timer. A video with no link is not offered. -->
  {#if tools}
    <div class="tools" role="group" aria-label="Tools">
      {#if s.weather}<button class="btn big" onclick={() => tool(showWeather)}><span aria-hidden="true">🌡️</span> Weather</button>{/if}
      <button class="btn big" onclick={() => tool(() => (picking = true))} aria-haspopup="dialog"><span aria-hidden="true">📺</span> Watch</button>
      {#if s.music}<button class="btn big" onclick={() => tool(() => (choosing = true))} aria-haspopup="dialog"><span aria-hidden="true">🎵</span> Music</button>{/if}
      {#if vid}
        <button class="btn big" onclick={() => tool(toggleVideo)}><span aria-hidden="true">🎬</span> {pipOn ? 'Hide video' : 'Corner video'}</button>
      {/if}
      <button class="btn big" onclick={() => tool(() => (drawer = !drawer))}><span aria-hidden="true">⚙️</span> {drawer ? 'Close settings' : 'Settings'}</button>
    </div>
  {/if}

  <Timer bind:open={timerOpen} bind:status={timerStatus} bind:text={timerText} anchor={timerBtn} onLeft={s.corner === 'tr'} {reduced} color={theme.colors[3]} />

  {#if drawer}
    <aside class="drawer-panel" aria-label="Settings">
      <header>
        <h1>Looksee</h1>
        <span class="head-btns">
          <button class="btn small" onclick={fullscreen}>Full screen</button>
          <button class="btn small" onclick={() => (drawer = false)}>Close</button>
        </span>
      </header>

      {#if update}
        <p class="banner update">A new version is ready. <button class="btn small" onclick={update.reload}>Reload</button></p>
      {/if}

      <!-- Folded into sections, in the order a teacher needs them: what changes in
           class first and open, what is set up once below. A closed section says
           what it is set to. -->
      <details class="sec" open>
        <summary><h2>What to show</h2><span class="sum">{block ? `${s.plan.length}-block plan` : setsName(s.sets) || 'Nothing'}</span></summary>
        <label class="chk"><input type="checkbox" bind:checked={s.planOn} onchange={() => s.planOn && !s.plan.length && addBlock()} /> A plan: different sets in turn, a few minutes each</label>
        {#if s.planOn}
          <div class="fld" role="group" aria-label="Plan">
            {#each s.plan as b, i (b)}
              <div class="grp">
                <button class="btn grp-head blk" aria-pressed={i === bi} onclick={() => goBlock(i)}>{i + 1}. {setsName(b.sets) || 'No sets yet'} · {b.min} min</button>
                <!-- Only the block playing shows its minutes, ↑ and Remove. -->
                {#if i === bi}<div class="seg">
                  {#each MINUTES as m}
                    <label class:on={b.min === m}><input type="radio" name="min{i}" value={m} bind:group={b.min} aria-label="{m} minutes" />{m}</label>
                  {/each}
                  <button class="btn small" onclick={() => moveBlock(i)} disabled={!i} aria-label="Move block {i + 1} earlier">↑</button>
                  <button class="btn small" onclick={() => removeBlock(i)} disabled={s.plan.length < 2} aria-label="Remove block {i + 1}">Remove</button>
                </div>{/if}
              </div>
            {/each}
            <button class="btn small" onclick={addBlock} disabled={s.plan.length >= PLAN_MAX}>Add a block</button>
          </div>
          <p class="hint">
            Each block plays for its minutes, then the next begins. Minutes count only while the slides play. Click a block to
            play it now and change its minutes and its sets below.
          </p>
        {/if}
        <fieldset class="fld">
          <legend>{block ? `Sets in block ${bi + 1}` : 'Sets'}</legend>
          <!-- One click on a group turns it all on, or all off when it is all on. -->
          <div class="tiles">
          {#each GROUPS as g}
            {@const on = g.sets.filter((id) => cur.sets.includes(id)).length}
            <div class="grp">
              <button
                class="btn grp-head"
                aria-pressed={on === g.sets.length ? 'true' : on ? 'mixed' : 'false'}
                onclick={() => toggleGroup(g, on === g.sets.length)}
              ><span aria-hidden="true">{g.emoji}</span> {g.label}</button>
              {#if single && g.sets.length > 1}
                <div class="seg">
                  {#each g.sets as id}
                    <label class:on={cur.sets.includes(id)}><input type="checkbox" checked={cur.sets.includes(id)} onchange={() => toggleSet(id)} />{SETS.find((x) => x.id === id).label}</label>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
          </div>
          <label class="chk"><input type="checkbox" bind:checked={single} /> Choose single sets</label>
        </fieldset>
      </details>

      <details class="sec">
        <summary><h2>Words and speech</h2><span class="sum">{!s.showLabel ? 'No words' : s.words === 'both' ? 'English + Español' : L.words[s.words]}{s.speakSlides ? ', read aloud' : ''}</span></summary>
        <label class="chk"><input type="checkbox" bind:checked={s.showLabel} /> Show the word underneath</label>
        {@render seg('words', 'Words')}
        {#if s.words !== 'en'}{@render seg('esGender', 'Spanish feelings')}{/if}
        <label class="chk"><input type="checkbox" bind:checked={s.firstLetter} /> Highlight the first letter</label>
        <label class="chk"><input type="checkbox" bind:checked={s.articles} /> El / la with Spanish words</label>
        <label class="chk"><input type="checkbox" bind:checked={s.setNames} /> Name each set as it begins</label>
        {@render seg('wordDelay', 'Pause before the word', [0, 1, 2, 3, 4, 5], { 0: 'None' }, ' s')}
        {#if wait < s.wordDelay}
          <p class="hint">Each slide lasts {s.seconds} s, and the word always gets the last one.</p>
        {/if}
        <p class="hint">Click the slide to hear its words, in the language shown.</p>
        <label class="chk"><input type="checkbox" bind:checked={s.speakSlides} /> Read each slide aloud as it appears</label>
        <p class="hint">
          Voices on this device:
          {#each [['en', 'English'], ['es', 'Spanish']] as [k, name]}
            <span class="voice">{name}: {voiceFor[k] ? voiceFor[k].name : 'none'}</span>
          {/each}
        </p>
        {#if s.words !== 'en' && !voiceFor.es}
          <p class="hint bad">
            No Spanish voice on this device, so Spanish words are not read. On a Chromebook: Settings → Accessibility →
            Text-to-speech, and add a Spanish voice. Only voices kept on the device are used; online voices would send the
            words away.
          </p>
        {/if}
      </details>

      <details class="sec">
        <summary><h2>Pace</h2><span class="sum">{s.seconds} s each, {L.order[s.order].toLowerCase()}</span></summary>
        {@render seg('seconds', 'Seconds on each', [2, 3, 4, 5, 6, 8, 10, 15], {})}
        {@render seg('order', 'Order')}
        <label class="chk"><input type="checkbox" bind:checked={s.loop} /> Start over at the end{block ? ' of the plan' : ''}</label>
      </details>

      <!-- A set's own options, shown only for the sets that are in use. -->
      <details class="sec" hidden={!has('letters', 'numbers', 'adding', 'subtracting', 'shapes', 'colorShapes', 'feelings', 'gestures', 'body')}>
        <summary><h2>Options for these sets</h2></summary>
        <div hidden={!has('letters')}>
          {@render seg('letterCase', 'Letters')}
          <label class="chk"><input type="checkbox" bind:checked={s.letterWords} /> A word for each letter</label>
        </div>
        <div hidden={!has('numbers', 'adding', 'subtracting')}>{@render seg('numberStyle', 'Numbers')}</div>
        <div class="fld row" hidden={!has('numbers')}>
          <label>From <input type="number" min="0" max="20" bind:value={s.numberFrom} onchange={fixRange} /></label>
          <label>to <input type="number" min="0" max="20" bind:value={s.numberTo} onchange={fixRange} /></label>
        </div>
        <div hidden={!has('adding', 'subtracting')}>{@render seg('mathTo', 'Adding and subtracting')}</div>
        <label class="chk" hidden={!has('shapes', 'colorShapes')}><input type="checkbox" bind:checked={s.morph} /> Shapes change into each other</label>
        <!-- Apple's browsers always get the still pictures (APPLE), so they are not asked. -->
        <div hidden={APPLE || !has('feelings', 'gestures', 'body')}>{@render seg('feelingMotion', 'Faces and hands')}</div>
        <div hidden={!has('gestures', 'body')}>{@render seg('skin', 'Skin tone')}</div>
      </details>

      <p class="once">Set up once</p>

      <details class="sec">
        <summary><h2>School day</h2><span class="sum">{s.dayBar ? `${s.day[0].at} to ${s.dayEnd}` : 'Off'}</span></summary>
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
      </details>

      <details class="sec">
        <summary><h2>Weather</h2><span class="sum">{s.weather ? 'On' : 'Off'}</span></summary>
        <label class="chk"><input type="checkbox" bind:checked={s.weather} /> Weather in Tools: the temperature in {PLACE.name}</label>
        <p class="hint">
          The temperature outside as a big slide, with a word and a color for how it feels and a picture of the sky. The
          reading comes from Open-Meteo when Weather is clicked. It is the only thing besides YouTube that this app
          contacts: the request names {PLACE.name} and nothing about this device or class, and it is never made while this
          is off.
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Weather data by Open-Meteo.com</a>
        </p>
      </details>

      <details class="sec">
        <summary><h2>Music</h2><span class="sum">{s.music ? 'On' : 'Off'}</span></summary>
        <label class="chk"><input type="checkbox" bind:checked={s.music} /> Music in Tools: quiet tunes under the slides</label>
        {#if s.music}
          <p class="hint">
            It plays until stopped, softly, and goes quiet for a video with sound, for words read aloud and for the timer's
            chime. <b class="mono">{musicSaved} of {MUSIC_COUNT}</b> tunes are saved on this device for offline use.
          </p>
          {#if musicSaved < MUSIC_COUNT}<p><button class="btn small" onclick={keepMusic}>Save for this device</button></p>{/if}
          {#if musicNote}<p class="hint" role="status">{musicNote}</p>{/if}
        {/if}
        <p class="hint">{PLAYLISTS.map((p) => `${p.label}: ${p.credit}.`).join(' ')}</p>
      </details>

      <!-- Animals, Food, Things and Places come with no pictures: each device is given its own. -->
      <details class="sec">
        <summary><h2>Pictures</h2><span class="sum">{picsHave} of {THING_COUNT} added</span></summary>
        <p class="hint things">
          Animals, Food, Things and Places need pictures added on this device. They are kept here and never uploaded.
          {#if canKeep()}<b class="mono">{picsHave} of {THING_COUNT}</b> added.{:else}This browser cannot keep them.{/if}
        </p>
        {#if canKeep()}
          <div class="files">
            <label class="btn small file">Choose a folder<input type="file" webkitdirectory multiple onchange={addPics} /></label>
            <label class="btn small file">Choose pictures<input type="file" multiple accept="image/*,.avif" onchange={addPics} /></label>
            {#if picsHave}<button class="btn small" onclick={removePics}>Remove them</button>{/if}
          </div>
          {#if picsNote}<p class="hint" role="status">{picsNote}</p>{/if}
        {/if}
      </details>

      <details class="sec">
        <summary><h2>Videos</h2><span class="sum">{vid ? 'Link added' : 'No link'}</span></summary>
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
      </details>

      <details class="sec">
        <summary><h2>Look</h2><span class="sum">{L.theme[s.theme]}, {L.size[s.size]}</span></summary>
        {@render seg('theme', 'Theme')}
        {@render seg('size', 'Size')}
        {@render seg('background', 'Background')}
        {@render seg('fill', 'Drawing')}
        {@render seg('colorMode', 'Color')}
        {@render seg('font', 'Lettering')}
        {@render seg('entrance', 'Arrives with')}
        {@render seg('idle', 'While showing')}
        <p class="hint motion-note">Your device asks for reduced motion, so movement is off.</p>
        {@render seg('drawerSide', 'Settings open on the')}
        <label class="chk"><input type="checkbox" bind:checked={s.showProgress} /> Show the progress line</label>
      </details>

      <details class="sec">
        <summary><h2>Share this setup</h2><span class="sum">{setupName(s)}</span></summary>
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
          To keep a setup, open its page and click <b>☆</b> in the address bar. The bookmark is named after its sets and
          language, and opens this setup every time. To rename one, delete it, open the link again and click ☆.
        </p>
        <p class="hint">
          Or as its own app: Chrome’s <b>⋮</b> menu → <b>Cast, save and share</b> → <b>Install page</b> (or <b>Create
          shortcut</b>, with “Open as window”). On an iPad: Share → <b>Add to Home Screen</b>.
        </p>
      </details>

      <details class="sec">
        <summary><h2>Keys, reset and credits</h2></summary>
        <p class="hint keyhelp">
          <kbd>Space</kbd> play / pause · <kbd>←</kbd> <kbd>→</kbd> back / next · <kbd>S</kbd> settings · <kbd>V</kbd> video · <kbd>W</kbd> watch · <kbd>T</kbd> timer · <kbd>O</kbd> weather outside · <kbd>R</kbd> read aloud ·
          <kbd>M</kbd> sound · <kbd>B</kbd> music · <kbd>F</kbd> full screen · <kbd>Esc</kbd> close
        </p>
        <p><button class="btn small" onclick={reset}>Reset look and pace</button></p>
        <p class="hint">
          Faces, hands and body pictures are Noto Emoji by Google, used under CC BY 4.0.
          <a href="NOTICE.txt" target="_blank" rel="noopener">Credits</a>
        </p>
      </details>
    </aside>
  {/if}
</div>

<style>
  .look { position: fixed; inset: 0; overflow: hidden; --inset-l: 0px; --inset-r: 0px; --inset-b: 0px; --drawer-w: min(380px, 100vw); --bar-h: 0px; color: var(--stage-ink); background: var(--stage-bg); }
  .look.bg-glow { background: radial-gradient(circle at 50% 42%, var(--stage-bg2), var(--stage-bg) 70%); }
  .look.bg-dots { background: radial-gradient(var(--stage-dot) 3px, transparent 3.5px) 0 0 / 34px 34px var(--stage-bg); }
  /* Settings takes one side of the screen and everything else moves over. */
  .look.drawer { --inset-r: var(--drawer-w); }
  .look.drawer.side-left { --inset-r: 0px; --inset-l: var(--drawer-w); }
  .look.has-day { --bar-h: 50px; }
  .look.quiet { cursor: none; }

  /* School-day bar: one box per part, as wide as the part is long (never
     narrower than its pictures). Past parts are shaded; the line is now. */
  .day { position: absolute; top: 0; left: var(--inset-l); right: var(--inset-r); height: var(--bar-h); display: flex; gap: 3px; padding: 6px 8px 4px; }
  .part { position: relative; flex: 1 0 3em; min-width: 0; display: grid; place-items: center; overflow: hidden; border-radius: 8px; font-size: 22px; line-height: 1; white-space: nowrap; background: color-mix(in srgb, var(--stage-ink) 9%, transparent); }
  .part.past { background: color-mix(in srgb, var(--stage-ink) 24%, transparent); }
  .part.past span { opacity: 0.5; }
  .part i { position: absolute; inset: 0 auto 0 0; background: color-mix(in srgb, var(--stage-ink) 24%, transparent); border-right: 3px solid var(--stage-ink); }
  .part span { position: relative; }

  .scene { position: absolute; inset: var(--bar-h) var(--inset-r) calc(var(--inset-b) + 70px) var(--inset-l); container-type: size; display: grid; place-items: center; outline: none; cursor: pointer; }
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

  .prog { position: absolute; left: var(--inset-l); right: var(--inset-r); bottom: var(--inset-b); height: 6px; background: color-mix(in srgb, var(--stage-ink) 12%, transparent); }
  .prog i { display: block; height: 100%; background: color-mix(in srgb, var(--stage-ink) 55%, transparent); }

  .ctl { position: absolute; left: var(--inset-l); right: var(--inset-r); bottom: calc(var(--inset-b) + 18px); display: flex; justify-content: center; align-items: center; gap: 8px; flex-wrap: wrap; padding: 0 12px; pointer-events: none; }
  .ctl > * { pointer-events: auto; }
  .ctl .btn { min-height: 52px; padding-inline: 16px; }
  .ctl .play { min-width: 6.5em; }
  .count { font-size: 13px; padding: 4px 8px; border-radius: 6px; background: var(--surface); color: var(--muted); border: 1px solid var(--line); }
  .look.quiet .ctl:not(:has(:focus-visible)) { opacity: 0; }
  .look.quiet .ctl:not(:has(:focus-visible)) > * { pointer-events: none; }

  .pip { position: absolute; display: none; aspect-ratio: 16 / 9; border-radius: 12px; overflow: hidden; background: #000; border: 3px solid var(--stage-ink); box-shadow: 0 6px 24px rgb(0 0 0 / 0.25); max-width: calc(100vw - var(--inset-r) - var(--inset-l) - 32px); }
  .pip.on { display: block; }
  .pip-small { width: 240px; }
  .pip-medium { width: 360px; }
  .pip-large { width: 500px; }
  .pip-tl { top: calc(var(--bar-h) + 16px); left: calc(var(--inset-l) + 16px); }
  .pip-tr { top: calc(var(--bar-h) + 16px); right: calc(var(--inset-r) + 16px); }
  .pip-bl { bottom: calc(var(--inset-b) + 78px); left: calc(var(--inset-l) + 16px); }
  .pip-br { bottom: calc(var(--inset-b) + 78px); right: calc(var(--inset-r) + 16px); }
  .pip-host { position: absolute; inset: 0; }
  .pip-host :global(iframe) { width: 100%; height: 100%; border: 0; display: block; pointer-events: none; }
  /* Clicks never reach YouTube: no links out, no focus in the iframe. */
  .pip-shield { position: absolute; inset: 0; }

  /* Watch: the video in the middle, its words in a frame around it. */
  .watch { position: absolute; inset: var(--bar-h) var(--inset-r) calc(var(--inset-b) + 78px) var(--inset-l); container-type: size; display: grid;
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
  .ww { display: flex; flex-direction: column; align-items: center; padding: 0.6cqmin 1.6cqmin; border-radius: 14px; font-family: var(--stage-font); font-weight: 700; border: 0; background: none; cursor: pointer;
    color: var(--stage-ink); font-size: 3.6cqmin; line-height: 1.15; text-align: center; transition: background-color 0.6s; }
  .ww-pic { font-size: 2em; line-height: 1.1; }
  .ww.lit { background: color-mix(in srgb, var(--stage-ink) 12%, transparent); }
  @media (prefers-reduced-motion: no-preference) {
    .ww { transition: background-color 0.6s, transform 0.6s; }
    .ww.lit { transform: scale(1.15); }
  }

  /* Weather: the sky and the temperature side by side, their words under
     them, and a cold-to-hot scale with today's place on it. */
  .wx { position: absolute; inset: var(--bar-h) var(--inset-r) calc(var(--inset-b) + 78px) var(--inset-l); container-type: size; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3cqmin;
    background: var(--stage-bg); font-family: var(--stage-font); font-weight: 700; cursor: pointer; }
  .wx-place { margin: 0; font-size: clamp(16px, 4cqmin, 40px); opacity: 0.75; }
  .wx-cols { display: flex; align-items: flex-start; justify-content: center; gap: 8cqw; }
  .wx-col { display: flex; flex-direction: column; align-items: center; gap: 1cqmin; }
  .wx-big { font-size: min(34cqh, 22cqw); line-height: 1.1; white-space: nowrap; }
  .wx-word { font-size: min(8cqh, 6cqw); line-height: 1.1; white-space: nowrap; }
  .wx-scale { display: flex; align-items: center; gap: 1cqmin; width: min(70cqw, 90cqh); height: 5cqmin; }
  .wx-scale i { flex: 1; height: 40%; border-radius: 99px; opacity: 0.35; }
  .wx-scale i.on { height: 100%; opacity: 1; outline: 3px solid var(--stage-ink); outline-offset: 2px; }
  .wx-msg { margin: 0; padding: 16px; font-size: clamp(18px, 4cqmin, 34px); text-align: center; max-width: 24em; }

  /* The video picker: big tiles, one click each. */
  .pick { position: absolute; inset: 0; z-index: 5; display: grid; place-items: center; background: color-mix(in srgb, var(--stage-bg) 92%, transparent); padding: 24px; overflow: auto; }
  .pick-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 260px)); gap: 16px; justify-content: center; width: min(100%, 900px); }
  .tile { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 160px; font-size: 20px; text-align: center; }
  .tile-pic { font-size: 64px; line-height: 1; }
  .tile.close { min-height: 160px; font-size: 18px; }
  .tile[aria-pressed='true'] { background: var(--brand); color: var(--brand-ink); border-color: var(--brand); }
  .vol { margin-top: 16px; padding: 4px 16px 12px; border-radius: 12px; background: var(--surface); color: var(--ink); }
  .ctl .big, .tools .big { min-height: 52px; padding-inline: 22px; font-size: 17px; }
  /* Tools sits in the bottom left corner, where a projector's mouse usually is, and its panel
     rises from there. */
  .ctl .corner { position: absolute; left: 12px; bottom: 0; }
  .tools { position: absolute; z-index: 3; left: calc(var(--inset-l) + 12px); right: var(--inset-r); bottom: calc(var(--inset-b) + 84px); width: max-content; max-width: calc(100vw - var(--inset-l) - var(--inset-r) - 24px); padding: 12px; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 6px 24px rgb(0 0 0 / 0.22); }

  .drawer-panel { position: absolute; top: 0; right: 0; bottom: 0; width: var(--drawer-w); overflow-y: auto; padding: 14px 16px 40px; background: var(--surface); color: var(--ink); border-left: 1px solid var(--line); font-size: 15px; }
  .look.side-left .drawer-panel { right: auto; left: 0; border-left: 0; border-right: 1px solid var(--line); }
  .drawer-panel header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 14px; }
  .head-btns { display: flex; gap: 6px; }
  h1 { font-size: 20px; margin: 0; }
  /* Settings in sections that fold. The heading row is the whole width and a
     comfortable height to click; a closed section says what it is set to. */
  .sec { border-top: 1px solid var(--line); }
  /* An option that does not apply is hidden, whatever display its row is given. */
  .sec [hidden] { display: none !important; }
  /* The heading and what the section is set to share one line; a long summary ends in "…". */
  .sec > summary { display: flex; align-items: baseline; gap: 12px; padding: 13px 0; cursor: pointer; }
  .sec > summary { list-style: none; }
  .sec > summary::-webkit-details-marker { display: none; }
  .sec > summary::before { content: ''; flex: none; width: 7px; height: 7px; border: solid var(--muted); border-width: 0 2px 2px 0; transform: translateY(-2px) rotate(-45deg); }
  .sec[open] > summary::before { transform: translateY(-4px) rotate(45deg); }
  .sec[open] > summary { margin-bottom: 4px; }
  h2 { display: inline; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin: 0 0 0 4px; }
  .sum { flex: 1; min-width: 0; text-align: right; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--muted); font-size: 14px; }
  .sec[open] .sum { display: none; }
  .once { margin: 26px 0 8px; font-size: 14px; font-weight: 700; }
  .fld { display: block; border: 0; padding: 0; margin: 0 0 12px; min-width: 0; }
  .fld legend, .fld > span { display: block; padding: 0; margin-bottom: 4px; color: var(--muted); font-size: 14px; }
  .fld.row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .fld input[type='url'], .fld input[type='number'], .fld input[type='time'], .fld input[type='text'] { border: 1px solid var(--line); border-radius: 6px; background: var(--sunk); padding: 6px 8px; }
  .fld input[type='url'] { width: 100%; }
  .fld input[type='number'] { width: 4.5em; }
  .day-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .day-row input[type='text'] { width: 5.5em; font-size: 18px; }
  .day-row .hint { margin: 0; flex: 1; }
  .seg { display: flex; flex-wrap: wrap; gap: 6px; }
  .seg label { position: relative; border: 1px solid var(--line); border-radius: 6px; padding: 6px 11px; cursor: pointer; font-weight: 600; background: var(--surface); color: var(--muted); }
  /* Chosen: a pale tint, a brand edge and a check, so it never rests on color alone. Solid
     brand is kept for one thing, the plan block playing now. */
  .seg label.on, .grp-head[aria-pressed='true']:not(.blk) { background: var(--pick); color: var(--ink); border: 2px solid var(--brand); padding: 5px 10px; }
  .seg label.on:has([type='checkbox'])::before, .tiles .grp-head[aria-pressed='true']::before { content: '✓ ' / ''; }
  .seg input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
  .seg label:has(:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; box-shadow: var(--ring); }
  .chk { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; }
  .chk input { width: 18px; height: 18px; accent-color: var(--brand); }
  .hint { color: var(--muted); font-size: 14px; margin: 0 0 12px; }
  .hint.bad { color: var(--bad); }
  .grp { margin-bottom: 6px; }
  [aria-label='Plan'] .grp { margin-bottom: 8px; }
  /* Groups two to a row, unless their single sets are showing under them. */
  .tiles:not(:has(.seg)) { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px; margin-bottom: 10px; }
  .tiles:not(:has(.seg)) .grp { margin: 0; }
  .grp .seg { margin-top: 6px; }
  .hint.things { margin: 8px 0; }
  .files { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
  /* A button that opens the device's file chooser: the real input lies over it, unseen. */
  .file { position: relative; overflow: hidden; cursor: pointer; }
  .file input { position: absolute; inset: 0; opacity: 0; cursor: pointer; font-size: 0; }
  .file:has(:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; box-shadow: var(--ring); }
  .grp-head { display: block; width: 100%; min-height: 40px; text-align: left; font-size: 16px; }
  .blk[aria-pressed='true'] { background: var(--brand); color: var(--brand-ink); border-color: var(--brand); }
  .grp-head[aria-pressed='mixed'] { border: 2px solid var(--brand); }
  a.btn { text-decoration: none; display: inline-flex; align-items: center; }
  .voice { display: inline-block; margin-left: 0.6em; }
  .link { width: 100%; box-sizing: border-box; font: 13px/1.4 ui-monospace, monospace; padding: 8px; margin-bottom: 8px; }
  .keyhelp { line-height: 2; }
  .motion-note { display: none; }

  /* Narrow screens: the drawer becomes a bottom sheet so the stage stays visible. */
  @media (max-width: 760px) {
    .look.drawer, .look.drawer.side-left { --inset-r: 0px; --inset-l: 0px; --inset-b: 58vh; }
    .scene { bottom: calc(var(--inset-b) + 124px); }
    .ctl { gap: 6px; }
    .ctl .btn { padding-inline: 11px; font-size: 15px; }
    .ctl .count { display: none; }
    .ctl .corner { position: static; }
    .tools { left: var(--inset-l); margin: 0 auto; bottom: calc(var(--inset-b) + 142px); }
    .drawer-panel, .look.side-left .drawer-panel { top: auto; left: 0; right: 0; width: auto; height: var(--inset-b); border-left: 0; border-right: 0; border-top: 1px solid var(--line); }
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
