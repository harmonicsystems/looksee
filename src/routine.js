// Our day: words for the routines of a school day — arriving, lining up,
// asking for things, the five senses at lunch, math words and going home —
// asked for by the class's teacher (2026-11-18). Watch presets can use a set as
// the words around a video (videos.js).
//
// One word per line: English, Spanish, the Spanish article (empty for a verb,
// an adjective or a phrase), the emoji and, when the word has one, its picture
// (2026-11-20). Kept as text, like things.js, because lines of code cost more
// of the size budget. No commas inside a word.
//
// The pictures are our own, drawn with the picture library's cast (Ana, Sam, Jo
// and Max) and props: public/day/<picture>.avif, copied out of the library by
// `npm run library` (scripts/library.mjs, which also knows where each one
// comes from). A word with no picture yet (first, again, the math words) is
// drawn as its emoji, and so is any word whose picture cannot load.
//
// These lists are first drafts for the teacher to correct. The Spanish follows
// the rest of Looksee (Latin American, as heard in US classrooms) and has not
// been checked by a Spanish speaker. Directions are the familiar command
// (mira, siéntate), as a teacher says them. No word here is written "o/a":
// that form follows the child (Settings ▸ Spanish feelings), and these
// words describe food and things, not the child. Only emoji from 2020 or
// earlier (Emoji 13), since the emoji is what shows when there is no picture.

const set = (lines) =>
  lines.split('\n').map((line) => {
    const [label, es, art, emoji, pic] = line.split(',')
    return { label, es, art, emoji, pic }
  })

export const ROUTINE = {
  arrival: set(`hello,hola,,👋,wave
backpack,mochila,la,🎒,backpack
hang up,cuelga,,🧥,hang-up
wash hands,lávate las manos,,🧼,wash-hands
sit,siéntate,,🪑,sit
look,mira,,👀,look
listen,escucha,,👂,listen
quiet,silencio,,🤫,quiet
wait,espera,,⏳,wait
help,ayuda,,🙋,help`),
  lineUp: set(`line up,haz fila,,🚸,line-up
walk,camina,,🚶,walk
stop,alto,,🛑,stop
wait,espera,,⏳,wait
quiet hands,manos quietas,,✋
eyes forward,ojos al frente,,👀,eyes-forward
follow,sigue,,👣
door,puerta,la,🚪,door
first,primero,,🥇
last,último,,🏁`),
  core: set(`I,yo,,🧒,me
want,quiero,,🤲,want
more,más,,➕,more
go,vamos,,🟢,run
stop,alto,,🛑,stop
like,me gusta,,👍,like
help,ayuda,,🙋,help
look,mira,,👀,look
again,otra vez,,🔁
not,no,,🚫,no-thanks
all done,terminé,,✅,all-done`),
  requesting: set(`I want,yo quiero,,🤲,want
please,por favor,,🙏,please
thank you,gracias,,💛,thank-you
more please,más por favor,,➕,more
help please,ayuda por favor,,🙋,help
open please,abre por favor,,📦,open-please
all done,terminé,,✅,all-done
eat,comer,,🍽️,eat
drink,beber,,🥤,drink
water,agua,el,💧,water
cup,vaso,el,🥛
spoon,cuchara,la,🥄,spoon`),
  senses: set(`see,ver,,👁️,see
hear,oír,,👂,hear
smell,oler,,👃,smell
taste,probar,,👅,taste
touch,tocar,,✋,touch
sweet,dulce,,🍭,sweet
sour,ácido,,🍋,sour
salty,salado,,🧂,salty
crunchy,crujiente,,🥨,crunchy
soft,suave,,🧸,soft
hot,caliente,,🔥,hot
cold,frío,,🧊,cold`),
  mathWords: set(`count,contar,,🧮,count
number,número,el,🔢
how many?,¿cuántos?,,❓
more,más,,⬆️
less,menos,,⬇️
equal,igual,,⚖️
add,sumar,,➕
take away,quitar,,➖
first,primero,,🥇
next,siguiente,,➡️
last,último,,🏁`),
  packUp: set(`jacket,chaqueta,la,🧥,jacket
hat,gorra,la,🧢,cap
gloves,guantes,los,🧤,gloves
backpack,mochila,la,🎒,backpack
folder,carpeta,la,📁
lunchbox,lonchera,la,🍱,lunchbox
line up,haz fila,,🚸,line-up
bus,autobús,el,🚌,bus
car,carro,el,🚗,car
home,casa,,🏠,home
goodbye,adiós,,👋,goodbye`)
}

// Where the pictures live, under public/. One still AVIF each.
export const DAY_DIR = 'day'

// Every picture these words show, each once (a picture can serve several words).
export const dayFiles = () => [...new Set(Object.values(ROUTINE).flat().map((x) => x.pic).filter(Boolean))]
