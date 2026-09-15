import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = fileURLToPath(new URL('./examples/project-hub', import.meta.url))
const publicEntry = fileURLToPath(new URL('./src/index.ts', import.meta.url))

export default defineConfig({
  root,
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      'uwp-react-lab': publicEntry,
    },
  },
  build: {
    outDir: '../../dist-example',
    emptyOutDir: true,
  },
})
