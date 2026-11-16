// Things: sets of everyday pictures, in four groups (Animals, Food, Things, Places).
//
// These sets come with NO pictures. The pictures they were made for are from
// the Thiings library (thiings.co), whose terms do not allow redistribution,
// so they are not in this repo, are not on the published site, and must never
// be committed. Each device is given its own copies instead: Settings ▸ Sets ▸
// Things takes picture files from the device and keeps them in the browser
// (local.js). `npm run things` makes those files from a copy of the library,
// into public/things/, which git ignores. Without pictures these slides show
// their words alone.
//
// Each set is picked by hand: the library's own categories include things a
// classroom should not show, and its tags are machine-made. To add a thing:
// a line here (English, Spanish, article, and the library's file name when it
// is not just the English word), then `npm run things`.
//
// The Spanish follows the rest of Looksee (Latin American, as heard in US
// classrooms: carro, not coche) and has not been checked by a Spanish speaker.

const from0 = (label) => label.toLowerCase().replace(/ /g, '-')
const t = (label, es, art, from = from0(label)) => ({ label, es, art, file: from0(label), from })
// One thing per line: its word in English, in Spanish, the article and, when
// it is not just the English word, the library's file name. Kept as text
// because 223 things as lines of code cost more of the size budget.
const set = (lines) => lines.split('\n').map((line) => t(...line.split(',')))

