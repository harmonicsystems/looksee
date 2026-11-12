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

- **Nothing leaves the device except YouTube.** The only network traffic besides the site's own
  files: the IFrame API script from `www.youtube.com` (loaded lazily, the first time a video is
  started) and the player from `www.youtube-nocookie.com`. No analytics, no CDN fonts, scripts or
  images. The emoji pictures are copies in this repo; the app never loads them from Google.
- **Nothing is collected.** No names, no logging. The only stored data is the settings, in
  `localStorage` (`look-settings-v1`).
- **Starts paused** (no auto-playing media). Reduced motion turns entrance and idle animation off
  and shows still pictures.
- **Mouse-only must work too.** The classroom it is made for has a Chromebook with a mouse and no
  keyboard: everything a teacher needs during class takes only clicks on large targets, no typing.
- **Keyboard-only must work.** `Space` play/pause, `←` `→`, `S` settings, `V` video, `W` watch, `M` sound,
  `F` full screen, `Esc`. Focus must never get trapped in the YouTube iframe.
- **Never show YouTube's end screen or recommendations.** The corner video has no pause on
  purpose (a paused embed shows a "more videos" shelf): it is either playing or destroyed, and it
  loops by seeking back just before the end.
- **The site may be served from `/` or from `/looksee/`.** Nothing in `src/` may assume `/`:
  pictures and the credits link are requested relative to the page, and Vite rewrites the absolute
  paths in `index.html` and CSS. The deploy workflow passes `BASE_PATH`.
- Accessibility: Atkinson Hyperlegible (self-hosted, `public/fonts`), a two-tone focus ring
  (yellow with a dark edge), light + dark controls, four stage themes including high contrast.
- Build gates (`npm run build`): app JS ≤ 60 KB gzipped, service worker included
  (`scripts/check-bundle-size.mjs`, 51.7 KB now) and WCAG AA on both control palettes
  (`scripts/check-contrast.mjs`). The stage themes are held to their own ratios by the tests. No
  runtime dependencies.

## Tech stack

Svelte 5 (runes, plain Svelte) + Vite 6 (Node 20.17 here, 22 in CI) · `vite-plugin-pwa`
(`registerType: 'prompt'`, never auto-reload mid-play) · Vitest for the pure modules.

## File map

Everything in `src/` except the two `.svelte` files, `main.svelte.js`, `pip.js` and `youtube.js`
is pure logic and tested.

- `index.html` → `src/main.svelte.js` → `App.svelte`: the stage, the control bar that fades while
  playing, the settings drawer, the school-day bar, the corner video and the **window-level
  keyboard handler**.
- `Visual.svelte` — draws one slide by `kind` (`glyph | number | shape | color | mix | sum | pair | picture`;
  a `title` slide is words only and is drawn by `App.svelte`).
- `concepts.js` — the sets as data + `buildDeck(settings, rng)` + `dotLayout` + `labelRows`. Add a
  concept here, with its word in English (`label`) and Spanish (`es`, plus `art` for a noun).
- `morph.js` — shape outlines as points, and changing one shape into another (below).
- `settings.js` — `DEFAULTS`, `OPTIONS`, `normalizeSettings`, stage `THEMES`. `deckKey(s)` changes
  exactly when the deck must be rebuilt (and reshuffled): `DECK_KEYS`, plus set names when they
  would actually appear. Look-only settings must never be in it.
- `day.js` — the school-day schedule (below).
- `share.js` — settings as a link (`linkQuery`, `linkSettings`, `setupName`). `home.js` — `setHome`,
  the per-link title and manifest (not pure).
- `videos.js` — `VIDEOS`, the preset videos for Watch with their words, and `sides(n)`.
- `pip.js` — `PipPlayer`, the corner video and the Watch video. `youtube.js` — `loadApi`. `link.js` — `videoId`,
  `startSeconds` (reads a link's `?t=`).
- `styles.css` — control palettes (parsed by the contrast gate) and base styles.
- `public/feelings`, `public/people` — the emoji pictures. `public/NOTICE.txt` — their credits.
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

## Watch: preset videos with words around them

The **Watch** button (or `W`) opens big tiles, one per entry in `VIDEOS` (`src/videos.js`), plus
"Your link" when Settings has a video link. One click pauses the slides, stops the corner video,
and plays that video medium-sized in the middle with its words in a frame around it (`sides(n)`
splits them top, bottom, right, left; CSS grid keeps them off the video). Each word is an emoji
above the word, through `labelRows`, so the Words settings (English / Spanish / both, el / la)
apply; a word the same in both languages shows once. Every 4 s the next word is lit (a soft
highlight, and a slight grow unless reduced motion). **Back to slides** or `Esc` ends it and
destroys the player. "Words around the video" (`wordWeb`) turns the frame off.

**To add a preset:** an entry in `VIDEOS` (link, title, tile emoji, words with `label`, `es`, `art`,
`emoji`). Check first that it plays in the corner: some owners block embedding.

**Ads** (both players, `pip.js`): YouTube gives embeds no ad events, but a pre-roll holds the real
video back and YouTube starts the video itself when the ad ends. So only a player that never gets
*ready* within 20 s fails; once ready, a start slower than 6 s shows "Waiting for the video,
probably an ad" and is left to finish (Clip Choice's approach). The ad can't be skipped: the player
takes no clicks, which also keeps YouTube's suggestions out of reach.

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

`GROUPS` (concepts.js) puts every set in one of five groups, in `SETS` order (a test): 🔤 Letters &
Numbers, ➕ Math, 🎨 Shapes & Colors, ↔️ Opposites, 😊 Feelings & Body. Settings lists the sets under
their groups; a group's heading turns the whole group on, or off when it is all on (`toggleGroup`),
and shows "mixed" when part of it is on. For
installing one as an app, `home.js` swaps in a `data:` manifest whose `start_url` is the link
(BackTrack's approach); Chrome reported it installable with no errors. On iOS the manifest is
removed instead, so Add to Home Screen saves the page's own address. Settings ▸ Share this setup
has the link, Copy link, and Open as its own page.

## School-day bar

`day.js`: `day` is a list of `{ at: 'HH:MM', icon }` parts and `dayEnd` closes the last one;
`daySegments` says which part is past, now or next. The bar's emoji are plain text in the device's
emoji font, so the user can type any emoji and there are no files. The editor in the drawer leaves
rows in the order typed and sorts them only when focus leaves the list (`tidyDay`), so a row never
jumps while its time is being typed. "Reset look and pace" keeps the school day and the video link.

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
