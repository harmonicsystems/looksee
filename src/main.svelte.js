import { mount } from 'svelte'
import App from './App.svelte'
import './styles.css'
import { registerSW } from 'virtual:pwa-register'

// The service worker keeps Looksee working offline. 'prompt': a new version
// is offered in Settings, never reloaded mid-play.
const props = $state({ update: null })
const updateSW = registerSW({
  onNeedRefresh() {
    props.update = { reload: () => updateSW(true) }
  }
})

mount(App, { target: document.getElementById('app'), props })
