# Looksee

A calm screen that plays first concepts, one picture at a time.

- **Letters, numbers, shapes, colors and opposites**, drawn by code so their look can be changed.
  One shape changes smoothly into the next, and each letter comes with a word and a small picture.
- **Feelings, gestures and body parts**, shown as animated emoji. Hands and body parts appear in
  five skin tones, dealt at random and evenly, and include a hearing aid and prosthetic limbs.
- **Words in English, Spanish or both** under each picture, with the first letter picked out, el
  or la on Spanish nouns, and an optional pause so a child can say the word first.
- **Two-word slides** that put a color with a shape: "red circle / círculo rojo".
- **A bar for the school day** along the top: one box per part of the day, with the emoji you
  choose, shaded as the day goes by. You set when the day starts and ends and the parts in between.
- **A corner video**: a YouTube link can play in any corner with no controls, suggestions or end
  screen.

A settings drawer changes everything live: which sets play, pace and order, theme, background,
drawing style, size, lettering, motion, skin tone and the schedule.

Looksee starts paused, works from the keyboard, respects reduced motion, and collects nothing. It
stores only its own settings on the device and installs as an app.

Keys: `Space` play/pause, `←` `→` back/next, `S` settings, `V` video, `M` sound, `F` full screen.

## What it can and can't do

- The emoji pictures are copies kept in this repo. The app never contacts Google, and its only
  outside traffic is YouTube, and only when you start a video.
- It adds no ads and hides YouTube's controls and suggestions, but it cannot remove ads that
  YouTube itself places on a video.
- Once it has loaded, everything except the corner video works offline.
- The animations need a browser that can play animated AVIF. Older ones show a still picture.

## Development

```
npm install
npm run dev        # http://localhost:5173
npm test
npm run build      # includes the size and contrast gates
```

Svelte 5 and Vite, with no runtime dependencies. `CLAUDE.md` explains how it is built and
`docs/STATUS.md` says where things stand. To change a picture set, edit `FEELINGS`, `GESTURES` or
`BODY` in `src/concepts.js` and run `npm run pictures`.

## Credits

The faces, hands and body pictures are [Noto Emoji](https://googlefonts.github.io/noto-emoji-animation/)
by Google, used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode); see
`public/NOTICE.txt`. The typeface is Atkinson Hyperlegible, under the SIL Open Font License; see
`public/fonts/OFL-AtkinsonHyperlegible.txt`.
