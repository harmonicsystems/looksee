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
// been checked by a Spanish speaker; words that change with gender are
// written "frío/a", like the feelings.

const set = (lines) =>
  lines.split('\n').map((line) => {
    const [label, es, art, emoji] = line.split(',')
    return { label, es, art, emoji }
  })

export const ROUTINE = {
  arrival: set(`hello,hola,,👋
backpack,mochila,la,🎒
hang up,colgar,,🧥
wash hands,lavar las manos,,🧼
sit,sentarse,,🪑
look,mirar,,👀
listen,escuchar,,👂
quiet,silencio,el,🤫
wait,esperar,,⏳
help,ayuda,la,🙋`),
  lineUp: set(`line up,hacer fila,,🚸
walk,caminar,,🚶
stop,alto,,🛑
wait,esperar,,⏳
quiet hands,manos quietas,,✋
eyes forward,ojos al frente,,👀
follow,seguir,,👣
door,puerta,la,🚪
first,primero,,🥇
last,último,,🏁`),
  core: set(`I,yo,,🙋
want,quiero,,🤲
more,más,,➕
go,vamos,,🟢
stop,alto,,🛑
like,me gusta,,👍
help,ayuda,la,🆘
look,mira,,👀
again,otra vez,,🔁
not,no,,🚫
all done,terminé,,✅`),
  requesting: set(`I want,yo quiero,,🤲
please,por favor,,🙏
thank you,gracias,,💛
more please,más por favor,,➕
help please,ayuda por favor,,🆘
open please,abre por favor,,📦
all done,terminé,,✅
eat,comer,,🍽️
drink,beber,,🥤
water,agua,el,💧
napkin,servilleta,la,🧻
spoon,cuchara,la,🥄`),
  senses: set(`see,ver,,👁️
hear,oír,,👂
smell,oler,,👃
taste,probar,,👅
touch,tocar,,✋
sweet,dulce,,🍭
sour,ácido/a,,🍋
salty,salado/a,,🧂
crunchy,crujiente,,🥨
soft,suave,,🧸
hot,caliente,,🔥
cold,frío/a,,🧊`),
  mathWords: set(`count,contar,,🧮
number,número,el,🔢
how many?,¿cuántos?,,❓
more,más,,⬆️
less,menos,,⬇️
same,lo mismo,,👯
equal,igual,,🟰
add,sumar,,➕
take away,quitar,,➖
first,primero,,🥇
next,siguiente,,➡️
last,último,,🏁`),
  packUp: set(`jacket,chaqueta,la,🧥
hat,gorro,el,🧢
gloves,guantes,los,🧤
backpack,mochila,la,🎒
folder,carpeta,la,📁
lunchbox,lonchera,la,🍱
line up,hacer fila,,🚸
bus,autobús,el,🚌
car,carro,el,🚗
home,casa,la,🏠
goodbye,adiós,,👋`)
}
