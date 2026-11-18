// Our day: words for the routines of a school day — arriving, lining up,
// asking for things, the five senses at lunch, math words and going home —
// asked for by the class's teacher (2026-11-18). Each word is drawn as the
// device's own emoji above it, so there are no files. Watch presets can use
// a set as the words around a video (videos.js).
//
// One word per line: English, Spanish, the Spanish article (empty for a verb,
// an adjective or a phrase) and the emoji. Kept as text, like things.js,
// because lines of code cost more of the size budget. No commas inside a word.
//
// These lists are first drafts for the teacher to correct. The Spanish follows
// the rest of Looksee (Latin American, as heard in US classrooms) and has not
// been checked by a Spanish speaker. Directions are the familiar command
// (mira, siéntate), as a teacher says them. No word here is written "o/a":
// that form follows the child (Settings ▸ Spanish feelings), and these
// words describe food and things, not the child. Only emoji from 2020 or
// earlier (Emoji 13), since a word slide has no picture file to fall back on.

const set = (lines) =>
  lines.split('\n').map((line) => {
    const [label, es, art, emoji] = line.split(',')
    return { label, es, art, emoji }
  })

export const ROUTINE = {
  arrival: set(`hello,hola,,👋
backpack,mochila,la,🎒
hang up,cuelga,,🧥
wash hands,lávate las manos,,🧼
sit,siéntate,,🪑
look,mira,,👀
listen,escucha,,👂
quiet,silencio,,🤫
wait,espera,,⏳
help,ayuda,,🙋`),
  lineUp: set(`line up,haz fila,,🚸
walk,camina,,🚶
stop,alto,,🛑
wait,espera,,⏳
quiet hands,manos quietas,,✋
eyes forward,ojos al frente,,👀
follow,sigue,,👣
door,puerta,la,🚪
first,primero,,🥇
last,último,,🏁`),
  core: set(`I,yo,,🧒
want,quiero,,🤲
more,más,,➕
go,vamos,,🟢
stop,alto,,🛑
like,me gusta,,👍
help,ayuda,,🙋
look,mira,,👀
again,otra vez,,🔁
not,no,,🚫
all done,terminé,,✅`),
  requesting: set(`I want,yo quiero,,🤲
please,por favor,,🙏
thank you,gracias,,💛
more please,más por favor,,➕
help please,ayuda por favor,,🙋
open please,abre por favor,,📦
all done,terminé,,✅
eat,comer,,🍽️
drink,beber,,🥤
water,agua,el,💧
cup,vaso,el,🥛
spoon,cuchara,la,🥄`),
  senses: set(`see,ver,,👁️
hear,oír,,👂
smell,oler,,👃
taste,probar,,👅
touch,tocar,,✋
sweet,dulce,,🍭
sour,ácido,,🍋
salty,salado,,🧂
crunchy,crujiente,,🥨
soft,suave,,🧸
hot,caliente,,🔥
cold,frío,,🧊`),
  mathWords: set(`count,contar,,🧮
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
  packUp: set(`jacket,chaqueta,la,🧥
hat,gorra,la,🧢
gloves,guantes,los,🧤
backpack,mochila,la,🎒
folder,carpeta,la,📁
lunchbox,lonchera,la,🍱
line up,haz fila,,🚸
bus,autobús,el,🚌
car,carro,el,🚗
home,casa,,🏠
goodbye,adiós,,👋`)
}
