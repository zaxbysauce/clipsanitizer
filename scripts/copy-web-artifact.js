import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const src = join(root, 'dist-web', 'index.web.html')
const destDir = join(root, 'dist')
const dest = join(destDir, 'ClipSanitizer-web.html')

if (!existsSync(src)) {
  console.error('[build:web] ERROR: dist-web/index.html not found. Run vite build --config vite.config.web.js first.')
  process.exit(1)
}

if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true })
copyFileSync(src, dest)
console.log('[build:web] ClipSanitizer-web.html written to dist/')
