import { defineConfig } from 'vite'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import electron from 'vite-plugin-electron'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  root: 'src/renderer',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  plugins: [
    electron([
      {
        entry: join(__dirname, 'src/main/main.js'),
        vite: {
          build: {
            outDir: join(__dirname, 'dist/main'),
            rollupOptions: { external: ['electron'] }
          }
        }
      },
      {
        entry: join(__dirname, 'src/main/preload.js'),
        vite: {
          build: { outDir: join(__dirname, 'dist/main') }
        }
      }
    ])
  ]
})
