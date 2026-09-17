import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = fileURLToPath(new URL('./examples/project-hub', import.meta.url))
const entry = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  root,
  base: './',
  plugins: [react()],
  resolve: {
    alias: [
      { find: 'uwp_components/controls', replacement: entry('./src/entrypoints/controls.ts') },
      { find: 'uwp_components/commands', replacement: entry('./src/entrypoints/commands.ts') },
      { find: 'uwp_components/navigation', replacement: entry('./src/entrypoints/navigation.ts') },
      { find: 'uwp_components/collections', replacement: entry('./src/entrypoints/collections.ts') },
      { find: 'uwp_components/overlays', replacement: entry('./src/entrypoints/overlays.ts') },
      { find: 'uwp_components', replacement: entry('./src/index.ts') },
    ],
  },
  build: {
    outDir: '../../dist-example',
    emptyOutDir: true,
  },
})
