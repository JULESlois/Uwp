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
      { find: 'uwp-react-lab/controls', replacement: entry('./src/entrypoints/controls.ts') },
      { find: 'uwp-react-lab/commands', replacement: entry('./src/entrypoints/commands.ts') },
      { find: 'uwp-react-lab/navigation', replacement: entry('./src/entrypoints/navigation.ts') },
      { find: 'uwp-react-lab/collections', replacement: entry('./src/entrypoints/collections.ts') },
      { find: 'uwp-react-lab/overlays', replacement: entry('./src/entrypoints/overlays.ts') },
      { find: 'uwp-react-lab', replacement: entry('./src/index.ts') },
    ],
  },
  build: {
    outDir: '../../dist-example',
    emptyOutDir: true,
  },
})