export const THINGS = {
  animals: set(`dog,perro,el
cat,gato,el
rabbit,conejo,el
mouse,ratón,el,common-house-mouse
cow,vaca,la
pig,cerdo,el
horse,caballo,el,horse-domestic
sheep,oveja,la
goat,cabra,la
donkey,burro,el
chicken,gallina,la,domestic-chicken
duck,pato,el,mandarin-duck`),
  wild: set(`lion,león,el
tiger,tigre,el
elephant,elefante,el
giraffe,jirafa,la
monkey,mono,el
zebra,cebra,la
bear,oso,el
wolf,lobo,el
fox,zorro,el,red-fox
deer,venado,el
kangaroo,canguro,el,red-kangaroo
crocodile,cocodrilo,el
snake,serpiente,la
frog,rana,la`),
  sea: set(`fish,pez,el
shark,tiburón,el
dolphin,delfín,el
whale,ballena,la,blue-whale
octopus,pulpo,el
crab,cangrejo,el
lobster,langosta,la
starfish,estrella de mar,la
turtle,tortuga,la,green-sea-turtle
seal,foca,la
penguin,pingüino,el,emperor-penguin
shrimp,camarón,el`),
  birds: set(`bird,pájaro,el
owl,búho,el
parrot,loro,el
swan,cisne,el
goose,ganso,el
eagle,águila,el,bald-eagle
butterfly,mariposa,la
bee,abeja,la,honey-bee
ladybug,mariquita,la
ant,hormiga,la
caterpillar,oruga,la
dragonfly,libélula,la`),
  food: set(`bread,pan,el,bread-white
cheese,queso,el
egg,huevo,el
milk,leche,la
rice,arroz,el
soup,sopa,la
butter,mantequilla,la
honey,miel,la
juice,jugo,el,apple-juice
salad,ensalada,la
pancakes,panqueques,los,pancake
popcorn,palomitas,las
cake,pastel,el
ice cream,helado,el`),
  fruit: set(`apple,manzana,la
orange,naranja,la
banana,plátano,el
strawberry,fresa,la
grapes,uvas,las,grape
pear,pera,la
peach,durazno,el
lemon,limón,el
pineapple,piña,la
cherries,cerezas,las
blueberries,arándanos,los,blueberry
melon,melón,el,cantaloupe`),
  vegetables: set(`carrot,zanahoria,la
tomato,tomate,el
corn,maíz,el,corn-on-the-cob
broccoli,brócoli,el
potato,papa,la
onion,cebolla,la
cucumber,pepino,el
lettuce,lechuga,la
pumpkin,calabaza,la
eggplant,berenjena,la
pepper,chile,el,chili-pepper
mushrooms,hongos,los,wild-mushroom`),
  clothes: set(`shirt,camiseta,la,t-shirt
pants,pantalones,los,jeans
shorts,pantalones cortos,los
dress,vestido,el
sweater,suéter,el
coat,abrigo,el
raincoat,impermeable,el
scarf,bufanda,la
socks,calcetines,los
boots,botas,las,work-boots
hat,sombrero,el,straw-hat
gloves,guantes,los,gardening-gloves`),
  toys: set(`ball,pelota,la,basic-soccer-ball
balloon,globo,el
kite,cometa,la
puzzle,rompecabezas,el,jigsaw-puzzle
yo-yo,yoyo,el
top,trompo,el,spinning-top
swing,columpio,el,swing-playground
hoop,aro,el,hula-hoop
jump rope,cuerda de saltar,la
dice,dado,el
puppet,títere,el
bubbles,burbujas,las,bubble-wand`),
  home: set(`bed,cama,la
chair,silla,la
table,mesa,la
door,puerta,la
window,ventana,la
lamp,lámpara,la
spoon,cuchara,la
plate,plato,el
toothbrush,cepillo de dientes,el
soap,jabón,el
book,libro,el
teddy bear,osito de peluche,el`),
  school: set(`school,escuela,la
backpack,mochila,la
crayons,crayones,los
notebook,cuaderno,el
ruler,regla,la
desk,escritorio,el
chalk,tiza,la
paints,pinturas,las,acrylic-paint-set
computer,computadora,la,laptop
lunch box,lonchera,la
globe,globo terráqueo,el
clock,reloj,el,alarm-clock`),
  transport: set(`car,carro,el
bus,autobús,el
truck,camión,el
bicycle,bicicleta,la
motorcycle,motocicleta,la
train,tren,el
airplane,avión,el
helicopter,helicóptero,el
boat,barco,el
fire truck,camión de bomberos,el
ambulance,ambulancia,la
wheelchair,silla de ruedas,la
rocket,cohete,el`),
  outside: set(`sun,sol,el
cloud,nube,la
rainbow,arcoíris,el
storm,tormenta,la,thunder
snowflake,copo de nieve,el
moon,luna,la
star,estrella,la
tree,árbol,el
flower,flor,la,rose
leaf,hoja,la
mountain,montaña,la
river,río,el`),
  music: set(`guitar,guitarra,la
violin,violín,el
cello,violonchelo,el
drums,batería,la,drum-kit
drum,tambor,el,kettle-drum
trumpet,trompeta,la
trombone,trombón,el
saxophone,saxofón,el
flute,flauta,la
clarinet,clarinete,el
microphone,micrófono,el,karaoke-microphone
headphones,audífonos,los`),
  sports: set(`baseball,béisbol,el
bat,bate,el,baseball-bat
basketball,básquetbol,el
football,fútbol americano,el
tennis ball,pelota de tenis,la
racket,raqueta,la,tennis-racket
volleyball,voleibol,el
bowling,boliche,el
roller skate,patín,el,rollerskate
whistle,silbato,el
trophy,trofeo,el
medal,medalla,la,gold-medal`),
  tools: set(`hammer,martillo,el
saw,sierra,la,hand-saw
screwdriver,destornillador,el
wrench,llave inglesa,la
pliers,pinzas,las
ladder,escalera,la,worksite-ladder
toolbox,caja de herramientas,la
tape measure,cinta métrica,la,measuring-tape
hard hat,casco,el
bucket,cubeta,la
broom,escoba,la
flashlight,linterna,la
nail,clavo,el
watering can,regadera,la`),
  town: set(`house,casa,la
barn,granero,el
library,biblioteca,la
store,tienda,la,shop
park,parque,el
playground,patio de juegos,el
bridge,puente,el
castle,castillo,el
lighthouse,faro,el
beach,playa,la
pool,piscina,la,swimming-pool
fountain,fuente,la
city,ciudad,la
road,camino,el`),
  space: set(`Earth,Tierra,la,earth
astronaut,astronauta,el
planet,planeta,el,rings-of-saturn
comet,cometa,el
telescope,telescopio,el
satellite,satélite,el
space shuttle,transbordador,el
solar system,sistema solar,el
alien,extraterrestre,el
flying saucer,platillo volador,el`)
}

// Where the pictures live, under public/. One still AVIF each.
export const THINGS_DIR = 'things'

// Every picture these sets expect: [{ file, from, label }]. The copy script
// and the tests both read this.
export const thingFiles = () => Object.values(THINGS).flat()

// Which thing a picture file is for, by its name: "dog.avif", "Fire Truck.png"
// and the library's own "horse-domestic.png" all count. null when it is none.
const BY_NAME = new Map(thingFiles().flatMap((x) => [[x.from, x.file], [x.file, x.file]]))
export function thingName(fileName) {
  const m = /^(.+)\.(avif|webp|png|jpe?g|gif)$/i.exec(String(fileName).split(/[\\/]/).pop())
  return (m && BY_NAME.get(m[1].trim().toLowerCase().replace(/[ _]+/g, '-'))) || null
}
