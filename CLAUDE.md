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
- **Keyboard-only must work.** `Space` play/pause, `←` `→`, `S` settings, `V` video, `M` sound,
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
  (`scripts/check-bundle-size.mjs`, 43.9 KB now) and WCAG AA on both control palettes
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
- `Visual.svelte` — draws one slide by `kind` (`glyph | number | shape | color | pair | picture`).
- `concepts.js` — the sets as data + `buildDeck(settings, rng)` + `dotLayout` + `labelRows`. Add a
  concept here, with its word in English (`label`) and Spanish (`es`).
- `settings.js` — `DEFAULTS`, `OPTIONS`, `normalizeSettings`, stage `THEMES`. `DECK_KEYS` are the
  only settings that rebuild (and reshuffle) the deck.
- `day.js` — the school-day schedule (below).
- `pip.js` — `PipPlayer`, the corner video. `youtube.js` — `loadApi`. `link.js` — `videoId`,
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

## Words

The `words` setting shows the word under a slide in English, Spanish or both. `labelRows(item,
lang)` returns one row per language (two words in a row for a pair of opposites); it is read at
render time, so changing the language does not rebuild the deck. Each row carries a `lang`
attribute, and the slide's name for a screen reader follows the words shown.

- Every concept has `label` (English) and `es` (Spanish). `label` is also what the tests and the
  code use to name a slide, whatever language is showing. A test fails if a concept has no Spanish.
- The Spanish is Latin American as heard in US classrooms (anaranjado, rosa, café, morado,
  angosto, audífono). Words that change with gender are written "enojado/a". **It has not been
  checked by a Spanish speaker.**
- Only the words under the slides change. Letters stay the 26 English ones (no Ñ), and the
  controls and Settings stay in English.

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
