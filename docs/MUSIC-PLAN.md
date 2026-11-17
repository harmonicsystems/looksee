# Plan: background music

Status (2026-11-16): **Part 1 is done** (merged as #12). **Part 2 is built for the Nursery tunes**
(rendered by `scripts/music.mjs`), and the limit is 68 KB. Quiet classical was added on 2026-11-17
with eight PD/CC0 recordings from Wikimedia Commons. `CLAUDE.md` ▸ Background music describes
what was built.

## Context

1. **Settings, first screen.** With nine groups, the first screen of Settings at 1366 × 768 ends at
   "Words and speech"; Pace's heading ends at 799 px (measured in the dev server). David wants it
   back on the first screen.
2. **Background music.** David wants calm, public-domain background music for the classroom:
   kid-friendly classical, nursery-rhyme instrumentals and other low-stimulation pieces. It has to
   be easy to keep offline, and it must sit well with the corner video, Watch, read-aloud and the
   timer.

   Decided with David:
   - **Source:** recorded files.
   - **Controls:** chosen in Tools; while music plays, a bar button stops it with one click.
   - **Timer:** the music dips for the chime, and the timer stays independent of everything else.

---

## Part 1 — Shrink the group buttons (ship first)

`src/App.svelte` styles:
- `.grp-head`: `min-height: 44px` → `40px`.
- `.grp`: `margin-bottom: 8px` → `6px`.

Across nine groups that saves 9 × (4 + 2) = 54 px, which moves Pace to about 745 px, under 768
with some room left. Clicks still land easily: 40 px is well above WCAG's 24 px minimum target,
and the buttons stay full width.

Update the `CLAUDE.md` line "At 1366 × 768 the first screen holds…" to say nine groups.

**Check:** dev server at 1366 × 768, open Settings, and confirm with `getBoundingClientRect` that
Pace's `<summary>` ends at ≤ 768. Take a screenshot. Then commit and ship it through a PR, as
before.

---

## Part 2 — Background music (scope and design)

### What plays
- **Playlists, not single tracks**, each 20–40 minutes and looping, shown as big tiles like Watch:
  - **🌙 Quiet classical:** Satie Gymnopédie No. 1, Debussy Clair de lune, Bach Cello Suite No. 1
    Prelude, Bach Air (Suite No. 3), Schumann Träumerei, Saint-Saëns The Swan, Brahms Lullaby,
    Grieg Morning Mood.
  - **🎶 Nursery tunes:** Twinkle Twinkle, Mary Had a Little Lamb, Row Row Row Your Boat, Frère
    Jacques, Hush Little Baby, Rock-a-bye Baby, Lavender's Blue, London Bridge. These are played
    gently, with no singing.
- **Copyright:** every composition above is in the public domain, but each recording has its own
  copyright. Only recordings that are PD or CC0 are used, and each is recorded with its source:
  - **Classical:** Musopen's public-domain recordings and Wikimedia Commons files marked PD/CC0. A
    file is checked one by one before it is used.
  - **Nursery tunes:** rendered by us. Either a local script turns note lists into audio (with
    `fluidsynth` and a public-domain soundfont, or with `sox`), or David records them himself.
    Either way we own the recording.
  - **Excluded:** anything still under copyright, such as "You Are My Sunshine" (1940).
- **Files:**
  - Mono AAC `.m4a` at about 64 kbps, around 0.5 MB a minute. AAC plays everywhere, Safari and iPad
    included (as in BackTrack).
  - Loudness normalised to one level with `ffmpeg loudnorm` so no track jumps out.
  - Stored in `public/music/`, committed, and credited in `public/NOTICE.txt`.
  - Size: about 15–25 MB for two playlists, held in the repo.

### Caching (the tricky part)
- **Kept out of the precache** (`globIgnores: ['things/**', 'music/**']` in `vite.config.js`), so
  installing the app stays small and the service worker's bytes don't grow.
- **"Save music for this device"** in Settings ▸ Music downloads every file whole into Cache
  Storage (`looksee-music`). It follows the pattern of `src/local.js`, which does the same for
  Things pictures, and shows "Saved: 2 playlists, 18 MB".
- **Playback avoids the service worker's Range trap.** An `<audio>` element asks for Range
  requests, which a service worker cache handles badly. So the player looks in `looksee-music`
  first: if the file is there, it plays from `URL.createObjectURL(blob)`; if not, it plays the
  network URL directly. No Workbox range plugin is needed.
- Offline and not saved: the tile says "Not saved on this device" and stays disabled.

### New code
- `src/music.js` (pure, tested): `PLAYLISTS` as data (`id`, `label`, `es`, `emoji`, `tracks:
  [{ file, title, by, source, licence }]`), `nextTrack(list, i, shuffle)`, and `duckLevel(state)`.
  `duckLevel` maps (video sound on, speaking, chiming) to a volume.
- `src/player.js` (not pure): `MusicPlayer` wraps one `<audio>`. It has `play(list)`, `stop()`,
  `setLevel(v)` with a 0.4 s fade, and moves to the next track on `ended`. Fades use a short
  `requestAnimationFrame` ramp of `audio.volume`. iPad ignores `volume`, so there the player
  pauses instead of dipping.
- `App.svelte`: music state, the Tools tile, the bar button, key `B`, and the Settings section.

### How it plays alongside everything else
Only one sound leads at a time, and nothing starts without a click.

| When | Music does |
|---|---|
| Corner video or Watch starts **with sound** | Fades out and pauses; resumes when the video stops, is hidden or is muted |
| Video is muted (`M` or Sound off) | Keeps playing |
| Read aloud (click slide, `R`, Watch word, weather) | Dips to 30% while speaking, as Watch already dips the video (`onStart`/`onEnd` of `speak`) |
| Timer chime | Dips for about 2 s, then comes back. Nothing else about the timer changes |
| Slides play / pause, plan blocks, weather slide | Not affected (independent, like the timer) |
| Tab hidden | Keeps playing (an `<audio>` element does) |
| Screen awake | `keepAwake(playing \|\| timer running \|\| music playing)` |

To make this work:
- `chime()` and `speak()` gain small hooks (an `onChime` callback, and the existing
  `onStart`/`onEnd`).
- The video sound rule reads `pipOn`/`watching` together with `s.videoMuted`.

### Interface
- **Tools panel:** a "🎵 Music" tile, offered only when the Music setting is on, like Weather.
  - It opens a sheet of big playlist tiles, one click to start. Opening the sheet does not pause
    the slides.
  - The sheet also has a volume choice: Soft (default 0.35), Medium (0.6).
- **While music plays:** a "🎵 ⏸" button appears in the bar beside Timer. One click stops the
  music; its label names the playlist for screen readers ("Stop music: Quiet classical"). It fades
  with the bar like the other controls.
- **Key `B`:** stops the music, or starts the last playlist again (B for background; M is already
  video sound). Add it to the key list in Settings and `CLAUDE.md`.
- **Settings ▸ Music,** under "Set up once":
  - on/off (off for a new visitor);
  - default volume;
  - Save for this device, with its size;
  - credits link.
  - The on/off setting and the volume travel in settings links; what is playing does not, like
    the timer.

### Budget and gates
- **JS:** about 1.5–2 KB gzipped for the player, the data and the UI. The app is 65.6 KB of 66,
  so **the limit must go up to 68 KB. That is David's call.**
- **Tests** (`tests/looksee.test.js`):
  - every track's file exists, and nothing extra sits in `public/music/`;
  - every track has `source` and `licence`, and the licence is PD or CC0;
  - `music/**` stays out of the precache;
  - `nextTrack` and `duckLevel` behave as described;
  - `DEFAULTS.music` is off;
  - no `fetch` outside `outside.js` and `local.js` (extend the existing guard if saving uses
    `fetch`).
- **Contrast and size gates:** unchanged.

### Order of work
1. **Part 1.**
2. **Sourcing:** pick the classical recordings and record their provenance. Each download needs
   David's OK, file by file (name, source, size). Then render or record the nursery tunes.
3. Write `music.js` and `player.js` with tests.
4. Add the UI, the interaction hooks and Settings.
5. Wire up offline saving.
6. Update the docs: `CLAUDE.md` gets a "Music" section and the new key, and `docs/STATUS.md` notes
   what is unchecked.

### Verification
- `npm test` and `npm run build`, with the size gate at the new limit.
- Dev server at 1366 × 768:
  - start a playlist from Tools; the bar button appears and stops it;
  - start the corner video with sound and the music pauses; mute the video and the music resumes;
  - read a slide aloud and the music dips;
  - run a 1-minute timer and the music dips for the chime and comes back.
- **Offline:** build, run the `looksee-built` preview, save the music, stop the server, reload, and
  play a playlist.
- **iPad / Safari:** check that pausing in place of a dip happens. This needs David's device.
