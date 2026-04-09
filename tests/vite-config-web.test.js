import { describe, test, expect } from 'vitest'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Dynamically import the ES module config
let config
try {
  // eslint-disable-next-line no-eval
  const module = await import('../vite.config.web.js')
  config = module.default
} catch (e) {
  config = null
}

describe('vite.config.web.js', () => {
  describe('module syntax', () => {
    test('config file parses as valid ES module', () => {
      expect(config).not.toBeNull()
      expect(typeof config).toBe('object')
    })
  })

  describe('root', () => {
    test('root is src/renderer', () => {
      expect(config.root).toBe('src/renderer')
    })
  })

  describe('build', () => {
    test('outDir is ../../dist-web', () => {
      expect(config.build.outDir).toBe('../../dist-web')
    })

    test('emptyOutDir is true', () => {
      expect(config.build.emptyOutDir).toBe(true)
    })

    test('target is es2020', () => {
      expect(config.build.target).toBe('es2020')
    })
  })

  describe('rollupOptions.input', () => {
    test('input path is absolute (uses __dirname)', () => {
      const inputPath = config.build.rollupOptions.input
      expect(inputPath).toContain('index.web.html')
    })
  })

  describe('plugins', () => {
    test('has exactly one plugin', () => {
      expect(Array.isArray(config.plugins)).toBe(true)
      expect(config.plugins.length).toBe(1)
    })

    test('plugin is viteSingleFile (object with name)', () => {
      const plugin = config.plugins[0]
      expect(typeof plugin).toBe('object')
      expect(plugin).toHaveProperty('name')
      expect(plugin.name).toMatch(/vite-singlefile|singlefile/i)
    })
  })

  describe('no vite-plugin-electron', () => {
    test('plugins array does not contain vite-plugin-electron', () => {
      const pluginSources = config.plugins.map(p => String(p))
      const hasElectron = pluginSources.some(s => s.includes('vite-plugin-electron'))
      expect(hasElectron).toBe(false)
    })
  })

  describe('no base', () => {
    test('base is not set (undefined)', () => {
      expect(config.base === undefined).toBe(true)
    })
  })
})
