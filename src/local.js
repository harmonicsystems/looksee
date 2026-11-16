// Pictures a device keeps for itself. The Things sets (things.js) come with
// no pictures: whoever has pictures for them adds the files on the device,
// and they are kept in the browser's own storage, under this site. They are
// read straight from the device's files and are never uploaded anywhere, so
// nothing leaves the device. Not pure: Cache Storage and object URLs.

import { thingName } from './things.js'

const CACHE = 'looksee-things'
const keyOf = (name) => `${location.origin}/local-things/${name}`
const TYPES = { avif: 'image/avif', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif' }

// Whether this browser can keep pictures (it needs a secure address).
export const canKeep = () => typeof caches !== 'undefined'

let urls = {}

// { dog: 'blob:…', … }: an address for every picture kept on this device.
export async function localPictures() {
  if (!canKeep()) return {}
  const cache = await caches.open(CACHE)
  const out = {}
  for (const req of await cache.keys()) {
    const res = await cache.match(req)
    if (res) out[req.url.split('/').pop()] = URL.createObjectURL(await res.blob())
  }
  for (const u of Object.values(urls)) URL.revokeObjectURL(u)
  return (urls = out)
}

// Keeps the files whose names are a thing's ("dog.avif", "Fire Truck.png").
// → { added, unknown: [file names that match nothing] }
export async function addPictures(files) {
  const cache = await caches.open(CACHE)
  let added = 0
  const unknown = []
  for (const f of files) {
    const name = thingName(f.name)
    if (!name) {
      unknown.push(f.name)
      continue
    }
    const type = f.type || TYPES[f.name.split('.').pop().toLowerCase()]
    await cache.put(keyOf(name), new Response(f, { headers: { 'content-type': type } }))
    added++
  }
  // Ask the browser not to clear them when it is short of room.
  navigator.storage?.persist?.().catch(() => {})
  return { added, unknown }
}

export async function removePictures() {
  if (canKeep()) await caches.delete(CACHE)
}
