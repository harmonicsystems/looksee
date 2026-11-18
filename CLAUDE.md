# Looksee — architecture & working notes

A calm screen that plays first concepts one at a time: letters, numbers, shapes, colors and
opposites drawn by code, and feelings, gestures and body parts shown as animated emoji. A bar
along the top shows where the school day is, and a YouTube video can sit in a corner. Local-first
PWA: no accounts, no backend, nothing collected.

Repo `harmonicsystems/looksee`. Served by GitHub Pages at `https://harmonicsystems.github.io/looksee/`
until `looksee.harmonic-systems.org` is pointed at it.

Looksee began as "Look & See", a second page inside the Clip Choice checkout
(`harmonicsystems/clip-choice`), and was split into its own repo on 2026-11-10. Where things
stand (what is unverified, open decisions) is `docs/STATUS.md`; update it when that changes.
Sibling projects with shared conventions: `harmonicsystems/clip-choice`, `harmonicsystems/SOAP`,
`harmonicsystems/transcribe`.

---

## Hard constraints

- **Nothing leaves the device except YouTube, and the weather when a teacher has turned it on.**
  The only network traffic besides the site's own files: the IFrame API script from
  `www.youtube.com` (loaded lazily, the first time a video is started), the player from
  `www.youtube-nocookie.com`, and, only with the Weather setting on and only when the weather is
  opened, one request to `api.open-meteo.com` (see "Weather"). No analytics, no CDN fonts, scripts or
  images. The emoji pictures are copies in this repo; the app never loads them from Google.
  Speech uses only the device's own voices (`localService`): Chrome's online voices send the text
  to Google.
- **Nothing is collected.** No names, no logging. The only stored data is the settings, in
  `localStorage` (`look-settings-v1`).
- **Starts paused** (no auto-playing media). Reduced motion turns entrance and idle animation off
  and shows still pictures.
- **Mouse-only must work too.** The classroom it is made for has a Chromebook with a mouse and no
  keyboard: everything a teacher needs during class takes only clicks on large targets, no typing.
- **Keyboard-only must work.** `Space` play/pause, `←` `→`, `R` read aloud, `S` settings, `V` video, `W` watch, `T` timer,
  `O` weather, `M` sound, `B` music, `F` full screen, `Esc`. Focus must never get trapped in the YouTube iframe.
- **Never show YouTube's end screen or recommendations.** The corner video has no pause on
  purpose (a paused embed shows a "more videos" shelf): it is either playing or destroyed, and it
  loops by seeking back just before the end. It takes no clicks, except while an ad is probably on
  and for 20 s after ⏭️ Skip ad, so YouTube's own Skip button can be pressed (see Watch ▸ Ads).
- **The site may be served from `/` or from `/looksee/`.** Nothing in `src/` may assume `/`:
  pictures and the credits link are requested relative to the page, and Vite rewrites the absolute
  paths in `index.html` and CSS. The deploy workflow passes `BASE_PATH`.
- Accessibility: Atkinson Hyperlegible (self-hosted, `public/fonts`), a two-tone focus ring
  (yellow with a dark edge), light + dark controls, four stage themes including high contrast.
- Build gates (`npm run build`): app JS ≤ 72 KB gzipped, service worker included
  (`scripts/check-bundle-size.mjs`; 71.3 KB now, 0.7 KB under. David raised it on 2026-11-15 from 60 to 62 for
  the timer, to 64 for the weather, to 66 for the timer's faces, on 2026-11-16 to 68 for background music,
  on 2026-11-18 to 70 for the Our day words, and the same day to 72 for sets by the school day) and WCAG AA on both control palettes
  (`scripts/check-contrast.mjs`). The stage themes are held to their own ratios by the tests. No
  runtime dependencies.

## Tech stack

Svelte 5 (runes, plain Svelte) + Vite 6 (Node 20.17 here, 22 in CI) · `vite-plugin-pwa`
(`registerType: 'prompt'`, never auto-reload mid-play) · Vitest for the pure modules.

## File map

Everything in `src/` except the three `.svelte` files, `main.svelte.js`, `pip.js`, `youtube.js`,
`awake.js`, `chime.js`, `speak.js`, `home.js`, `local.js` and `outside.js` is pure logic and tested.

- `index.html` → `src/main.svelte.js` → `App.svelte`: the stage, the control bar that fades while
  playing, the settings drawer, the school-day bar, the corner video and the **window-level
  keyboard handler**.
- `Visual.svelte` — draws one slide by `kind` (`glyph | number | chart | shape | color | mix | sum | pair | picture`;
  a `title` slide is words only and is drawn by `App.svelte`).
- `concepts.js` — the sets as data + `buildDeck(settings, rng)` + `dotLayout` + `labelRows`. Add a
  concept here, with its word in English (`label`) and Spanish (`es`, plus `art` for a noun).
- `morph.js` — shape outlines as points, and changing one shape into another (below).
- `settings.js` — `DEFAULTS`, `OPTIONS`, `normalizeSettings`, stage `THEMES`. `deckKey(s)` changes
  exactly when the deck must be rebuilt (and reshuffled): `DECK_KEYS`, plus set names when they
  would actually appear. Look-only settings must never be in it.
- `day.js` — the school-day schedule and its parts' own sets (below): `partAt`, `partEnd`, `clock12`.
- `plan.js` — a plan of timed blocks (below): `normalizePlan`, `blockDone`, `minutesLeft`, `blockAfter`.
- `timer.js` — the timer's state and arithmetic (below). `Timer.svelte` — its sheet, clock and
  "Time's up". `chime.js` — its two notes. `awake.js` — `keepAwake`, the one screen wake lock.
- `share.js` — settings as a link (`linkQuery`, `linkSettings`, `setupName`, `setsName`). `home.js` — `setHome`,
  the per-link title and manifest (not pure).
- `speech.js` — `speechLines` (what to say for a slide) and `pickVoice` (pure). `speak.js` — `speak`,
  the Web Speech API (not pure).
