// Things: sets of everyday pictures (animals, food, transportation, home).
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
    t('cow', 'vaca', 'la'),
    t('pig', 'cerdo', 'el'),
    t('horse', 'caballo', 'el', 'horse-domestic'),
    t('sheep', 'oveja', 'la'),
    t('chicken', 'gallina', 'la', 'domestic-chicken'),
    t('frog', 'rana', 'la'),
    t('elephant', 'elefante', 'el'),
    t('giraffe', 'jirafa', 'la'),
    t('monkey', 'mono', 'el')
  ],
  food: [
    t('apple', 'manzana', 'la'),
    t('orange', 'naranja', 'la'),
    t('strawberry', 'fresa', 'la'),
    t('carrot', 'zanahoria', 'la'),
    t('tomato', 'tomate', 'el'),
    t('corn', 'maíz', 'el', 'corn-on-the-cob'),
    t('bread', 'pan', 'el', 'bread-white'),
    t('cheese', 'queso', 'el'),
    t('egg', 'huevo', 'el'),
    t('milk', 'leche', 'la'),
    t('rice', 'arroz', 'el'),
    t('soup', 'sopa', 'la')
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
    t('wheelchair', 'silla de ruedas', 'la')
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
