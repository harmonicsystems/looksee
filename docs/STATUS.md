# Status

As of 2026-11-18. `CLAUDE.md` explains how Looksee is built. This note says where things stand.

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

**Weather went out on 2026-11-15** (`5fff5f8`): the temperature outside as a big slide, off unless
a teacher turns it on. It is the first thing besides YouTube that Looksee asks of an outside
service. It is described under "2026-11-15, night" below.

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

## 2026-11-15, night: the weather

**Weather in Tools (or `O`) shows the temperature in Rhinebeck as its own big slide,** for circle
time: the sky as an emoji, the temperature in °F, a word under each in the languages the slides
use, and a cold-to-hot scale with today's band marked. A click on it, or `R`, says it. It is off by
default; Settings ▸ Weather turns it on, and a settings link carries it (`&weather=1`).

**It is the one exception to "nothing leaves the device except YouTube", and David chose it.** The
reading comes from Open-Meteo, asked only when the weather is opened with the setting on. The
request names the place and nothing else. `CLAUDE.md` ▸ Weather has the rules, and a test fails if
any file but `outside.js` gains a `fetch`.

**It was built on a branch and merged with the timer and the plan** (pull request 8). The timer
kept `T`, so the weather's key is `O`; Weather went into Tools with Watch and Settings, and the
Timer button stays in the bar on the weather slide.

**The size gate was raised from 62 KB to 64 KB** by David, for this: the app is 63.2 KB.

**Checked on 2026-11-15, locally.** 107 tests pass and the build passes its gates at 63.2 KB of
64. In the dev server with a live reading: English, Spanish and both; the calm and high-contrast
themes; laptop and phone shapes; with the mouse and with the keys. After the merge: opening from
Tools and with `O`, the timer opened over the weather with `T`, and `Esc` closing each in turn.