- `videos.js` — `VIDEOS`, the preset videos for Watch with their words, and `sides(n)`.
- `routine.js` — `ROUTINE`, the Our day word sets (below).
- `pip.js` — `PipPlayer`, the corner video and the Watch video. `youtube.js` — `loadApi`. `link.js` — `videoId`,
  `startSeconds` (reads a link's `?t=`).
- `weather.js` — the place, the temperature bands and sky words, reading Open-Meteo's answer (pure).
  `outside.js` — `getWeather`, the one `fetch` in the app (not pure).
- `music.js` — `PLAYLISTS`, `VOLUMES`, `duckLevel` (pure). `player.js` — `playMusic`, `stopMusic`, `dip`,
  `saveMusic` on one `<audio>` (not pure).
- `styles.css` — control palettes (parsed by the contrast gate) and base styles.
- `public/feelings`, `public/people` — the emoji pictures. `public/NOTICE.txt` — their credits.
- `scripts/music.mjs` — renders the Nursery tunes into `public/music/` (`npm run music`, needs ffmpeg).
- `scripts/fetch-pictures.mjs`, `scripts/check-bundle-size.mjs`, `scripts/check-contrast.mjs`.
- `tests/looksee.test.js`.

## Picture sets (Feelings, Gestures, Body)

Google's animated Noto Emoji (CC BY 4.0), **self-hosted**: `public/feelings/` and `public/people/`
hold `<code>.avif` (animated) and `<code>.svg` (still) for everything `pictureFiles()` lists.
`public/NOTICE.txt` is the attribution; the drawer's Credits link opens it.

- **To add or swap one:** a line in `FEELINGS`, `GESTURES` or `BODY` (`{ label, emoji }`; the file
  name is derived from the emoji), then `npm run pictures` (the only thing that contacts Google,
  at dev time; `-- --dry` lists what it would fetch and how big) and commit the files. A test
  fails if a picture is missing or left over. Not every emoji has an animation (mouth, tongue and
  tooth do not).
- **AVIF on purpose:** the same animation is ~500 KB as WebP and ~2 MB as GIF, and Lottie would
  need a player (a runtime dependency, and most of the JS budget).
- **Fallbacks:** `Visual.svelte` shows the best picture the browser manages: moving AVIF → still
  SVG → the device's own emoji as text, in the same skin tone. Still is also used for the "Still"
  setting and for `prefers-reduced-motion`. The still is a separate file because an animation's
  first frame is often a neutral face, not the feeling.
- **Safari shows them still.** Safari, and every browser on an iPhone or iPad, draws an animated
  AVIF on a black square: it loses the clear background (David saw it on 2026-11-15). So
  `App.svelte` treats `navigator.vendor` starting with "Apple" like the Still setting, and Settings
  does not offer Moving or Still there. Not seen in Safari since the change; if Apple fixes it,
  remove `APPLE`.
- **Skin tones:** hands and body parts come in the five tones (`TONES`; `plain: true` marks the
  ones with none). `buildDeck` deals them like cards — shuffle five, hand out, reshuffle — so the
  mix is random but even. `round` in `App.svelte` rebuilds the deck each time it starts over, so
  every loop is dealt again (and a mixed-up deck is mixed again). The `skin` setting can hold one
  tone instead.
- **Offline:** every picture is precached (220 files, 5.4 MB), so the whole app works offline
  once the service worker has installed; only the corner video needs a connection. Each precache
  entry also costs bytes of service worker, which count toward the JS budget: the pictures are
  about 5 KB of it. To test offline for real, build, start the `looksee-built` preview
  (`.claude/launch.json`, `vite preview` on port 4178), let it load, stop the server and reload.

## Things: sets whose pictures each device adds for itself

Eighteen sets of everyday pictures (`src/things.js`), 223 in all, in four groups marked `own` in
`GROUPS`: 🐾 Animals (Pets and farm, Wild animals, Sea animals, Birds and bugs), 🍎 Food (Food and
drink, Fruit, Vegetables), 🧸 Things (Clothes, Toys, At home, At school, Transportation,
Outside, Music, Sports, Tools) and 🌍 Places (Around town, Space). **The code is published; the pictures are not.**

- **The pictures are from the Thiings library (thiings.co). David holds a paid licence for it**
  ("Lifetime Access (Legacy)", honoured as the Indie tier; seen on his billing page on
  2026-11-15): commercial use, "apps, platforms, and tools", web use, no attribution. So showing
  them in Looksee is licensed. What every tier forbids is making the icons "available for
  download as standalone assets", and the terms say nothing about a public source repo.
  **David chose to keep them out of this public repo and off the site** (2026-11-15): each device
  adds its own. `public/things/` is ignored by git (in `.gitignore`, and in this checkout's
  `.git/info/exclude` so that no branch can add them), and it is left out of the offline store
  (`globIgnores` in `vite.config.js`). A test fails if either guard is removed. Committing them
  is David's decision to make, not a default: ask first.
- **A device is given its own copies.** Settings ▸ Pictures has "Choose a folder" and "Choose
  pictures": the files are read on the device, kept in the browser's Cache
  Storage (`looksee-things`) and shown from there (`src/local.js`). Nothing is uploaded, so
  "nothing leaves the device" still holds; Chrome's own folder dialog says "upload", which is its
  word for handing files to a page. A file is matched to a thing by its name (`thingName`:
  `dog.avif`, `Fire Truck.png`, or the library's own `horse-domestic.png`). The pictures stay
  until the browser's data for the site is cleared, and work offline. Adding a folder again adds
  whatever is new in it.
- `npm run things` (`scripts/things.mjs`) makes those files: it copies the pictures listed in
  `src/things.js` out of David's own copy of the library (`~/Code/thiings-demo`, or
  `THIINGS_DIR`), crops each to the thing itself and saves a 512 px AVIF of about 11 KB (223
  pictures, 2.4 MB) in `public/things/`. It contacts nobody and needs ImageMagick. The dev server
  serves that folder, so on David's Mac the pictures show without being added. **David keeps a
  copy of the folder at `~/Desktop/things` to hand to a classroom device**: after `npm run
  things`, bring it up to date with `rsync -a public/things/ ~/Desktop/things/`.
- A thing is a `picture` slide with `one: true`: a single still file, no SVG and no emoji behind
  it. `Visual.svelte` shows the device's own copy when there is one (`pics`), else the file under
  `things/`, else nothing but the word. On the live site that second step is a 404 for each thing
  with no picture on the device (harmless; the console reports it).
- The sets are off for a new visitor, who has no pictures for them.
- **Sets are picked by hand, and every picture is looked at first.** The library's own categories
  include alcohol, weapons, military vehicles, underwear and brand names, 41 titles appear twice,
  and its tags are machine-made (the giant anteater is tagged "insect"). Its "Water" is a
  waterfall and its "shoes" carry a sports brand's mark, so neither is used. A thing whose word is
  the same in both languages is left out (mango, kiwi, piano, taco, pizza). People are drawn as
  faceless uniforms with no skin tones, so the emoji sets stay the ones for people.
- **Each thing is a line of text** in `things.js` (`dog,perro,el`, with the library's file name
  fourth when it is not the English word), and they count toward the size gate: the 223 cost
  about 2.5 KB gzipped, less than as lines of code. A much bigger library needs its
  words loaded apart from the app.
- **Some pictures have an English word on them** (the library and the store in Around town say
  LIBRARY and SHOP), which shows even when the words are Spanish only. The restaurant, café,
  museum and bank were left out for that. A thing already in another set is not used twice
  (rocket, moon, sun, star), and the church was left out as religious.
- Not built: "goes together" slides from the library's tags, and its pictures for letter words
  and Watch words. Runners-up for more sets: getting ready (toothpaste, towel, mirror), the
  kitchen, and more animals.

## Our day: words for the routines of a school day

The class's teacher sent her schedule (2026-11-18) and asked for words on screen for each part of
it. 🏫 **Our day** (`src/routine.js`) is seven sets of words, each drawn as the device's own emoji
above the word: Good morning (arrival and classroom expectations), Lining up, Core words, Asking
(requesting phrases for snack and lunch), Five senses (for trying new foods), Math words and Going
home (packing up and the bus).

- **Each word is a line of text,** `label,es,art,emoji` (like `things.js`, to spare the size
  gate), with no commas inside a word. A phrase ("more please", "all done") is one word here.
- **A word slide is a `picture` with `word: true`.** `Visual.svelte` draws its emoji as text from
  the start (no `<img>`, so no 404) and `App.svelte` does not preload a file for it. Everything
  else is shared with the other sets: the Words settings, el / la, speech, set names, plans,
  settings links and bookmark names ("🏫 Going home · EN").
- **The lists are first drafts for the teacher to correct;** she offered more detail once the
  shape was settled. The Spanish is as unchecked as the rest. Directions are the familiar
  command (mira, siéntate, espera), and only nouns take el / la ("ayuda" and "silencio" said as a
  request have none). No word is written "o/a": that form follows the child's `esGender`, and
  these words describe food and things ("frío", not "frío/a"). Emoji are Emoji 13 or older,
  since a word slide has no picture file to fall back on (🟰 was blank on older Windows). Tests
  hold all of that, and that every word has Spanish and an emoji.
- **A Watch preset can use a set as its words:** `words: ROUTINE.arrival`. The Aquarium does;
  the teacher's other videos are waiting for links (`docs/STATUS.md`).
- One bookmark per part of her day is the way to switch: `docs/teacher-links.md`.

## Seen from across a classroom

- **The picture is as big as fits** (`size: 'full'`, "Biggest", the default). `k` in
  `App.svelte` is the picture's share of the stage's shorter side: 94 with no words, 85 with one
  row, 82 for a letter with its small picture, 79 with both languages. Those leave the words their
  room and a little for the float and breathe motions; change them only with the sweep (every
  slide, both languages, widest font, laptop and phone shapes). A device whose saved settings
  still held the old default, Medium, is moved to Biggest once (`upgrade` in `settings.js`).
- **Settings opens on the left** (`drawerSide`, default `left`), because the mouse of a projector
  or board usually sits at its left. Everything else moves over by `--inset-l` or `--inset-r`.
- **Full screen has a button** in the Settings header, since a classroom often has no keyboard.

## Shapes that change into each other

One shape slide after another does not cut: the new shape starts as the old one and changes into
itself over 0.7 s (`morph` setting, off under reduced motion). The idea is from David's Lottie
shape playground (`~/Code/lottie-shape-playground`), which gives a triangle and a circle the same
six points. **Looksee does not ship a Lottie player** (62 KB gzipped, more than the whole app):
the browser draws the shapes itself.

- `morph.js` (pure): every shape is an outline (`polygon`, `curves`, `ellipse`) `resample`d to the
  same `POINTS` (120), clockwise from the top. Each segment's first point is always kept, so
  corners stay exact. `mix(a, b, t)` slides point i to point i. Matching points by their order
  along the outline was compared with matching them by angle from the centre, and is better: by
  angle, plain shapes pinch into eight-pointed in-betweens.
- **Only the right-hand half of a shape is described and sampled; the left half is its mirror
  image.** Sampling the whole outline shared the points out unevenly (41 / 39 / 40 on the
  triangle), so symmetrical shapes leaned sideways mid-change. Every shape must therefore be the
  same on both sides, start at its top-middle and run clockwise (a flat-topped one starts mid-way
  along its top edge, like the square).
- Any pair works: a test changes every shape into every other and fails if the outline crosses
  itself or pinches on the way, and another checks every shape is exactly symmetrical.
- **The order of `SHAPES` is the order they play in, and it is chosen as geometry:** triangle,
  diamond, square, rectangle, pentagon, hexagon, circle, oval, heart, star. The corners count up
  (3, 4, 4, 4, 5, 6) until the shape is round, then the round shapes, then the star, which changes
  back into the triangle when the set loops. The diamond comes before the square so that the
  rectangle never has to change into the diamond, the longest move among the four-cornered
  shapes (the mean distance a point travels was measured for every pair). A new shape goes where
  its corners put it, not at the end. The color + shape set plays in the same order.
- **One picture stays on screen through a run of shape slides.** `App.svelte` keys the slide by
  `runStart(deck, index)` for shapes (by `index` for everything else), so `Visual` is not
  re-created; its `item` changes and its outline moves from wherever it is now to the new shape.
  Stepping on mid-change continues from there, and the idle float is not restarted. The words are
  keyed by `index` inside, so they are still made fresh for each slide. The entrance animation
  plays on the first shape of a run only.
- The change runs on animation frames, with a timer that finishes it if no frames come (a
  background tab), so the old shape is never left under the new word. Color changes by a CSS
  transition on the same path.

## Words

The `words` setting shows the word under a slide in English, Spanish or both. `labelRows(item,
settings)` returns one row per language (two words in a row for a pair of opposites); it is read
at render time, so changing the language does not rebuild the deck. Each row carries a `lang`
attribute, and the slide's name for a screen reader follows the words shown (`rowsText`).

- **Letter words** (`letterWords`): `LETTERS` has one thing per letter whose name starts with that
  letter in both languages (airplane / avión), with a small picture from the device's own emoji
  where one fits (Q, X and Z have none). A test checks both words start with the letter.
- **El / la** (`articles`): Spanish nouns carry `art` and show it; adjectives, numbers, colors,
  feelings and the verb-like gestures have none.
- **First letter** (`firstLetter`): styled with `::first-letter`, so the word stays one piece of
  text for a screen reader. It takes the slide's color and an underline, so it does not rely on
  color alone. On color and color + shape slides it is plain ink: the picture has a color of its
  own there, and "red" with a blue first letter would contradict it.
- **Pause before the word** (`wordDelay`, seconds): the word stays hidden for that long after the
  picture, by a CSS delay on the re-created label. It always gets the last second of the slide.
- **Color + shape slides** (`colorShapes` set): each shape in a dealt color, "red circle / círculo
  rojo". Spanish puts the color last and matches it to the noun (`esF`: "estrella amarilla").
- **Mixing colors** (`mixing` set): `MIXES` names three colors from `COLORS` (paint mixing, as
  taught in class), so a result is exactly what the Colors set shows. Two blobs slide together and
  their overlap is the color they make; under reduced motion they start overlapped. The words are
  one sentence per language, "red + yellow = orange" / "rojo + amarillo = anaranjado".
- **Adding and subtracting** (`adding`, `subtracting` sets): `mathFacts(op, max)` lists every fact
  within the `mathTo` setting (5 or 10) with no zeros; up to 5 all 10 play, up to 10 a round deals
  10 of the 45. A `sum` slide follows `numberStyle`: the sentence "2 + 3 = 5", dots in rows of five,
  or both. **Color-coded:** each number in the sentence is the color of its dots (`two` in
  `App.svelte`: two theme colors three apart, whatever the Color setting). Adding: the groups slide
  together, then the answer appears in ink. Subtracting: the dots start in the first number's color,
  the ones taken away turn the second number's color and fade away one by one, and the answer
  appears in the color of what is left. Words "two plus three is five" / "dos más tres son
  cinco" ("es" when the answer is one).
- **Count to 100** (`hundred` set, its own group, 💯; asked for 2026-11-18): a hundred chart, one
  slide per number, counting by 1s, 5s or 10s (`countBy`, a deck key; 100, 20 or 10 slides). What
  has been counted is shaded in ink (the stops when counting by 5s or 10s a little more), so the
  chart stays calm while the slide color changes; the number now is drawn last, bigger and in the
  slide color, and grows in (not under reduced motion). **One chart stays on screen through the
  count**, like shapes: `runStart` runs across `chart` slides and `slideKey` uses it, so the chart
  is not faded in again for every number. Words to 100 come from `numberWord(n, lang)`
  ("forty-seven", "cuarenta y siete", "veintiséis", "cien"). Mixed up, its slides stay in order as
  one run at a random place among the others, since each chart shades what came before. The lit
  number sits on its own square, a little bigger, so its neighbours stay readable; numbers not yet
  counted are ink at 70% (at least 5:1 in every theme). It is its own group because inside
  Letters & Numbers it would make that group partly on for every new visitor (and rename their
  "Letters & Numbers" bookmarks).
- **Set names** (`setNames`): a `title` slide before each set, when more than one set plays and
  they play in order (`namesSets`). They show even when the words under the pictures are hidden.
- Long words are drawn smaller instead of running off the screen: the label gets its longest
  word's length as `--len` (`labelLen`) and caps its font size at `150cqw / len`. 150 was chosen
  from the fonts' real letter widths: it keeps the widest label under 80% of the width in
  Atkinson and on screen in the wider fonts it can fall back to. Check with the sweep (step
  through every slide, Both languages, largest size, phone and laptop shapes) after adding words.

- Every concept has `label` (English) and `es` (Spanish). `label` is also what the tests and the
  code use to name a slide, whatever language is showing. A test fails if a concept has no Spanish.
- The Spanish is Latin American as heard in US classrooms (anaranjado, rosa, café, morado,
  angosto, audífono). Words that change with gender are written "enojado/a". **It has not been
  checked by a Spanish speaker.**
- Only the words on the slides change. Letters stay the 26 English ones (no Ñ), and the controls
  and Settings stay in English.

## Speech

The browser's own speech (Web Speech API, `speechSynthesis`): no dependency, no files. **A click on
the slide says its words** (it no longer pauses: Play/Pause is the button and `Space`); `R` does the
same. "Read each slide aloud as it appears" (`speakSlides`, off by default) says each slide while
playing, once its word shows. In Watch, a word around the video is a button that says itself, with
the video turned down (`PipPlayer.setVolume`) while it speaks. Nothing speaks before a click.

- `speechLines(item, rows)` follows the words shown: one line per language, each said by that
  language's voice. "+" / "=" are said as "plus" / "más" and "equals" / "es igual a"; a letter
  slide's English line starts with the letter ("A. airplane"); no words shown → the slide's `say`.
- **Voices:** `pickVoice` takes only `localService` voices (online voices would send the words
  away), preferring en-US, then es-US, es-MX, any es. A language with no local voice is skipped,
  and Settings ▸ Words and speech says which voices the device has and how to add a Spanish one.
- **Spanish feelings** that change with gender are written "enojado/a" in `FEELINGS`.
  `esGender` (`both` | `o` | `a`) shows "enojado/a", "enojado" or "enojada" (`genderForm`, applied
  in `labelRows`, so it is look-only, not in `DECK_KEYS`); "enojado/a" is said "enojado, enojada".
  Shown in Settings only when Spanish is. A settings link carries it: one bookmark per child.

## Watch: preset videos with words around them

The **Watch** button (or `W`) opens big tiles, one per entry in `VIDEOS` (`src/videos.js`), plus
"Your link" when Settings has a video link. One click pauses the slides, stops the corner video,
and plays that video medium-sized in the middle with its words in a frame around it (`sides(n)`
splits them top, bottom, right, left; CSS grid keeps them off the video). Each word is an emoji
above the word, through `labelRows`, so the Words settings (English / Spanish / both, el / la)
apply; a word the same in both languages shows once. Every 4 s the next word is lit (a soft
highlight, and a slight grow unless reduced motion). **Back to slides** or `Esc` ends it and
destroys the player. "Words around the video" (`wordWeb`) turns the frame off.

Presets: 🐠 Aquarium (David found it, 2026-11-18), a calm tank for arrival with the Our day
Good morning words (`words: ROUTINE.arrival`), and Paw Patrol: Penguins.

**To add a preset:** an entry in `VIDEOS` (link, title, tile emoji, words with `label`, `es`, `art`,
`emoji`). Check first that it plays in the corner: some owners block embedding.

**Ads** (both players, `pip.js`): YouTube gives embeds no ad events, but a pre-roll holds the real
video back and YouTube starts the video itself when the ad ends. So only a player that never gets
*ready* within 20 s fails; once ready, a start slower than 6 s shows "Waiting for the video,
probably an ad" and is left to finish (Clip Choice's approach).

**Skipping an ad (2026-11-18, David: "it won't let me").** Nothing may skip an ad for the viewer
(YouTube's terms), so Looksee lets the teacher press YouTube's own Skip button. The player takes
clicks (`setClicks`; the `.clicks` class drops the shield and the iframe's `pointer-events: none`)
**while an ad is probably on** (`waiting`) and **for 20 s after ⏭️ Skip ad** in the bar (Watch's bar,
and the slides' bar while the corner video is on), for an ad in the middle of a video. A note
along the top of the video says "Click “Skip ad” on the video when it appears". The rest of the
time it takes none, as before. While it takes clicks, focus may sit in the iframe; `setClicks(false)`
takes it back. A click on the video itself pauses a YouTube embed, and a paused embed shows the
"more videos" shelf, so `tick` plays it again at once whenever it is found paused. Checked with a
stand-in for YouTube's API in Playwright (the real one is out of reach from Claude's sandbox), not
yet on a real ad. Not possible: skipping an unskippable ad.

## A plan: sets in timed blocks

A teacher asked to "program different sets throughout the day in 5 to 25 minute chunks"
(2026-11-15). `planOn` and `plan` (`[{ sets, min }]`, up to 12 blocks, `min` one of 5, 10, 15, 20,
25): with a plan on, the blocks play in turn instead of `sets`, each for its minutes.

- **A block's minutes are minutes of playing.** Its clock stops while the slides are paused
  (`spent` and `since` in `App.svelte`, plain variables read through `played()`). When the time is
  up the next block begins at the next slide, never mid-slide. Inside a block the slides start
  over as often as needed, whatever `loop` says; `loop` decides what happens after the last block:
  the first again, or stop.
- **It is not by the clock.** A block starts when the one before it ends, not at 9:15. Sets at
  times of day are the school day's own sets (below), and the two are never on together.
- **The plan is not a deck key.** `App.svelte` plays a block by lending the deck its sets: `cur`
  is the block playing now or, with no plan, the settings themselves, and `deckKey` and
  `buildDeck` are given `cur.sets`. The Sets picker in Settings edits `cur.sets` too, so with a
  plan on it shows and changes the sets of the block that is playing ("Sets in block 2").
- **Settings ▸ What to show ▸ "A plan"**: turning it on makes a first block from the sets chosen.
  Each block is a button (click to play it now and edit its sets), five minute choices, ↑ to move
  it earlier and Remove. All of it works with a mouse alone. Turning the plan off keeps the blocks.
- The control bar shows "Block 2/3 · 8 min" (minutes left, rounded up) beside the slide count.
- "Reset look and pace" keeps the plan, like the school day.
- In a link: `planOn=1&plan=letters.numbers-10_feelings-5` (`planQuery`, `queryPlan`). A plan's
  bookmark is named after its groups in the order they play and its length: "🔤➕😊 Plan, 30 min · EN".
- Where the plan is (block, minutes played) is not saved: a reload starts at block 1.

## The timer, and the control bar

The bar is **Back, Play, Next, the slide count, Timer** (2026-11-15), with **Tools on its own in
the bottom left corner** (2026-11-16, where a projector's mouse usually is; on a phone it wraps
into the bar). Tools opens a small panel above it with Watch, the corner video (offered only when Settings has a link) and
Settings, so those take one more click; `W`, `V` and `S` still go straight there. In Watch the bar
is Back to slides, Sound, Other video, Timer.

**One timer, apart from everything else.** It never starts, stops or advances the slides, Watch,
the plan or the school day, and none of them touch it.

- **Starting:** the Timer button (or `T`) opens a sheet over the lesson. 1, 3, 5, 10 or 15 minutes
  start with one click; − and + set another length (1 to 60) and Start begins it. The sheet opens
  on the minutes used last, with focus on Start, so `T` then Enter repeats the last timer.
- **Running:** a clock in the top right corner (top left when the corner video has the top
  right): a picture of the time left, and the minutes and seconds. It is outside the bar, so it
  stays when the bar fades. Clicking it, or `T`, shows exactly Pause/Resume, +1 min, End, and
  Bigger or Smaller. The bar's Timer button shows the time left.
- **Four faces, and in every one color is the time left** (`FACES` in `timer.js`; David asked
  for hourglasses "and other visual ways of representing durations", 2026-11-15). A disc that
  closes clockwise from twelve (the default; it replaced the ring), a bar that empties, a dot for
  each minute that goes out as its minute ends, and an hourglass. They are picked by their
  pictures in the sheet. `faceTrack(face, n)` and `faceFill(face, part, n)` are pure: two outlines
  in a box of 100 by 100, the whole shape and the part that is time left, so `Timer.svelte` draws
  any face as two `<path>`s and the tests can check them. **The hourglass's sand is by area**
  (a square root), so half the time is half the sand, which a real one does not do. The picture
  is redrawn four times a second with no transition; under reduced motion it moves in tenths.
- **Fill the screen** (`big`): the same clock over the whole stage, between the day bar and the
  control bar, for a class to see from across the room. It is drawn like a slide, in the stage's
  colors: `App.svelte` hands it `theme.colors[3]`, which the theme tests hold to 3:1 on the
  stage. The slides underneath go on doing whatever they were doing: the timer still never
  touches them. On a phone it stops above the two rows of the control bar.
- **Show the numbers** (`nums`): off hides the minutes and seconds from the clock, for children
  who watch the seconds. They stay for a screen reader, and on the bar's Timer button for the
  teacher.
- `face`, `big` and `nums` are kept with the timer in `looksee-timer-v1`, like the minutes and
  the chime: they are not settings and are in no link.
- **The end:** "Time's up" with Done and +2 min, and two soft notes when "Chime at the end" is on
  (`chime.js`, Web Audio, no file). Nothing flashes or moves and nothing else on screen changes.
- **A timer is the moment it ends** (`endsAt`), never a number counted down: `remaining(t, now)`
  works it out from the clock, so it is right after the tab was hidden or the page reloaded.
  Paused, it holds what was `left`. `Timer.svelte` ticks four times a second only to redraw.
- **It is not a setting.** It is kept under its own name, `looksee-timer-v1`, and is in no link,
  bookmark name or deck key (a test checks `DEFAULTS` has nothing of it). A link window and the
  plain app on one device therefore share the one timer.
- **A screen reader** hears "1 minute left", "10 seconds left" and "Time's up" from one polite
  live region (`milestone`), never each second.
- **Awake:** `keepAwake(playing || timer running)` in `awake.js` is the only wake lock. A lock
  granted after it stopped being wanted is let go, and it is asked for again when the tab returns.
- **A hidden tab ticks slowly,** so the chime can be late there; the clock is right the moment
  the tab is back. A timer that ended while the page was closed shows "Time's up" without a chime.
- The clock's three buttons close by themselves 6 s after the clock was last touched (pointer or
  key), because the bar does not fade while they are open. The sheet does not: it has Close.
- Left out on purpose: Undo after a preset (End is one click), and turning the video down for
  the chime.
- Not built, from the same handoff (Codex, 2026-11-15): Settings split into quick and advanced,
  a Routine strip (Now / Next with "Done · next activity"), and a private Things pack file.

## Settings: sections that fold

Settings had grown to 56 kinds of control in one scroll (about 150 things to click with every set
listed). David asked to simplify it for the teacher (2026-11-15). It is now ordered by when she
needs each thing, and folded:

- **Each section is a `<details class="sec">`** whose `<summary>` holds the `<h2>` and, on the
  right, a `.sum`: one line saying what the section is set to ("English + Español", "4 s each, in
  order", "Calm, Biggest"), hidden while the section is open. Only "What to show" starts open.
  They are plain `<details>`: Settings is made again each time it opens, so it always opens the
  same way. (Remembering which were open cost bytes there was no room for.)
- **The order is by use.** What changes in class comes first: What to show, Words and speech,
  Pace. Then Options for these sets. Then, under the label "Set up once": School day, Weather,
  Pictures, Videos, Look, Share this setup, and Keys, reset and credits. At 1366 × 768 the first screen
  holds the plan's checkbox, the nine groups, Words and speech, Pace and Options (Pace ends at
  620 px, measured 2026-11-17), with no scrolling.
- **What to show lists the groups, one click each,** two to a row (`.tiles`, a grid only while no
  single sets show). The sets inside them appear with "Choose single sets" (`single`), which
  starts on when a group is only partly on; then each group takes the whole row, its sets under it.
- **Quiet "chosen" (2026-11-17, after David found the drawer cluttered).** A chosen set, group or
  choice is a pale tint (`--pick`, held by the contrast gate) with a 2 px brand edge; checkboxes
  (sets, groups) also get a ✓, so it never rests on color alone. Solid brand is kept for one
  thing in the section: the plan block playing now (`.blk`). Only that block shows its minutes,
  ↑ and Remove; the others are one line, a click to play and edit. The section heading's
  chevron is drawn in CSS (the font's ▸ was too small to see).
- **A set's own options show only while that set is in use** (`setsInUse` in plan.js: with a plan
  on, every block's sets). Letter case and letter words for Letters; the number style for Numbers,
  Adding and Subtracting; From and to for Numbers; "Up to 5 or 10" for Adding and Subtracting;
  "Shapes change into each other" for Shapes and Colors and shapes; Moving or Still for Feelings,
  Gestures and Body; skin tone for Gestures and Body; count by 1s, 5s or 10s for Count to 100. The rows are hidden with the `hidden`
  attribute, not `{#if}`, which is smaller; `.sec [hidden]` needs `!important` because some rows
  set their own `display`. With none in use the whole section is hidden.
- **No sliders.** Seconds on each and the pause before the word are rows of choices to click
  (`seg` takes a list of numbers). A value from an old link that is not one of the choices still
  works; no choice is lit.
- "Show the word underneath" moved from Look to Words and speech, and the picture chooser from
  under the sets to its own section, Pictures.
- **A section's heading is a control.** The window's key handler leaves Space and Enter on a
  `SUMMARY` alone, as it does on a button, or Space would play the slides instead of opening it.
- Not done, on purpose: no option was removed (fold first, then see what is never opened), and
  there is no Simple / Advanced switch. An idea for later: a Sets button on the control bar that
  opens big tiles, one per group, like Watch.

## Settings links

`?v=1&sets=adding.subtracting&mathTo=10` (`share.js`): `v=1` marks a Looksee link, then only the
settings that differ from `DEFAULTS`; everything travels, school day and video included. A link is
the whole setup (missing = default) and **wins over the device's saved settings every time it
opens**: a Chromebook's bookmarks and shortcuts share one storage, so that is the only way each can
keep its own setup. In a link window, changes go into the address (`replaceState`), never into
`localStorage`; "Use these on this device" saves them and opens the plain app.

The intended use (David): one bookmark per setup on the bookmarks bar (confirmed working on the
classroom Chromebook, 2026-11-12). The page title in a link window is `setupName`, which a bookmark
takes as its name: the group's emoji and name, then the language, with no "Looksee" in front so it
fits the bar. "➕ Math · EN+ES"; part of a group lists its sets with commas ("➕ Adding · EN",
"😊 Feelings, Body · EN"), so it never reads as the whole group; two groups "🔤➕ Letters & Numbers +
Math · ES"; three or more "🔤➕🎨 Mix · EN"; every set "Looksee · All · EN". A bookmark keeps the
name it was saved with.

`GROUPS` (concepts.js) puts every set in one of eleven groups, in `SETS` order (a test): 🔤 Letters &
Numbers, 💯 Count to 100, ➕ Math, 🎨 Shapes & Colors, ↔️ Opposites, 😊 Feelings & Body, 🏫 Our day, and the four whose pictures
a device adds for itself, 🐾 Animals, 🍎 Food, 🧸 Things and 🌍 Places. Settings lists the sets under
their groups; a group's heading turns the whole group on, or off when it is all on (`toggleGroup`),
and shows "mixed" when part of it is on. For
installing one as an app, `home.js` swaps in a `data:` manifest whose `start_url` is the link
(BackTrack's approach); Chrome reported it installable with no errors. On iOS the manifest is
removed instead, so Add to Home Screen saves the page's own address. Settings ▸ Share this setup
has the link, Copy link, and Open as its own page.

## Weather

**Weather** in Tools (or `O`) shows the temperature outside as its own big slide, for circle time:
the sky as an emoji, the temperature in °F, a word under each ("cloudy / nublado", "cold / frío"),
and a cold-to-hot scale with today's band marked. A click on it (or `R`) says it: "42 degrees.
cold. cloudy." **Back to slides**, `O` or `Esc` closes it. `T` is the timer, which stays in the bar. Opening it pauses the slides.

- **Off by default (`weather` setting), and David chose this exception to "nothing leaves the
  device" on 2026-11-15.** Tools offers it only when the setting is on, and the request is made
  only when the weather is opened, never on load. It goes to Open-Meteo (free, no key, no account,
  no cookies; free for non-commercial use, attribution in Settings ▸ Weather): `weatherUrl()`
  carries the place's coordinates and nothing else, with `credentials: 'omit'` and no referrer.
  Open-Meteo does see the device's IP address, as YouTube does. `outside.js` holds the only
  `fetch` in the app, and a test fails if another file gains one or if the service worker starts
  caching it.
- **The place is `PLACE` in `weather.js`** (Rhinebeck, NY, to two decimal places). It is not a
  setting: to move it, change the name and coordinates there.
- **Bands** (`TEMPS`, °F): freezing below 32, cold 32–49, cool 50–64, warm 65–79, hot 80 and up.
  Each theme's `heat` lists which five of its `colors` they take, coldest first, so the colors are
  already held to 3:1 by the theme test. The scale and the word mean it is never color alone.
- **Sky** (`sky(code, day)`): Open-Meteo's WMO weather codes grouped into sunny, partly cloudy,
  cloudy, foggy, drizzly, rainy, snowy, stormy; a clear sky after dark is 🌙 "clear". The emoji is
  the device's own, so there are no files.
- The words follow the Words setting (`labelRows`). The setting travels in a settings link
  (`&weather=1`) and survives "Reset look and pace". A reading is kept in memory for ten minutes
  and never stored; offline, the slide says the weather could not be reached and offers Try again.
- Not built: Celsius, a choice of place in Settings, what to wear, and a chip on the school-day bar.

## Background music

**Music** in Tools (or `B`) opens big tiles, one per playlist in `PLAYLISTS` (`src/music.js`), and a
Soft / Medium volume. One click plays it, track after track, starting over at the end; while it
plays, a 🎵 Stop button sits in the bar, and `B` stops it or plays the last playlist again. Offered
only when Settings ▸ Music is on (off for a new visitor). Asked for on 2026-11-16; the plan is
`docs/MUSIC-PLAN.md`.

- **It is its own thing, like the timer.** The slides, plans, Watch and the timer never start or
  stop it. It gives way to other sounds (`dip(reason, on)` in `player.js`): it fades out and pauses
  under a corner or Watch video with sound (not a muted one), and dips to a third while `speak()`
  talks and for 2.5 s around the timer's `chime()`. Those two call `dip` themselves. It keeps the
  screen awake while it plays.
- **iPhone and iPad ignore an `<audio>`'s volume**, so there a dip is a pause and Soft = Medium
  (`fixed` in `player.js`). Not yet seen on a device.
- **Files:** `public/music/<file>.m4a`, mono AAC 64 kbps, one loudness (`loudnorm` −23 LUFS). Every
  recording must itself be free to publish (CC0 or public domain, not just the tune); `credit` on
  the playlist says which, and `public/NOTICE.txt` lists them. A test checks the folder matches
  the playlists exactly. The Nursery tunes (nine, 9 minutes, 4.4 MB) are made by
  `scripts/music.mjs`: the notes are written there, played by a music-box sound in code, so they
  are ours (CC0). To add a tune: its notes and chords there, a line in `PLAYLISTS`, `npm run music`.
- **Quiet classical** (eight pieces, 25 minutes, 12.3 MB; David approved them on 2026-11-17) are
  recordings from Wikimedia Commons, each marked there PD or CC0 (Musopen, Kimiko Ishizaka, the
  US Air Force Band, a Commons cellist). Each is in `NOTICE.txt` by its file name with its Commons
  page (a test checks). They were made mono and AAC with a two-pass `loudnorm` (`linear=true`,
  so a piece keeps its own soft and loud), so they land between −23 and −26 LUFS; the Air is the
  quietest. Only these: Clair de lune and The Swan had no clean PD/CC0 piano recording, and
  Brahms's Lullaby on Commons names no performer. A recording someone else made needs David's
  OK before it is downloaded.
- **Offline:** the files are not precached (`globIgnores` has `music/**`). Settings ▸ Music has
  "Save for this device", which puts every track in Cache Storage (`looksee-music`, with
  `cache.add`: the site's own files, so no `fetch` and nothing outside). A saved track is played
  from a blob URL, so the service worker never has to answer an `<audio>`'s range requests.
- Not built: a choice of track, and fading out at the end of the timer.

## Sets by the school day

The teacher's schedule (2026-11-18, in `docs/STATUS.md`) is in clock times, so after the Our day
bookmarks David asked for it to run by itself. **Each part of the school day can have its own
sets** (`sets` on a part of `day`), and with **Follow the school day** (`daySets`) on, the part the
clock is in plays them. The schedule is the same every day (David chose that over one per
weekday).

- **It changes at the next slide, never mid-slide.** `pp` in `App.svelte` is the part playing;
  `partNow` is the part the clock is in (`partAt`). While playing, `step` moves `pp` on at a
  slide's end, and the new sets start from their first slide (if they are the same sets, the
  slides just carry on); while paused, or with nothing to show, it moves at once. **Nothing
  starts playing by itself**: a part only changes what Play plays. The clock is read every 15 s.
- **Before the first part, after the day, and in a part with no sets, `s.sets` play.** Turning the
  setting on gives every part without sets a copy of `s.sets`, to change from.
- **A part is held as itself** (`pp`, `pick`), never by its time or its place: a time is edited a
  keystroke at a time, and `tidyDay` puts the parts back in order when focus leaves the editor.
  So `tidyDay` keeps each part the same object. Editing the playing part's time takes effect at
  the next slide, like the clock (a review found the slides cut mid-slide when parts were named
  by time).
- **It and a plan are never on together.** Turning either on turns the other off; a link with both
  plays the school day (`block` needs `!s.daySets`).
- **Settings ▸ What to show** lists the parts as buttons ("9:14 🚶 · 🏫 Lining up · now"), and a
  last one, "Before and after the day", for `s.sets`. A click picks one (`pick`) and the Sets
  picker below edits it ("Sets at 9:14"); `ed` is whatever the picker edits. Settings opens on
  the part the clock is in. Times and pictures stay in Settings ▸ School day, which now takes 12
  parts (`DAY_MAX_PARTS`) and shows its editor whenever this is on, even with the bar hidden.
- The control bar shows "🍎 until 2:09" (`partEnd`, `clock12`: US clock, no AM/PM).
- **In a link** a part with sets is `[at, icon, "sets.joined"]` in `day`; `setupName` gives
  "🏫➕ School day · EN" (each group's emoji, in the order the parts play them). `setsInUse`
  counts every part's sets, so their options show. "Reset look and pace" keeps it.
- Not built: a different schedule per weekday, a video cued at a time (the Goodbye Song at 2:00),
  and a warning before a part changes.

## School-day bar

`day.js`: `day` is a list of `{ at: 'HH:MM', icon }` parts (with `sets` when a part has some) and `dayEnd` closes the last one;
`daySegments` says which part is past, now or next. The bar's emoji are plain text in the device's
emoji font, so the user can type any emoji and there are no files. The editor in the drawer leaves
rows in the order typed and sorts them only when focus leaves the list (`tidyDay`), so a row never
jumps while its time is being typed. "Reset look and pace" keeps the school day and the video link.

## Where is it? (generated pictures, not in the app yet)

Drafts for a place-words set (on, under, next to, between, in), made with Codex image generation
(2026-11-17/18). Everything is in `art/where-is-it/`; read its `PROMPTS.md` first. The cast is the
sequence app's (Ana, Sam, Jo, Max), nobody stands on furniture, and every card is an edit of an
empty scene, cropped with its scene, so only the child or object moves.

- `cutout.mjs` turns the drafts into transparent 512 px AVIFs and **publishes a review sheet to
  `public/where-is-it/`**, served at `…/where-is-it/` for David to show people. It is not part of
  the app: the service worker neither stores it (`globIgnores`) nor answers a visit to it with the
  app (`navigateFallbackDenylist`), and a test holds both.
- `art/where-is-it/refs/` (a retailer's chair photo) and `drafts/` are ignored by git.
- Not built yet: a `where` set in `concepts.js`, its Spanish words, and its pictures in the offline
  store and the size gate.

## Dev

```
npm install
npm run dev        # http://localhost:5173
npm test
npm run build      # includes the size and contrast gates
npm run pictures   # fetch any emoji pictures that are missing (see above)
```

Push to `main` → `.github/workflows/deploy.yml` tests and builds, and publishes to GitHub Pages
once Pages is turned on for the repo (Settings → Pages → Source = GitHub Actions; until then the
publish steps are skipped). For the custom domain: a DNS CNAME `looksee` →
`harmonicsystems.github.io`, then Settings → Pages → Custom domain. The next deploy builds for `/`
by itself.
