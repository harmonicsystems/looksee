// Background music: playlists of quiet music to play under the slides. Pure:
// player.js plays them.
//
// Every file is in public/music/ and is free to publish: the tunes are in the
// public domain, and each recording either was made for Looksee
// (`npm run music`, scripts/music.mjs) or is itself public domain or CC0.
// `credit` says which, and public/NOTICE.txt lists the sources. The files are
// not stored for offline use by default (they are bigger than the rest of the
// app): Settings ▸ Music saves them on a device that wants them.

export const MUSIC_DIR = 'music'

// One track per line: its file name, then its title.
const tracks = (lines) => lines.split('\n').map((l) => ((l = l.split(',')), { file: l[0], title: l[1] }))

export const PLAYLISTS = [
  {
    id: 'nursery',
    label: 'Nursery tunes',
    emoji: '🎶',
    credit: 'Played on a music box, made for Looksee (CC0)',
    tracks: tracks(`twinkle,Twinkle Twinkle Little Star
mary,Mary Had a Little Lamb
row,Row Row Row Your Boat
frere,Frère Jacques
london,London Bridge
macdonald,Old MacDonald
buns,Hot Cross Buns
clair,Au Clair de la Lune
joy,Ode to Joy`)
  },
  {
    id: 'classical',
    label: 'Quiet classical',
    emoji: '🌙',
    credit: 'Public domain and CC0 recordings from Wikimedia Commons',
    tracks: tracks(`gymnopedie,Satie: Gymnopédie No. 1
prelude-c,Bach: Prelude in C
traumerei,Schumann: Träumerei
air,Bach: Air
nocturne,Chopin: Nocturne in E-flat
cello,Bach: Prelude from Cello Suite No. 1
morning,Grieg: Morning Mood
asleep,Schumann: Child Falling Asleep`)
  }
]

export const VOLUMES = { soft: 0.35, medium: 0.6 }

// How loud the music is now, given why it should give way: silent under a
// video with sound, a third while something is said or the chime sounds.
export const duckLevel = (vol, why) => (why.has('video') ? 0 : why.size ? vol * 0.3 : vol)
