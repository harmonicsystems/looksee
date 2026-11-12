// What a shortcut saved from a settings link opens and is called (the idea
// is BackTrack's). Not pure: it edits <head>.
//
// Chrome and Android install from the manifest, which by itself would start
// every shortcut at the bare address with the device's own settings. So a
// window opened from a link gets a manifest of its own, made on the spot,
// whose start_url is that link. iOS saves the page's own address instead, but
// only when there is no manifest at all, so on iOS the manifest is removed.

const ios = 'standalone' in navigator // only iOS Safari has navigator.standalone

function meta(name) {
  let m = document.querySelector(`meta[name="${name}"]`)
  if (!m) {
    m = document.createElement('meta')
    m.name = name
    document.head.append(m)
  }
  return m
}

export function setHome(query, name) {
  document.title = name
  meta('apple-mobile-web-app-title').content = name
  const link = document.querySelector('link[rel="manifest"]')
  if (!link) return
  if (ios) return link.remove()
  const base = new URL('./', document.baseURI).href
  const start = `${base}?${query}`
  const icon = (src, sizes, extra) => ({ src: new URL(src, base).href, sizes, type: 'image/png', ...extra })
  const m = {
    name,
    short_name: name,
    id: start,
    start_url: start,
    scope: base,
    display: 'standalone',
    theme_color: '#f4efe6',
    background_color: '#f4efe6',
    icons: [icon('icon-192.png', '192x192'), icon('icon-512.png', '512x512'), icon('icon-maskable.png', '512x512', { purpose: 'maskable' })]
  }
  link.href = 'data:application/manifest+json,' + encodeURIComponent(JSON.stringify(m))
}
