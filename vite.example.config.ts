import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = fileURLToPath(new URL('./examples/project-hub', import.meta.url))

export default defineConfig({
  root,
  base: './',
  plugins: [react()],
  build: {
    outDir: '../../dist-example',
    emptyOutDir: true,
  },
})