**Checked on 2026-11-15, on the live site, after the merge (`5fff5f8`).** A settings link with
`&weather=1` opened the weather with `O` and showed a live reading (37°F, "partly cloudy / algo
nublado", "cold / frío"), with Back to slides and Timer in the bar.

**Not checked.** Hearing it read aloud. The "could not be reached" slide with the network really
off. Whether the classroom Chromebook's network allows `api.open-meteo.com`. Anything on the
Chromebook.

## 2026-11-15, night: Settings in sections that fold

David asked how to make Settings easier for the teacher: it had 56 kinds of control in one long
scroll. It is now folded into sections, in the order she needs them. What to show stays open
and lists the eight groups as one-click buttons; the single sets appear on request. Words and
speech, and Pace, come next, folded, each saying what it is set to. A set's own options show only
while that set is in use. Everything else is under "Set up once". The two sliders became rows of
choices. Nothing was removed. `CLAUDE.md` has the details.

**Checked on 2026-11-15, locally.** 100 tests pass and the build passes its gates at 61.9 KB of
62, about 150 bytes under (the first version was 62.4 KB and was trimmed to fit). In a browser at
1366 × 768: with Settings open, 22 controls show where about 150 did, the panel is 1,183 px tall
where it was about 4,970, and the first screen holds the plan's checkbox, the eight groups, Words
and speech, and Pace. Each closed section shows its state. "Choose single sets" shows the 24 sets
and starts on when a group is partly on. The options follow the sets exactly (colors alone: no
section; adding: number style and "up to"; letters, shapes, feelings and body each add theirs),
and with a plan they cover every block. The seconds and pause choices change the slide and the
link. Space on a section's heading opens it and does not start the slides. The panel works on the
right, and as the sheet at a phone's size with no summary cut short. The console is clean.
**Not checked:** the teacher has not seen it; a screen reader; Safari.

**The weather landed while this was being built** (pull request #8), so it was replayed on top of
it. Weather has its own folded section under "Set up once", saying On or Off, and its key is in
the key list. Together they came to 63.9 KB of the 64 the weather had raised the limit to, 69
bytes under, which is too close: the 161 things' words were rewritten from lines of code to
lines of text (the same data, checked), which gave back 125 bytes. It is now 63.8 KB, 194 bytes
under, with 108 tests passing. The deploy measures what a build here measures: the published
version built here has the same file names and the same sizes as the deploy's log.

**Checked on 2026-11-15, on the live site, after publishing (`0fc7f84`).** The deploy passed with
108 tests at 63.8 KB. The site serves the new build and no picture. A browser on the timer's
version was offered the new one in Settings, and Reload brought it in. After Reload the panel
opens on the left with its sections folded: What to show open, then Words and speech and Pace,
and under "Set up once" School day, Weather (Off), Pictures (0 of 161 added), Videos, Look, Share
this setup, and Keys, reset and credits; with only Things playing there is no options section,
and Pace ends above the bottom of a 768-pixel screen. David was trying the same tab at the time,
so the rest was checked on a production build served on the Mac, which is the same code: Weather
appears in Tools once it is ticked in Settings, and its slide read 37°F in Rhinebeck from
Open-Meteo, the only outside address contacted; the options follow the sets; the seconds choices
change the link; the sea animals' Spanish words came through the new text format. Found on the
live site and fixed afterwards: a closed "What to show" said "Plan, 1 blocks"; it now says
"1-block plan".

**Then pull request #9 was merged** (the timer's buttons close by themselves), 22 seconds after
the fix above was pushed, which cancelled that push's deploy; the merge's own deploy carried both.
The site now serves the build of `313119b`: 63.9 KB of 64, 116 bytes under, with 108 tests
passing. A build of that commit here has the same file name as the one the site serves, and the
fix ("1-block plan") is in it.

## 2026-11-15, late: four faces for the timer

David asked whether the timer could be an hourglass, "and other visual ways of representing
durations". The clock can now be drawn four ways, picked by their pictures in the timer's sheet:
a disc that closes (the default; it replaced the ring), a bar that empties, a dot for each
minute, and an hourglass whose sand is in proportion to the time. In every one, color is the
time left. "Fill the screen" draws the clock over the whole stage in the stage's colors, for a
class to see, and Bigger / Smaller switch while it runs. "Show the numbers" can hide the minutes
and seconds. The three choices are kept with the timer, not in the settings.

**The size gate went from 64 to 66 KB** for this, by David's choice; the app is 64.8 KB.

**Checked on 2026-11-15, locally.** 113 tests pass (the shapes are tested: where the disc's
wedge ends, the bar's length, how many dots are lit, that they fit for 1 to 99 minutes, and that
the hourglass's sand areas match the time). The build passes its gates at 64.8 KB of 66. In a
browser at 1366 × 768 with the clock moved forward by hand: each face shows the right share in
the corner clock and filling the screen; the full-screen clock sits between the day bar and the
control bar, moves over when Settings opens, and uses the stage's colors; with the numbers off
they are hidden but still there for a screen reader; Bigger and Smaller switch while it runs;
"Time's up" fills the screen too; the choices come back after a reload. At a phone's size the
sheet stays on screen with its pictures, and the full-screen clock stops above the control bar's
two rows (it covered the first row until that was fixed). The console is clean.
A production build served on the Mac did the same: the four faces in the sheet, the disc and the
bar in the corner clock, the hourglass and the dots filling the screen in the stage's colors.
**Not checked:** a real timer run to its end, the other three stage themes, reduced motion, a
screen reader, Safari, and anything on the Chromebook.

**Checked on 2026-11-15, on the live site, after publishing (`fd5825e`).** The deploy passed with
113 tests at 64.8 KB of 66. The site serves the new build and no picture. A browser on the
version before was offered this one in Settings, and Reload brought it in. A timer that the old
version had saved, with nothing about faces in it, came through: it had ended, said "Time's up",
and Done dismissed it. After that, at 1366 × 768 with the clock moved forward by hand: the sheet
offers Disc, Bar, Dots and Hourglass with the disc chosen; a 3-minute hourglass filling the
screen sat between the day bar and the control bar in the stage's colors, with half its sand
down at 1:29; its buttons were Pause, +1 min, End and Smaller; Smaller put it back in the corner;
End cleared it. No request failed and the console was clean.

## 2026-11-15, late: five more sets of things

Music, Sports and Tools joined the 🧸 Things group, and a new group, 🌍 Places, holds Around town
and Space: 62 more pictures, 223 in 18 sets. Each picture was looked at on a contact sheet before
it was chosen. They fit under the 66 KB limit the timer's faces brought: the app is 65.6 KB with both.
`~/Desktop/things` was brought up to date (223 files, 2.4 MB). In the dev server all 62 new
pictures load, and a link to the Places group is titled "🌍 Places · EN+ES". 113 tests pass with main merged in.
Not checked: the first screen of Settings at 1366 × 768 with nine groups instead of eight, and
the label sweep for the new words (the longest are "caja de herramientas" and "fútbol americano").

## 2026-11-16: background music

Settings ▸ Music turns on **Music** in Tools: big tiles per playlist, Soft / Medium, and a 🎵 Stop
button in the bar while it plays (`B` too). The first playlist is nine nursery tunes rendered by
`scripts/music.mjs` as a soft music box (9 minutes, 4.4 MB, CC0). **David raised the size gate
from 66 KB to 68 KB** for it: the app is 67.6 KB. Checked in the dev server at 1366 × 768: a
playlist starts from Tools and moves on to the next tune; Stop and `B` work; the music dips to a
third while a slide is read aloud and for the timer's chime, and fades out and pauses for a video
dip, then comes back; Save for this device stored all nine and the next tune played from the
saved copy. Not checked: a real corner or Watch video with sound (the dip was driven directly),
an iPad (where a dip is a pause), and offline in the built app.

## 2026-11-17: a calmer What to show

David sent a screenshot of Settings and found it cluttered. Every chosen thing was the same solid
dark slab, and every plan block repeated its seven controls. Now a chosen set, group or minute is
a pale tint with a brand edge (and a ✓ on sets and groups); solid is kept for the plan block
playing; only that block shows its minutes, ↑ and Remove; groups sit two to a row; and a closed
section's summary stays on one line ("…" when long). CSS only, apart from one `{#if}` and a
wrapper, so the JS stays 67.8 KB. Checked in the dev server at 1366 × 768 and 375 × 812, light and
dark: clicking a block moves its toolbar there, minutes and ↑ work, the grid gives way to rows
when single sets show, and Pace now ends at 620 px. Not checked on the classroom Chromebook.

## 2026-11-17: Quiet classical

A second playlist, 🌙 Quiet classical: Satie's Gymnopédie No. 1, Bach's Prelude in C, Schumann's
Träumerei, Bach's Air, Chopin's Nocturne Op. 9 No. 2, Bach's Cello Suite No. 1 Prelude, Grieg's
Morning Mood and Schumann's Child Falling Asleep (25 minutes, 12.3 MB). David approved the eight
recordings; their licences were checked again on Commons before use (five PD, three CC0), and each
is credited in `NOTICE.txt`. The app is 67.8 KB of 68. Checked in the dev server: both tiles show,
the playlist plays from Gymnopédie and moves on to the Prelude, every file is served, Stop works.
**Not listened to by anyone yet**: how they sound together, and whether Morning Mood's loud
middle is too much for the room, is for David to hear.

## 2026-11-18: Our day, from the teacher's schedule

The class's teacher sent her day and what she would like on the screen in each part of it:

| time | part | what she asked for |
|---|---|---|
| 7:50–8:30 | Arrival | a calm video (an aquarium, or another sensory-friendly one), with words around it for the morning routine or classroom expectations |
| 8:32–9:12 | Reading | circle time about 8:45–8:50; Mooseclumps' Good Morning Song to move to clean-up and the carpet |
| 9:14–9:54 | Specials | words for lining up |
| 9:56–10:36 | ELA | snack and the bathroom, then core words; some videos to choose from at snack (Thanksgiving or holiday cartoons, she will send them) |
| 10:38–11:18 | Specials | |
| 11:20–12:00 | Math | math words; a count-to-100 movement video for a movement break |
| 12:05–12:45 | Lunch | a video to choose, words and requesting phrases, the five senses (for trying new foods) |
| 12:47–2:09 | Centers | about 2:00, the Singing Walrus Goodbye Song with words for packing up and the bus |

**Built: 🏫 Our day,** seven sets of words drawn as the device's emoji (Good morning, Lining up,
Core words, Asking, Five senses, Math words, Going home). The lists are first drafts for her to
correct, and the Spanish is unchecked. She switches between them with one bookmark per part of
the day (`docs/teacher-links.md`). The size gate went from 68 to 70 KB for them (David,
2026-11-18); the app is 69.0 KB. Swept in a browser at laptop and phone shapes, both languages:
every slide fits and nothing is requested from the network.

**Not built: the videos.** YouTube could not be reached from where this was built, so none was
checked. Candidates for David to try in the corner (Settings ▸ Videos) before any becomes a Watch
preset with an Our day set around it:

- Good Morning Song, Mooseclumps (she wrote "Mooselumps"): `https://youtu.be/n4Vi1JWf3bc`, found
  through a mirror site, so check it is the channel's own upload. Words: Good morning.
- Let's Get Fit, Count to 100 by 1's, Jack Hartmann (4:10, a new exercise every ten):
  `https://youtu.be/0TgLtF3PMOc`. Words: Math words.
- Goodbye Song, The Singing Walrus: no link found. Words: Going home.
- A calm aquarium video: none found with no music and no ads. Words: Good morning.
- Holiday cartoons for snack and lunch: waiting for her list. Words: Asking.

**Not built: a day by the clock.** Her schedule is in clock times, and two moments are "around"
a time (circle 8:45, goodbye 2:00). David chose bookmarks first; a by-the-clock day comes after
she has used them.

## 2026-11-18: sets by the school day

Once the Our day bookmarks worked, David asked for the day to run by itself. Each part of the
school day can now have its own sets, and with **Follow the school day** on, the part the clock is
in plays them. It changes at the next slide, never mid-slide, and never starts playing by itself.
The schedule is the same every day. Set up in Settings ▸ What to show: click a part, choose its
sets. The day bar takes 12 parts now, so her whole day fits. The size gate went to 72 KB; the app
is 70.0 KB.

Checked in a browser with the clock moved: paused at 9:13 it shows Good morning and at 9:14
Lining up; playing across 12:05 it finishes the slide, then starts Asking from its first word;
the bar shows "🍎 until 2:09"; clicking a part and a group changes only that part; the bookmark is
named "🏫➕ School day · EN". A review then found four problems, all fixed and checked again: the
slides froze when two parts in a row had the same sets; editing the playing part's time cut the
slide off; the sets before and after the day could not be chosen; and with the day bar hidden
there was nowhere to edit the times. Not yet seen in the classroom.

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
- **Sets by the school day: one schedule for every day.** Centers changes through her week; a
  schedule per weekday was offered and not chosen. Nor is a video cued at a time (the morning song
  around 8:45, the goodbye song at 2:00).
- **The Our day words** are drafts. She offered to say what the vocabulary should be once the
  shape is settled; their Spanish is unchecked.
- **The Thiings pictures.** Licensed for the app; kept off the repo and the site by David's
  choice. Putting them on the site for every visitor (from a private source at deploy time, or in
  the repo after asking Thiings) is open.
- **The size budget.** 70.0 KB of 72. David raised the limit to 68 on 2026-11-16 for music, and on
  2026-11-18 to 70 for Our day and to 72 for sets by the school day. Before that, three times on 2026-11-15: from 60 to 62 for the timer (3 KB), to 64 for the weather (2.1 KB), and to 66
  for the timer's faces (0.9 KB). The 223 things cost about 2.5 KB; many more of them need their
  words loaded apart from the app.
- **The weather.** The place is fixed in the code (Rhinebeck), the temperature is °F only, and the
  bands (freezing below 32, cold to 49, cool to 64, warm to 79, hot from 80) were chosen without
  the class. Its ten Spanish words (helado, fresco, cálido, caluroso, algo nublado, con niebla,
  con llovizna, con nieve, tormentoso, despejado) are unchecked. "Partly cloudy" shows a sun in
  its picture even after dark. Not built: a chip on the day bar, and what to wear.
- **Settings under Tools.** One more click than before. If the class misses it, Settings can go
  back on the bar beside Tools.
- **The rest of the Codex handoff.** Settings split into quick and advanced, a Routine strip
  (Now / Next, moved on by hand), and a private file of Things pictures. None is started.
- **62 more Spanish words** for the newest things, unchecked: básquetbol, boliche for bowling,
  pinzas for pliers, cubeta for bucket, regadera for watering can, patio de juegos for playground,
  piscina for pool, transbordador for space shuttle.
- **113 new Spanish words** for the things, as unchecked as the rest. Arguable ones: plátano for
  banana (the letter B slide says banana), cometa for kite, mariquita for ladybug, tiza for chalk,
  chile for pepper, palomitas for popcorn, panqueques for pancakes.

- **Background music: listen to both playlists.** Nobody has heard them yet. Morning Mood grows
  loud in the middle; drop it if it is too much. The budget has 0.2 KB left.
