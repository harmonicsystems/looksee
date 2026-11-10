// Reading a YouTube link: which video, and where it asks to start.

// Accepts watch, youtu.be, shorts, embed and live links, or a bare 11-char id.
export function videoId(url) {
  const s = String(url ?? '').trim()
  if (!s) return ''
  if (/^[\w-]{11}$/.test(s)) return s
  let u
  try {
    u = new URL(s.includes('://') ? s : 'https://' + s)
  } catch {
    return ''
  }
  const host = u.hostname.replace(/^www\.|^m\./, '')
  if (host === 'youtu.be') {
    const id = u.pathname.slice(1).split('/')[0]
    return /^[\w-]{11}$/.test(id) ? id : ''
  }
  if (!/(^|\.)youtube(-nocookie)?\.com$/.test(host)) return ''
  const v = u.searchParams.get('v')
  if (v && /^[\w-]{11}$/.test(v)) return v
  const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/)
  return m ? m[1] : ''
}

// "1:23", "83", "1m23s" → seconds. Blank or junk → null.
export function toSeconds(v) {
  const s = String(v ?? '').trim()
  if (!s) return null
  if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s)
  const colon = s.match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2}(?:\.\d+)?)$/)
  if (colon) return (+(colon[1] || 0)) * 3600 + +colon[2] * 60 + parseFloat(colon[3])
  const hms = s.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i)
  if (hms && (hms[1] || hms[2] || hms[3])) return (+(hms[1] || 0)) * 3600 + (+(hms[2] || 0)) * 60 + +(hms[3] || 0)
  return null
}

// Where a link asks to start (its ?t= or ?start=), in seconds. None → 0.
export function startSeconds(url) {
  const s = String(url ?? '').trim()
  try {
    const u = new URL(s.includes('://') ? s : 'https://' + s)
    return toSeconds(u.searchParams.get('t') || u.searchParams.get('start')) ?? 0
  } catch {
    return 0
  }
}
