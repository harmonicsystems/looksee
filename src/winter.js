// Winter: two sets of pictures drawn for Looksee, Winter days and Winter clothes.
//
// Unlike the Things sets, these pictures are our own: they were made in David's
// picture library (~/Code/picture-library, private) with Codex image generation,
// from written descriptions in the library's house style, and no photo was used.
// So they are in this repo, on the site and in the offline store, and every
// device has them. `npm run winter` (scripts/winter.mjs) copies them out of the
// library into public/winter/ as 512 px AVIFs; then commit them.
//
// Nothing tied to one holiday or faith (David, 2026-11-20): no star on the
// tree, no ornaments, gifts, stockings, candles or Santa. The pine tree has
// plain lights, a winter sight in the northeast.
//
// One picture per line: its word in English, in Spanish, the article and, when
// it is not winter/<the English word>, the library's own name for it. A word
// that is the same in both languages is left out. The Spanish follows the rest
// of Looksee (Latin American, as heard in US classrooms: cobija, gorro) and
// has not been checked by a Spanish speaker.

const name = (label) => label.toLowerCase().replace(/ /g, '-')
const w = (label, es, art, from = 'winter/' + name(label)) => ({ label, es, art, file: name(label), from })
const set = (lines) => lines.split('\n').map((line) => w(...line.split(',')))

export const WINTER = {
  winter: set(`snowman,muñeco de nieve,el
snowballs,bolas de nieve,las
sled,trineo,el
skis,esquís,los
snow shovel,pala de nieve,la
snowplow,quitanieves,el
icicles,carámbanos,los
frozen pond,estanque congelado,el
tree,árbol,el,winter/snowy-tree
pine tree,pino,el,winter/pine-tree-lights
fireplace,chimenea,la
firewood,leña,la
blanket,cobija,la
hot cocoa,chocolate caliente,el
polar bear,oso polar,el
owl,búho,el,winter/snowy-owl
chickadee,carbonero,el
bird feeder,comedero de pájaros,el`),
  winterClothes: set(`coat,abrigo,el,clothes/coat
hat,gorro,el,clothes/winter-hat
scarf,bufanda,la,clothes/scarf
mittens,mitones,los,clothes/mittens
gloves,guantes,los,clothes/gloves
boots,botas,las,clothes/snow-boots
snow pants,pantalones de nieve,los
snowsuit,traje de nieve,el
earmuffs,orejeras,las
sweater,suéter,el,clothes/sweater
socks,calcetines,los,winter/wool-socks
vest,chaleco,el,winter/puffy-vest`)
}

// Where the pictures live, under public/. One still AVIF each.
export const WINTER_DIR = 'winter'

// Every picture these sets show: [{ file, from, label }].
export const winterFiles = () => Object.values(WINTER).flat()
