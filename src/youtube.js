// Loads YouTube's IFrame Player API, once, the first time a video is started.
// This script (from youtube.com) and the player it builds (from
// youtube-nocookie.com, see pip.js) are the only network traffic Looksee
// makes besides its own files.

const API_URL = 'https://www.youtube.com/iframe_api'
let apiPromise = null

export function loadApi(timeoutMs = 10000) {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise
  apiPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs)
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timer)
      if (typeof prev === 'function') prev()
      resolve(window.YT)
    }
    const s = document.createElement('script')
    s.src = API_URL
    s.async = true
    s.onerror = () => {
      clearTimeout(timer)
      s.remove()
      reject(new Error('blocked'))
    }
    document.head.appendChild(s)
  })
  // A failed load can be tried again next time.
  apiPromise.catch(() => {
    apiPromise = null
  })
  return apiPromise
}
