# Status

As of 2026-11-10. `CLAUDE.md` explains how Looksee is built. This note says where things stand.

## Where it stands

**Looksee is live at `https://harmonicsystems.github.io/looksee/`** as of 2026-11-10, published
by GitHub Pages from its own public repo, `harmonicsystems/looksee`. Every push to `main` is
tested, built and published.

**The address `looksee.harmonic-systems.org` is not set up.** It needs a DNS record (CNAME
`looksee` → `harmonicsystems.github.io`) and the custom domain set in the repo's Pages settings.
Nothing in the code has to change: the deploy builds for whichever address Pages is using.

**It has only been used on one Mac.** No child, teacher or clinician has used it yet.

## How it got here

Looksee was built over two days as "Look & See", a second page inside a checkout of Clip Choice
(`harmonicsystems/clip-choice`), sharing that app's fonts, colors, YouTube loader and service
worker. This repo starts from the result, so the three commits that built it are not in its
history. They are on the branch `claude/educational-pwa-visual-concepts-c153f5` in the
`reinforcement` checkout on David's Mac:

**`f1ed935`, 2026-11-09 — "Look & See: coded visuals for first concepts, with a corner video".**
The first version: letters, numbers, shapes, colors and opposites, every picture drawn by code so
its look can be changed live, with a YouTube video that can sit in a corner.

**`886c7ad`, 2026-11-10 — "Look & See: a Feelings set of animated Noto emoji faces".** The first
set that is picture files rather than drawings. It settled where such pictures come from: Google's
Noto Emoji, copied into the repo so the app never loads anything from Google, as small AVIF
animations with a still picture beside each.

**`c43c2b8`, 2026-11-10 — "Look & See: gestures and body in five skin tones, and a school-day
bar".** Two additions aimed at the classroom: hands and body parts that show every skin tone
equally, and a bar that tells a child where the day is.

**The split.** Sharing a repo had started to cost both apps. They shared one offline cache and one
JavaScript limit, so each feature here took room from Clip Choice, and Clip Choice had moved on in
its own repo. Looksee was lifted out with only what it uses, renamed, and made to work whether it
is served from a domain's root or from `/looksee/`. Its focus ring also gained a dark edge, because
yellow alone did not show against the white settings drawer.

## Checked, and not checked

**Checked on 2026-11-10, locally.** All 28 tests pass. The build passes its size gate (38.5 KB of
60) and its contrast gate, and a build for `/looksee/` rewrites every path correctly. In a browser against the
dev server: the app loads at the root with its font and icons, feelings and gesture pictures load
by their new paths, the credits open, and a YouTube link with a start time plays in the corner.
Earlier checks of the stage, settings, skin tones, school-day bar and fallbacks were made before
the split, on the same code.

**Checked on 2026-11-10, on the live site.** The page, manifest, icons, font and credits all load
from under `/looksee/`. The host serves the moving pictures as `image/avif`, which had been an
open question. In a browser: the app runs, feelings, gesture and body pictures load and animate,
the service worker activates and stores the app, fonts and all 28 feelings pictures (and none of
the hands and body pictures, as intended), nothing is requested from Google, and the console is
clean.

**Not checked.** Installing the app and actually using it offline. The school-day bar across a real school
day (one moment in the browser, the rest by unit tests). Typing emoji into the schedule on a
Chromebook or iPad. The device's own reduced-motion setting (it shares a path with the Still
setting, which was checked). Any device other than one Mac.

## Decisions still open

- **Offline for hands and body.** Those 192 pictures (4.5 MB) load when shown and are not stored
  for offline use. That was to spare Clip Choice visitors the download. Now that Looksee is alone,
  storing them is a fair trade: about 4.5 MB more to install, and about 7 KB of the JavaScript
  limit.
- **The words.** Feelings, gestures and body words were chosen without a clinician: "angry"
  rather than "mad", "stop" for a raised hand, "love" for heart hands. Each is one line in
  `src/concepts.js`.
- **The default school day.** 8:00 to 3:00, lunch at 11:30, going home at 2:30 is a placeholder.
- **Ads on the corner video.** The app adds none and hides YouTube's controls, suggestions and end
  screen, but it cannot remove ads YouTube places on a video.
- **What Clip Choice has learned since.** Its repo has newer handling for pre-roll ads and for
  pasted embed code and share links. Looksee still has the earlier versions: `src/pip.js` gives a
  video 20 seconds to start, and `src/link.js` reads plain links only.
- **A license for the code.** The repo is public and has none yet.
