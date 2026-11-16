// Things: sets of everyday pictures, in three groups (Animals, Food, Things).
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

const t = (label, es, art, from = label.replace(/ /g, '-')) => ({ label, es, art, file: label.replace(/ /g, '-'), from })

export const THINGS = {
  animals: [
    t('dog', 'perro', 'el'),
    t('cat', 'gato', 'el'),
    t('rabbit', 'conejo', 'el'),
    t('mouse', 'ratón', 'el', 'common-house-mouse'),
    t('cow', 'vaca', 'la'),
    t('pig', 'cerdo', 'el'),
    t('horse', 'caballo', 'el', 'horse-domestic'),
    t('sheep', 'oveja', 'la'),
    t('goat', 'cabra', 'la'),
    t('donkey', 'burro', 'el'),
    t('chicken', 'gallina', 'la', 'domestic-chicken'),
    t('duck', 'pato', 'el', 'mandarin-duck')
  ],
  wild: [
    t('lion', 'león', 'el'),
    t('tiger', 'tigre', 'el'),
    t('elephant', 'elefante', 'el'),
    t('giraffe', 'jirafa', 'la'),
    t('monkey', 'mono', 'el'),
    t('zebra', 'cebra', 'la'),
    t('bear', 'oso', 'el'),
    t('wolf', 'lobo', 'el'),
    t('fox', 'zorro', 'el', 'red-fox'),
    t('deer', 'venado', 'el'),
    t('kangaroo', 'canguro', 'el', 'red-kangaroo'),
    t('crocodile', 'cocodrilo', 'el'),
    t('snake', 'serpiente', 'la'),
    t('frog', 'rana', 'la')
  ],
  sea: [
    t('fish', 'pez', 'el'),
    t('shark', 'tiburón', 'el'),
    t('dolphin', 'delfín', 'el'),
    t('whale', 'ballena', 'la', 'blue-whale'),
    t('octopus', 'pulpo', 'el'),
    t('crab', 'cangrejo', 'el'),
    t('lobster', 'langosta', 'la'),
    t('starfish', 'estrella de mar', 'la'),
    t('turtle', 'tortuga', 'la', 'green-sea-turtle'),
    t('seal', 'foca', 'la'),
    t('penguin', 'pingüino', 'el', 'emperor-penguin'),
    t('shrimp', 'camarón', 'el')
  ],
  birds: [
    t('bird', 'pájaro', 'el'),
    t('owl', 'búho', 'el'),
    t('parrot', 'loro', 'el'),
    t('swan', 'cisne', 'el'),
    t('goose', 'ganso', 'el'),
    t('eagle', 'águila', 'el', 'bald-eagle'),
    t('butterfly', 'mariposa', 'la'),
    t('bee', 'abeja', 'la', 'honey-bee'),
    t('ladybug', 'mariquita', 'la'),
    t('ant', 'hormiga', 'la'),
    t('caterpillar', 'oruga', 'la'),
    t('dragonfly', 'libélula', 'la')
  ],
  food: [
    t('bread', 'pan', 'el', 'bread-white'),
    t('cheese', 'queso', 'el'),
    t('egg', 'huevo', 'el'),
    t('milk', 'leche', 'la'),
    t('rice', 'arroz', 'el'),
    t('soup', 'sopa', 'la'),
    t('butter', 'mantequilla', 'la'),
    t('honey', 'miel', 'la'),
    t('juice', 'jugo', 'el', 'apple-juice'),
    t('salad', 'ensalada', 'la'),
    t('pancakes', 'panqueques', 'los', 'pancake'),
    t('popcorn', 'palomitas', 'las'),
    t('cake', 'pastel', 'el'),
    t('ice cream', 'helado', 'el')
  ],
  fruit: [
    t('apple', 'manzana', 'la'),
    t('orange', 'naranja', 'la'),
    t('banana', 'plátano', 'el'),
    t('strawberry', 'fresa', 'la'),
    t('grapes', 'uvas', 'las', 'grape'),
    t('pear', 'pera', 'la'),
    t('peach', 'durazno', 'el'),
    t('lemon', 'limón', 'el'),
    t('pineapple', 'piña', 'la'),
    t('cherries', 'cerezas', 'las'),
    t('blueberries', 'arándanos', 'los', 'blueberry'),
    t('melon', 'melón', 'el', 'cantaloupe')
  ],
  vegetables: [
    t('carrot', 'zanahoria', 'la'),
    t('tomato', 'tomate', 'el'),
    t('corn', 'maíz', 'el', 'corn-on-the-cob'),
    t('broccoli', 'brócoli', 'el'),
    t('potato', 'papa', 'la'),
    t('onion', 'cebolla', 'la'),
    t('cucumber', 'pepino', 'el'),
    t('lettuce', 'lechuga', 'la'),
    t('pumpkin', 'calabaza', 'la'),
    t('eggplant', 'berenjena', 'la'),
    t('pepper', 'chile', 'el', 'chili-pepper'),
    t('mushrooms', 'hongos', 'los', 'wild-mushroom')
  ],
  clothes: [
    t('shirt', 'camiseta', 'la', 't-shirt'),
    t('pants', 'pantalones', 'los', 'jeans'),
    t('shorts', 'pantalones cortos', 'los'),
    t('dress', 'vestido', 'el'),
    t('sweater', 'suéter', 'el'),
    t('coat', 'abrigo', 'el'),
    t('raincoat', 'impermeable', 'el'),
    t('scarf', 'bufanda', 'la'),
    t('socks', 'calcetines', 'los'),
    t('boots', 'botas', 'las', 'work-boots'),
    t('hat', 'sombrero', 'el', 'straw-hat'),
    t('gloves', 'guantes', 'los', 'gardening-gloves')
  ],
  toys: [
    t('ball', 'pelota', 'la', 'basic-soccer-ball'),
    t('balloon', 'globo', 'el'),
    t('kite', 'cometa', 'la'),
    t('puzzle', 'rompecabezas', 'el', 'jigsaw-puzzle'),
    t('yo-yo', 'yoyo', 'el'),
    t('top', 'trompo', 'el', 'spinning-top'),
    t('swing', 'columpio', 'el', 'swing-playground'),
    t('hoop', 'aro', 'el', 'hula-hoop'),
    t('jump rope', 'cuerda de saltar', 'la'),
    t('dice', 'dado', 'el'),
    t('puppet', 'títere', 'el'),
    t('bubbles', 'burbujas', 'las', 'bubble-wand')
  ],
  home: [
    t('bed', 'cama', 'la'),
    t('chair', 'silla', 'la'),
    t('table', 'mesa', 'la'),
    t('door', 'puerta', 'la'),
    t('window', 'ventana', 'la'),
    t('lamp', 'lámpara', 'la'),
    t('spoon', 'cuchara', 'la'),
    t('plate', 'plato', 'el'),
    t('toothbrush', 'cepillo de dientes', 'el'),
    t('soap', 'jabón', 'el'),
    t('book', 'libro', 'el'),
    t('teddy bear', 'osito de peluche', 'el')
  ],
  school: [
    t('school', 'escuela', 'la'),
    t('backpack', 'mochila', 'la'),
    t('crayons', 'crayones', 'los'),
    t('notebook', 'cuaderno', 'el'),
    t('ruler', 'regla', 'la'),
    t('desk', 'escritorio', 'el'),
    t('chalk', 'tiza', 'la'),
    t('paints', 'pinturas', 'las', 'acrylic-paint-set'),
    t('computer', 'computadora', 'la', 'laptop'),
    t('lunch box', 'lonchera', 'la'),
    t('globe', 'globo terráqueo', 'el'),
    t('clock', 'reloj', 'el', 'alarm-clock')
  ],
  transport: [
    t('car', 'carro', 'el'),
    t('bus', 'autobús', 'el'),
    t('truck', 'camión', 'el'),
    t('bicycle', 'bicicleta', 'la'),
    t('motorcycle', 'motocicleta', 'la'),
    t('train', 'tren', 'el'),
    t('airplane', 'avión', 'el'),
    t('helicopter', 'helicóptero', 'el'),
    t('boat', 'barco', 'el'),
    t('fire truck', 'camión de bomberos', 'el'),
    t('ambulance', 'ambulancia', 'la'),
    t('wheelchair', 'silla de ruedas', 'la'),
    t('rocket', 'cohete', 'el')
  ],
  outside: [
    t('sun', 'sol', 'el'),
    t('cloud', 'nube', 'la'),
    t('rainbow', 'arcoíris', 'el'),
    t('storm', 'tormenta', 'la', 'thunder'),
    t('snowflake', 'copo de nieve', 'el'),
    t('moon', 'luna', 'la'),
    t('star', 'estrella', 'la'),
    t('tree', 'árbol', 'el'),
    t('flower', 'flor', 'la', 'rose'),
    t('leaf', 'hoja', 'la'),
    t('mountain', 'montaña', 'la'),
    t('river', 'río', 'el')
  ]
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
