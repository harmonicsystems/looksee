# Status

As of 2026-11-15. `CLAUDE.md` explains how Looksee is built. This note says where things stand.

## Where it stands

**Looksee is live at `https://harmonicsystems.github.io/looksee/`** as of 2026-11-10, published
by GitHub Pages from its own public repo, `harmonicsystems/looksee`. Every push to `main` is
tested, built and published.

**Two changes went out on 2026-11-10, after the split:** every picture stored for offline use,
and the words in Spanish. Both are described under "Since the split" below.

**A third change went out on 2026-11-11:** shapes that change into each other, a word for each
letter, and five smaller language features. They are described under "2026-11-11" below.

**The address `looksee.harmonic-systems.org` is not set up.** It needs a DNS record (CNAME
`looksee` → `harmonicsystems.github.io`) and the custom domain set in the repo's Pages settings.
Nothing in the code has to change: the deploy builds for whichever address Pages is using.

**It is in use in one classroom,** on a Chromebook with a projector and a mouse (bookmarks
confirmed there on 2026-11-12; the class's notes came back on 2026-11-15). Everything else has
been checked on one Mac.

**Weather was added on 2026-11-15 and is not yet on `main`** (branch `claude/hello-6317eb`, with
`main`'s timer and plan merged into it). Weather in Tools, off by default, shows the temperature in
Rhinebeck as a big slide with a word and color for how it feels and an emoji for the sky. It is the
first thing besides YouTube that Looksee asks of an outside service (Open-Meteo); `CLAUDE.md` ▸
Weather has the rules. Checked on David's Mac in the dev server with a live reading, in English,
Spanish and both, in the calm and high-contrast themes, at laptop and phone shapes, with the mouse
and with the keys (`O` opens and closes it; `T` stayed the timer's when `main` was merged in). The
size gate was raised from 62 KB to 64 KB by David for it: the app is 63.2 KB. **Not checked:** hearing it read aloud, the "could not be reached" slide with
the network really off, whether the classroom Chromebook's network allows `api.open-meteo.com`,
and the Spanish weather words (helado, fresco, cálido, caluroso, algo nublado, con niebla, con
llovizna, con nieve, tormentoso, despejado) by a Spanish speaker.

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

## Since the split

**Every picture is now stored for offline use.** The 192 hands and body pictures had been left out
to spare Clip Choice visitors the download. With Looksee alone that reason is gone, so the app
stores all 220 pictures: about 5.5 MB to install, and it then runs with no connection at all
except for the corner video.

**The words can be in English, Spanish or both.** A setting chooses; with both, the English word
sits above the Spanish one, and a pair of opposites keeps a word under each half. The Spanish is
Latin American as heard in US classrooms, and words that change with gender are written
"enojado/a". Only the words under the slides change: the letters, the controls and Settings stay
as they were.

## 2026-11-11: shapes that change into each other, and more language

**Shapes change into each other.** David built a Lottie playground that turns a triangle into a
circle and asked whether Looksee could use Lottie. The Lottie player alone is 62 KB, more than
the whole app, so Looksee took the playground's idea and draws it itself: every shape is given
the same 120 points, and one shape becomes the next by sliding each point to its partner. It
works for any pair of the ten shapes, and the color blends on the way.

**A word for each letter.** Each letter has one thing whose name starts with that letter in both
languages (airplane / avión, lion / león), with a small picture from the device's own emoji.
Q, X and Z have no fitting emoji and show the word alone.

**Five smaller language features**, all chosen by David from a longer list: a pause before the
word, so a child can say it first; two-word slides that put a color with a shape ("red circle /
círculo rojo"); the first letter of each word picked out; el or la on Spanish nouns; and the name
of each set shown as it begins. Speech, short sentences and capital letters were offered and not
chosen.

All of them are on by default except the pause, and each has a switch in Settings.

**A review changed the first version the same day.** A second pass over the code found six
things, all fixed before anything was committed. Symmetrical shapes leaned sideways mid-change,
because the points were shared out unevenly; shapes are now sampled as a right half and
mirrored. Stepping on during a change snapped, and a floating shape hopped; one picture now
stays on screen through a run of shapes. The first letter of "red" was drawn in an unrelated
color; on color slides it is now plain ink. The highlighted letter split each word in two for a
screen reader; it is now done in CSS. Hiding the words restarted and reshuffled the deck; it no
longer does. And the longest label could run off the screen in a fallback font; the fit is
tighter.

## 2026-11-12: mixing colors

David watched a class use concept videos on a small Chromebook with a mouse and no keyboard, and
asked for three things: color mixing, adding and taking away, and preset videos chosen with one
click, each with a web of words around it. Mixing colors is the first. Six slides (red + yellow =
orange, yellow + blue = green, blue + red = purple, red + white = pink, black + white = gray,
red + green = brown): two blobs of paint slide together, and their overlap is the color they make.
On by default for new visitors. Mouse-only is now a hard constraint beside keyboard-only.

**Checked on 2026-11-12, locally.** All 52 tests pass and the build passes its gates at 46.9 KB of
60. In a browser at laptop and phone shapes, all six slides played in both languages at the
largest size, with no word off the screen and a clean console; the blobs were seen apart and then
overlapping; with reduced motion they start overlapped. Not yet checked on the live site, and the
Spanish ("Mezclar colores") is as unchecked as the rest.

## 2026-11-12: adding and subtracting

Two more sets, on by default for new visitors. A setting chooses "Up to 5" (every fact: 10 of each)
or "Up to 10" (a fresh 10 of the 45 each round). Each slide shows "2 + 3 = 5", dots in rows of five,
or both, following the Numbers setting. Adding: the two groups, the second in ink, slide together.
Subtracting: the dots taken away are crossed out one by one and stay on screen. Words: "two plus
three is five" / "dos más tres son cinco". David chose plus/minus wording, the setting, and the
crossed-out dots staying.

**Checked on 2026-11-12, locally.** All 57 tests pass and the build passes its gates at 47.7 KB of
60. In a browser: every slide of both sets up to 5, and a dealt round up to 10, in both languages
at the largest size, at laptop and phone shapes, with no word off the screen and a clean console;
numeral-only, dots-only and both; mid-way and finished; reduced motion starts finished; "Up to 10"
chosen with mouse clicks only. Not yet checked on the live site or by a teacher; "son" vs "es igual
a" in the Spanish is for a Spanish speaker to judge.

## 2026-11-12: matching colors, fading, and settings links

**Adding and subtracting are color-coded.** Each number in "2 + 3 = 5" is the color of its dots,
and the answer appears once the dots are done. Subtracting now fades the taken-away dots (they
turn the second number's color first) instead of crossing them out. Both were David's calls after
seeing the first version.

**Settings travel as a link.** `?v=1&…` opens Looksee with exactly those settings, every time, over
whatever the device has saved; a teacher can keep one bookmark per setup on the bookmarks bar, each
named after its sets. Settings ▸ Share this setup shows the link and can copy it.

**Checked on 2026-11-12, locally, on a build for `/looksee/`.** 61 tests pass; the build passes its
gates at 49.4 KB of 60. In Chromium: a link wins over saved settings; changing a setting with clicks
updates the address and leaves the device's settings alone; reloading keeps the link's setup; the
plain address still opens the device's settings; a different link opens offline from the stored app;
Chrome's own check finds the per-link manifest installable, with the link as its start address and
the setup's name. Not checked: a real bookmark or installed shortcut on the Chromebook, and iOS Add
to Home Screen.

**Bookmarks confirmed on the classroom Chromebook** by David, 2026-11-12.

## 2026-11-12: set groups, and bookmark names with the language

The twelve sets are in five groups (🔤 Letters & Numbers, ➕ Math, 🎨 Shapes & Colors, ↔️ Opposites,
😊 Feelings & Body), chosen by David. Settings lists them under their groups, and a group's heading
turns it all on or off with one click. A link window's title, which a bookmark takes as its name,
now leads with the group and ends with the language: "➕ Math · EN+ES". Existing bookmarks keep their
old names until saved again.

**Checked on 2026-11-12, locally, on a build for `/looksee/`.** 62 tests pass; the build passes its
gates at 50.0 KB of 60. In Chromium, titles for one group, part of a group, two groups, three groups
and the default sets, in each language; group headings clicked on and off with the mouse, with the
deck, address and title following, and "mixed" shown for part of a group; Settings at laptop and
phone widths. Not checked: the new names on the Chromebook's bookmarks bar.

## 2026-11-12: Watch, and videos that wait out their ads

**Watch** plays a preset video in the middle of the screen with its words and pictures around it,
one gently lit at a time. First preset: Paw Patrol penguins (`https://youtu.be/z1vXJVI2L5M`), with
11 words drafted by Claude and accepted by David for now (Paw Patrol, dog, pup, penguin, help,
rescue, team, snow, ice, cold, slide).

**Videos with ads now play.** Looksee used to give up 20 s after starting if the video hadn't
begun, which a pre-roll ad could cause. Now only a player that never loads fails; during an ad it
says "Waiting for the video, probably an ad" and the video starts by itself afterwards.

**Checked on 2026-11-12, locally, on a build for `/looksee/`.** 65 tests pass; the build passes its
gates at 51.7 KB of 60. In Chromium with mouse clicks only: Watch opens the tiles, the Paw Patrol
tile opens the Watch screen with all 11 words around the video, none over it or off screen, in
English, Spanish and both, at laptop, Chromebook (1366×768) and phone sizes; the lit word moves on
every 4 s; Back to slides and Esc return to the paused deck; with words off, the video is larger and
alone. **YouTube is blocked in this test environment**, so the player showed "YouTube could not be
reached" there. **Not checked:** the Paw Patrol video actually playing (whether its owner allows
embedding), ads, and sound: these need the live site on the Chromebook.

**Next:** David checks the Paw Patrol video on the Chromebook, and edits its words; more presets.

## 2026-11-12: speech, and Spanish feelings as -o, -a or both

Speech was offered on 11-11 and not chosen; David asked for it now. A click on the slide says its
words (it no longer pauses; Play/Pause is the button and Space), in English, Spanish or both as
shown, each in its own language's voice; a setting reads every slide as it appears; a word around a
Watch video says itself when clicked. Only the device's own voices are used, so nothing is sent to
Google. The twelve Spanish feelings written "enojado/a" get a setting: enojado, enojada, or both
(shown "enojado/a", said "enojado, enojada"); a settings link carries it, so a teacher can keep a
bookmark per child.

**Checked on 2026-11-12, locally, on a build for `/looksee/`.** 72 tests pass; the build passes its
gates at 52.9 KB of 60. In Chromium, with the speech engine replaced by a recorder and a made-up voice
list (one online Spanish voice, local English and Spanish ones): a click on a letter slide says
"A. airplane" in the English voice and "el avión" in the Spanish one and does not start play; the
feeling "angry" in Spanish shows and says the form chosen in each setting; reading each slide while
playing says every slide once; with no local Spanish voice, Spanish is skipped (the online voice is
never used) and Settings says how to add one; a Watch word click says it. **Not checked:** real
voices on the Chromebook, whether it has a Spanish voice, the ChromeOS menu path in the hint, and the
video turning down while a word is said.

## 2026-11-15: shapes in a geometric order

The shapes had played in the order a child usually meets them (circle, square, triangle...), so
the changes between them were arbitrary, and David asked for an order that makes sense as
geometry. They now play triangle, diamond, square, rectangle, pentagon, hexagon, circle, oval,
heart, star: the corners count up from three to six, the hexagon rounds off into the circle, the
circle stretches into the oval, and the oval dents into the heart. The star comes last and changes
back into the triangle when the set loops. The color + shape set follows the same order.

It is more logical, not smoother. The distance the outline travels was measured for every pair:
the total is about the same as before (353 against 343) and the biggest single jump is smaller
(54 against 63). The heart to the star is the one step with no geometry behind it. Built on
2026-11-11, before the six changes above, and published after them.

**Checked on 2026-11-15, locally and on the live site.** On top of the six changes above, 72
tests pass and the build passes its gates at 52.8 KB of 60. In a browser, opened by a settings
link for Shapes and Colors and shapes: both sets play in the new order, the star changes back
into the triangle, one picture stays on screen through the run, a click on a shape says the
shape shown, the device's saved settings are left alone, and the console is clean. The live site
serves the new build and plays the same order. Not checked: the order watched by a child or a
teacher, and the "A new version is ready" prompt (the test browser again had no earlier version).

## 2026-11-15: notes from the classroom, and Things

**The class loved it,** David reported, and had two requests. Settings now opens on the left,
because the projector's mouse is at the left of its screen (a setting can put it back on the
right). And the picture is now as big as fits: it had been at a medium default, 62% of the
screen's shorter side, and is now 79% with both languages, 85% with one and 94% with no words. A
device still on the old default is moved to the new one once. Full screen also has a button now,
in Settings, because the classroom has a mouse and no keyboard.

**Things: four sets whose pictures each device adds for itself.** David has the June 2025
Thiings library (1,900 pictures, with a title, category and three tags for each) in
`~/Code/thiings-demo`, where he built an AAC symbol board from it, and asked how Looksee could
use the pictures. There is a fifth group, Things, with four hand-picked sets of twelve (Animals,
Food, Transportation, At home), each with its word in English and Spanish.

**The pictures are not published and are in no commit.** Thiings' terms, read on 2026-11-15, say
they may not be redistributed or made available for download, and Looksee's repo is public. So
the sets come with no pictures, and a device is given its own: Settings ▸ Things takes a folder
of picture files from the device and keeps them in the browser. Nothing is uploaded. David makes
that folder from his own library with `npm run things` and carries it to the classroom
Chromebook. A note asking Thiings for permission to publish was drafted for David to send;
whether he bought the library or downloaded it free was not known when this was written.

**Checked on 2026-11-15, locally.** 79 tests pass and the build passes its gates at 55.1 KB of
60. In a browser: all 201 slides of every set, in both languages and in English alone, in the
widest font, at a Chromebook's size (1366 × 768) and a phone's, with no picture or word clipped
and none overlapping; with the words hidden; Settings on the left with everything else moved
over, and on the right again. For Things, on a built copy with no pictures in it (as the live
site will be): a thing slide shows its word alone; choosing a folder of the 48 files adds all 48
and ignores two other files; the pictures show at once, after a reload, and with the server
stopped (offline); and Remove takes them away. **Not checked:** any of this on the Chromebook
itself, in particular choosing a folder there with a mouse, and whether that Chromebook keeps a
site's data between sessions. The Spanish is unchecked as before.

**Checked on 2026-11-15, on the live site, after publishing (`7a2d463`).** The site serves the new
build, and no Things picture: `things/dog.avif` and the folder itself answer 404, and the service
worker lists none. A browser that had the earlier version kept showing it, was offered the new
one in Settings ("A new version is ready"), and Reload brought it in; until then a link naming
the Things sets opened as the default sets, because the old version does not know them. After
Reload, at 1366 × 768: the Things link is titled "🧸 Things · EN+ES" and has 52 slides; a thing
with no picture shows its word alone; the picture's box is 79% of the stage with both languages;
Settings is at the left edge with the stage moved over; Full screen and the Left / Right setting
are there. Two test pictures made in the page ("dog.png", "Fire Truck.png") and a text file were
given to "Choose pictures": two were added, the text file was not used, the dog showed after a
reload, and Remove took them away again. Nothing was written to the saved settings.

**A small thing, left as it is:** a thing slide with no picture on the device asks the site for
`things/<name>.avif` and gets a 404, which the browser's console reports as an error. It is how
the dev server shows David's own pictures, it stops once pictures are added, and nothing else is
affected.

## 2026-11-15, later: a plan of timed blocks, 161 pictures, the licence, and Safari

**A plan.** The teacher asked to "program different sets throughout the day in 5 to 25 minute
chunks". Settings ▸ What to show ▸ "A plan" now holds up to 12 blocks, each with its own sets and
5, 10, 15, 20 or 25 minutes. The blocks play in turn; a block's minutes count only while the
slides are playing; after the last block the plan starts over, or stops if "Start over at the
end" is off. The control bar shows the block and the minutes left. A plan travels in a settings
link, so one bookmark can hold a morning. **It follows playing time, not the clock:** whether she
meant blocks that begin at set times of day has not been asked.

**More pictures.** The Things sets grew from 4 sets and 48 pictures to 13 sets and 161, in three
groups: Animals (Pets and farm, Wild animals, Sea animals, Birds and bugs), Food (Food and drink,
Fruit, Vegetables) and Things (Clothes, Toys, At home, At school, Transportation, Outside). Every
picture was looked at first; one was refused for a brand mark. The folder David hands to a
classroom device is `~/Desktop/things` (161 files, 1.7 MB).

**The Thiings licence.** David showed his billing page: "Lifetime Access (Legacy)", which the
terms honour as the Indie tier, so using the pictures in Looksee is licensed and the note asking
permission is not needed. The terms still forbid making the icons available as standalone
downloads and say nothing about public repos. David chose to keep the pictures local: each device
adds its own, and none is in the repo or on the site.

**Safari.** David saw the moving faces drawn on black squares in Safari, which loses an animated
AVIF's clear background. Apple's browsers now get the still pictures. **Not checked in Safari:**
the test browser is Chromium, where the check is simply off.

**Checked on 2026-11-15, locally.** 88 tests pass and the build passes its gates at 58.1 KB of
60. In a browser with the clock moved forward by hand: a three-block plan hands over at the end
of each block's minutes and starts over after the last; with "Start over" off it stops on block
1; 30 minutes spent paused do not count. In Settings: turning the plan on makes a first block
from the sets chosen; clicking a block plays it and puts its sets in the picker; changing its
minutes and sets changes the link; Add, ↑ and Remove work. All 161 pictures load and no picture
or word is clipped or overlapping, in both languages, at 1366 × 768 and at a phone's size. The
console is clean. On a built copy with no pictures in it: the plan hands over and stops as above,
and pictures given under the new names ("octopus.png", "Ice Cream.png", the library's own
"blue-whale.png") are kept and shown while the rest of the set shows its words alone. **Not
checked:** the plan over a real 20 minutes (the clock was faked), the
plan or the new sets on the Chromebook, and the new Spanish words.

**Checked on 2026-11-15, on the live site, after publishing (`65b94e7`).** The site serves the new
build and still no picture (`things/dog.avif` and `things/octopus.avif` answer 404; the service
worker lists none). A browser that had the version before was offered this one in Settings and
Reload brought it in; until then a plan link opened as the default sets, because the old version
does not know plans. After Reload, at 1366 × 768 with the clock moved forward by hand: the link
`?v=1&planOn=1&plan=letters-5_sea-10_fruit-5` is titled "🔤🐾🍎 Plan, 20 min · EN+ES", hands over
from letters to sea animals to fruit, starts over, and does not count 30 minutes spent paused.
Settings lists the three blocks and the eight groups, and says 0 of 161 pictures are added. Two
test pictures made in the page ("octopus.png", "Jump Rope.png") were kept, a text file was not
used, the octopus showed at 79% of the stage, and Remove took them away. Nothing was written to
the saved settings. The only failed requests were for things pictures the device does not have.

## 2026-11-15, evening: a timer, and a shorter control bar

**Published on 2026-11-15** as pull request #7 (merge `43ddbf0`), on top of the plan and the 13
picture sets, and its deploy succeeded.

**A timer.** From a handoff David wrote with Codex. The control bar has a Timer button (`T`): a
sheet starts 1, 3, 5, 10 or 15 minutes in one click, or any length from 1 to 60 with − and +.
While it runs a clock sits in a top corner and stays when the bar fades; clicking it gives Pause,
+1 min and End. At the end it says "Time's up", with Done and +2 min and an optional chime. It is
apart from the slides, Watch, the plan and the school day, and is kept on the device under its
own name, not in the settings or a link.

**The control bar** is now Back, Play, Next, Timer, Tools. Watch, the corner video and Settings
are under Tools, one click further away than before; the video is offered only when there is a
link. **The class has not seen this**, and Settings is now two clicks with a mouse.

**The wake lock** is shared by the slides and the timer, and two faults in it are fixed: a lock
granted just after pausing was never let go, and it was not asked for again after the tab had
been hidden.

**The size gate was raised from 60 KB to 62 KB** by David, for this: the app is 61.1 KB.

**Checked on 2026-11-15, locally.** 99 tests pass and the build passes its gates at 61.1 KB of
62; a build for `/looksee/` has the right paths and no new outside address. In a browser at
1366 × 768 and at a phone's size, with mouse clicks and with keys: a 5-minute timer starts in
two clicks; Pause holds the time and Resume goes on; +1 min, End, Done and +2 min work; a reload
mid-run carries on, and "10 seconds left" and "Time's up" are announced; the clock stays while
the bar fades and during Watch, clear of the words around the video; the slides went on playing
through the end; `T`, Enter, Tab and Esc work and focus goes back to the Timer button; the timer
sheet and Tools never show together; the clock moves to the top left when the video's corner is
the top right; on a phone the sheet stays on screen with Settings open. The console is clean.

**Not checked.** The chime by ear. Reduced motion. The night and high-contrast themes (the timer
uses the control colors, not the stage's). An offline reload. A settings-link window. Whether the
wake lock really holds, and for a whole 15 minutes. A screen reader. A real timer run to its end
(the end time was moved by hand). Anything on the Chromebook.

**Checked on 2026-11-15, on the live site, after the merge (`43ddbf0`).** The site serves the
merged build and still no picture. A browser that had the version before was offered this one in
Settings, and Reload brought it in. After Reload, at 1366 × 768 with the clock moved forward by
hand: the control bar is Back, Play, Next, the slide count, the plan's block, Timer and Tools, on
one row with Settings open or closed, and clear of the words. Tools holds Watch and Settings (no
video link was set), and Settings opens on the left. A plan of two blocks and a 10-minute timer
ran together: after 5 minutes of playing the plan was on its second block and the timer read
4:58; after 15 the plan had started over and the timer said "Time's up"; pausing the slides did
not pause the timer; Done put the Timer button back. The only failed requests were for things
pictures the device does not have. The list under "Not checked" above still stands.

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

**Checked on 2026-11-10, after the split, locally.** All 32 tests pass and the build passes its
gates at 43.9 KB of 60. Offline was tested for real: the built site was loaded once, its server
shut down, and the page reloaded. It came up from what was stored, and all 38 picture slides
played with nothing falling back. For Spanish, every slide with a word was stepped through in
both languages at the largest size, at phone and laptop shapes: no word was clipped or ran off
the screen, and a screen reader is given the Spanish words marked as Spanish.

**Checked on 2026-11-10, on the live site, after these two changes.** A browser that had the
earlier version was offered the new one in Settings ("A new version is ready"), and Reload
switched to it. The Words choice is there, a slide shows its English and Spanish words together,
and all 220 pictures are in the browser's store.

**Checked on 2026-11-11, locally, after the review fixes.** All 49 tests pass, including one that
changes every shape into every other and fails if the outline crosses itself or pinches, and one
that every shape is exactly symmetrical. The build passes its gates at 46.3 KB of 60. In a
browser, all 131 slides were stepped through in both languages at the largest size, in the widest
font, at phone and laptop shapes, with no word clipped or off the screen. The word pause held the
word back for the time set, including inside a run of shapes. Hiding the words left the deck
where it was and still showed the set names. The morph was checked by stepping the animation
clock by hand, since the window was not being drawn at the time: each change starts as the old
shape, passes through distinct in-between shapes and ends as the new one; stepping on mid-change
continues from where the outline was; and the last shape changes back into the first.

**Checked on 2026-11-11, on the live site, after this change.** The site serves the new build
and its console is clean. The deck opens on the set name, and letter slides show their word and
small picture. With both languages on, the shape, color + shape and feelings slides show the
right words, el or la, and the Spanish color after its noun; the first letter is the slide's
color on shapes and plain ink on color + shape slides; and no label runs past its box. The
service worker installs and stores all 220 pictures. The morph ran at full speed this time and
was read on every frame: circle to square took 0.68 s and passed through 77 different outlines
in the same picture element, and stepping on mid-change carried on with no jump.

**Not checked.** The morph seen by a person: it has been measured frame by frame, not watched.
The "A new version is ready" prompt for this change (the test browser had no earlier version
stored; the prompt was checked on 2026-11-10 and has not changed). Installing the app to a home
screen. Going offline on the live site itself (the
offline run was on a local copy of the same build). The school-day bar across a real school
day (one moment in the browser, the rest by unit tests). Typing emoji into the schedule on a
Chromebook or iPad. The device's own reduced-motion setting (it shares a path with the Still
setting, which was checked). Any device other than one Mac.

## Decisions still open

- **The Spanish words.** They were chosen without a Spanish speaker and need checking, and there
  are more of them now: 26 letter words, el and la, and color words matched to their nouns. The
  regional choices are deliberate but arguable (anaranjado not naranja, rosa not rosado, café not
  marrón, banana not plátano, carro not coche), as is writing "enojado/a" for words that change
  with gender. The letters have no Ñ.
- **The letter words.** Three letters are a stretch (quesadilla, xylophone / xilófono, zoo /
  zoológico) and have no picture. The nose for N is the device's plain yellow emoji, while the
  Body set deals five skin tones. The juice box, waffle and yo-yo are 2019 emoji and show as
  empty boxes on devices older than that.
- **No automatic check that words fit.** It is a manual sweep in the browser. A test that
  measures every possible label against the font's real letter widths would catch a too-long
  word before it ships.
- **The words.** Feelings, gestures and body words were chosen without a clinician: "angry"
  rather than "mad", "stop" for a raised hand, "love" for heart hands. Each is one line in
  `src/concepts.js`.
- **The default school day.** 8:00 to 3:00, lunch at 11:30, going home at 2:30 is a placeholder.
- **Ads on videos.** The app adds none and hides YouTube's controls, suggestions and end screen,
  but it cannot remove or skip ads YouTube places on a video. Since 2026-11-12 it waits them out
  instead of giving up.
- **What Clip Choice has learned since.** Its repo has newer handling for pre-roll ads and for
  pasted embed code and share links. Looksee now waits out pre-roll ads the same way; `src/link.js` still reads plain links only.
- **A license for the code.** The repo is public and has none yet.
- **A plan by the clock?** Blocks follow playing time. If the teacher meant "letters at 9:15",
  blocks need start times, probably shared with the school-day bar.
- **The Thiings pictures.** Licensed for the app; kept off the repo and the site by David's
  choice. Putting them on the site for every visitor (from a private source at deploy time, or in
  the repo after asking Thiings) is open.
- **The size budget.** 63.2 KB of 64 (raised from 60 to 62 for the timer, which cost 3 KB, and to
  64 for the weather, which cost 2.1 KB). The 161
  things cost about 1.9 KB; more of them, or another feature, needs the words loaded apart from
  the app or a bigger budget again.
- **Settings under Tools.** One more click than before. If the class misses it, Settings can go
  back on the bar beside Tools.
- **The rest of the Codex handoff.** Settings split into quick and advanced, a Routine strip
  (Now / Next, moved on by hand), and a private file of Things pictures. None is started.
- **113 new Spanish words** for the things, as unchecked as the rest. Arguable ones: plátano for
  banana (the letter B slide says banana), cometa for kite, mariquita for ladybug, tiza for chalk,
  chile for pepper, palomitas for popcorn, panqueques for pancakes.
