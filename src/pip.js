// The corner video. The rules: youtube-nocookie only, no controls, focus never lands in the iframe, and
// YouTube's end screen / suggestions are never shown — the video loops back
// to its start just before the end, or is torn down.
//
// There is deliberately no pause: a paused YouTube embed shows a "more
// videos" shelf. Off means destroyed.
import { loadApi } from './youtube.js'

const ENDED = 0
const PLAYING = 1

export class PipPlayer {
  constructor(host, { videoId, start = 0, muted = false, loop = true }, { onPlaying, onError, onEnd } = {}) {
    Object.assign(this, { host, videoId, start, muted, loop, onPlaying, onError, onEnd })
    this.player = null
    this.dead = false
    this._guard = () => this.reclaimFocus()
    this.open()
  }

  open() {
    this.stall = setTimeout(() => this.fail('timeout'), 20000)
    loadApi()
      .then((YT) => {
        if (this.dead) return
        const mount = document.createElement('div')
        this.host.replaceChildren(mount)
        this.player = new YT.Player(mount, {
          host: 'https://www.youtube-nocookie.com',
          videoId: this.videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            start: Math.floor(this.start),
            controls: 0,
            disablekb: 1,
            rel: 0,
            playsinline: 1,
            iv_load_policy: 3,
            fs: 0,
            autoplay: 1,
            mute: this.muted ? 1 : 0,
            origin: location.origin
          },
          events: {
            onReady: () => {
              const f = this.player?.getIframe?.()
              if (f) {
                f.tabIndex = -1
                f.setAttribute('aria-hidden', 'true')
                f.setAttribute('title', 'Corner video')
              }
              addEventListener('blur', this._guard)
              try {
                this.player.playVideo()
              } catch {}
              this.poll = setInterval(() => this.tick(), 250)
            },
            onError: () => this.fail('unavailable'),
            onStateChange: (e) => {
              if (e.data === PLAYING) {
                clearTimeout(this.stall)
                this.onPlaying?.()
              }
              if (e.data === ENDED) this.restart()
            }
          }
        })
      })
      .catch(() => this.fail('blocked'))
  }

  tick() {
    this.reclaimFocus()
    const t = this.player?.getCurrentTime?.()
    const d = this.player?.getDuration?.()
    if (typeof t === 'number' && d > 2 && t >= d - 0.6) this.restart()
  }

  restart() {
    if (this.dead) return
    if (!this.loop) {
      this.destroy()
      return this.onEnd?.()
    }
    try {
      this.player.seekTo(this.start, true)
      this.player.playVideo()
    } catch {}
  }

  setMuted(m) {
    this.muted = m
    try {
      m ? this.player?.mute() : this.player?.unMute()
    } catch {}
  }

  reclaimFocus() {
    const a = document.activeElement
    if (a && a.tagName === 'IFRAME') {
      setTimeout(() => {
        a.blur()
        document.getElementById('focus-home')?.focus({ preventScroll: true })
      }, 0)
    }
  }

  fail(why) {
    if (this.dead) return
    this.destroy()
    this.onError?.(why)
  }

  destroy() {
    this.dead = true
    clearInterval(this.poll)
    clearTimeout(this.stall)
    removeEventListener('blur', this._guard)
    try {
      this.player?.destroy?.()
    } catch {}
    this.player = null
    this.host?.replaceChildren()
  }
}
