import { defineConfig } from 'vitest/config'

// Tests cover the pure modules (concepts, settings, day, link) in plain node.
export default defineConfig({ test: { environment: 'node' } })
