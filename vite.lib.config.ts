import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const entry = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-lib',
    emptyOutDir: true,
    lib: {
      entry: {
        index: entry('./src/index.ts'),
        controls: entry('./src/entrypoints/controls.ts'),
        commands: entry('./src/entrypoints/commands.ts'),
        navigation: entry('./src/entrypoints/navigation.ts'),
        collections: entry('./src/entrypoints/collections.ts'),
        overlays: entry('./src/entrypoints/overlays.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
      cssFileName: 'styles',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
})
