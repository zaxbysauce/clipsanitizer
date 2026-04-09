import path from 'path'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default {
  root: 'src/renderer',
  build: {
    outDir: '../../dist-web',
    emptyOutDir: true,
    target: 'es2020',
    rollupOptions: {
      input: path.join(__dirname, 'src/renderer/index.web.html')
    }
  },
  plugins: [viteSingleFile({ removeViteModuleLoader: true })],
  base: undefined
}
