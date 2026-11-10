import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

// Where the site is served from: '/' on its own domain, '/looksee/' on
// harmonicsystems.github.io. The deploy workflow passes whichever GitHub Pages
// is using, so the same code works at both. Nothing in src/ may assume '/':
// pictures are requested relative to the page, and Vite rewrites the absolute
// paths in index.html and CSS.
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [
    svelte(),
    VitePWA({
      // 'prompt': a new version is offered in Settings, never reloaded mid-play.
      registerType: 'prompt',
      manifest: {
        name: 'Looksee',
        short_name: 'Looksee',
        description:
          'A calm screen that plays first concepts one at a time, with a bar for the school day. Nothing is collected.',
        display: 'standalone',
        theme_color: '#f4efe6',
        background_color: '#f4efe6',
        // No start_url or scope: they default to `base`. Icon paths are
        // relative to the manifest, which sits at `base`.
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        // The app shell, the fonts, the feelings pictures and the credits.
        // YouTube is never cached or intercepted.
        globPatterns: ['**/*.{js,css,html,svg,png,ttf,webmanifest,avif,txt}'],
        // The gesture and body pictures (192 files, 4.5 MB) are loaded when
        // shown, not precached. Each entry here also costs bytes of service
        // worker, which counts toward the JS budget.
        globIgnores: ['**/node_modules/**/*', 'sw.js', 'workbox-*.js', 'people/**']
      }
    })
  ],
  build: { target: 'es2020', sourcemap: false }
})
