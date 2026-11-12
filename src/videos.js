// Preset videos for Watch: one click plays a video in the middle of the
// screen with words around it, for language support while it plays.
//
// To add one: an entry here with the YouTube link, a title, an emoji for its
// tile, and its words. Each word has English (`label`), Spanish (`es`, plus
// `art` for a noun) and an emoji drawn above it, from the device's own emoji
// font (no files). Words follow the Words settings like slide words do.
// Check first that the video plays in the corner (Settings ▸ Videos): some
// owners don't allow their videos to be played on other sites.

const w = (label, es, art, emoji) => ({ label, es, art, emoji })

export const VIDEOS = [
  {
    id: 'pawPenguins',
    title: 'Paw Patrol: Penguins',
    emoji: '🐧',
    url: 'https://youtu.be/z1vXJVI2L5M',
    words: [
      w('Paw Patrol', 'Paw Patrol', '', '🐾'),
      w('dog', 'perro', 'el', '🐶'),
      w('pup', 'cachorro', 'el', '🐕'),
      w('penguin', 'pingüino', 'el', '🐧'),
      w('help', 'ayuda', 'la', '🆘'),
      w('rescue', 'rescate', 'el', '🚒'),
      w('team', 'equipo', 'el', '🤝'),
      w('snow', 'nieve', 'la', '❄️'),
      w('ice', 'hielo', 'el', '🧊'),
      w('cold', 'frío', '', '🥶'),
      w('slide', 'deslizarse', '', '🛝')
    ]
  }
]

// How many words go on each side of the video: as even as possible, with the
// top and bottom (the wide sides) taking any extra first.
export function sides(n) {
  const out = { top: 0, right: 0, bottom: 0, left: 0 }
  const order = ['top', 'bottom', 'right', 'left']
  for (let i = 0; i < n; i++) out[order[i % 4]]++
  return out
}
