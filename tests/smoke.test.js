import { describe, test, expect } from 'vitest'
import { sanitize } from '../src/sanitizer/sanitizer.js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('ClipSanitizer Smoke Tests', () => {
  // ── Sanitizer Engine ──────────────────────────────────────────────────────
  test('sanitize returns correct shape', () => {
    const result = sanitize('Hello')
    expect(result).toHaveProperty('text')
    expect(result).toHaveProperty('changes')
    expect(typeof result.text).toBe('string')
    expect(Array.isArray(result.changes)).toBe(true)
  })

  test('sanitize empty string', () => {
    const { text, changes } = sanitize('')
    expect(text).toBe('')
    expect(changes).toEqual([])
  })

  test('sanitize non-string', () => {
    const { text, changes } = sanitize(null)
    expect(text).toBe('')
    expect(changes).toEqual([])
  })

  test('output purity — all chars in allowed range', () => {
    const { text } = sanitize('\u2018Hello\u2019 world\u2026')
    expect(text).toMatch(/^[\x09\x0A\x0D\x20-\x7E]+$/)
  })

  test('clinical text sanitization', () => {
    const { text } = sanitize("O'Brien, 01\u201315\u20131985, \u00B14, 96\u00B0, 87\u00BD")
    expect(text).toMatch(/^[\x09\x0A\x0D\x20-\x7E]+$/)
    expect(text).toContain("O'Brien")
    expect(text).toContain('+/-')
    expect(text).toContain('deg')
    expect(text).toContain('1/2')
  })

  // ── IPC Contract Verification ─────────────────────────────────────────────
  test('preload exposes readClipboard and writeClipboard', () => {
    const preloadPath = join(__dirname, '../src/main/preload.js')
    const preloadContent = readFileSync(preloadPath, 'utf8')
    expect(preloadContent).toContain('contextBridge.exposeInMainWorld')
    expect(preloadContent).toContain("'electronAPI'")
    expect(preloadContent).toContain('clipboard:read')
    expect(preloadContent).toContain('clipboard:write')
  })

  test('main process registers clipboard IPC handlers', () => {
    const mainPath = join(__dirname, '../src/main/main.js')
    const mainContent = readFileSync(mainPath, 'utf8')
    expect(mainContent).toContain("ipcMain.handle('clipboard:read'")
    expect(mainContent).toContain("ipcMain.handle('clipboard:write'")
  })

  // ── Security Configuration ─────────────────────────────────────────────────
  test('main process has contextIsolation enabled', () => {
    const mainPath = join(__dirname, '../src/main/main.js')
    const mainContent = readFileSync(mainPath, 'utf8')
    expect(mainContent).toContain('contextIsolation: true')
    expect(mainContent).toContain('nodeIntegration: false')
    expect(mainContent).toContain('sandbox: true')
  })

  test('network blocker configured for air-gap', () => {
    const mainPath = join(__dirname, '../src/main/main.js')
    const mainContent = readFileSync(mainPath, 'utf8')
    expect(mainContent).toContain('webRequest.onBeforeRequest')
    expect(mainContent).toMatch(/http:\/\/\*\/\*|https:\/\/\*\/\*|ftp:\/\/\*\/\*/)
    expect(mainContent).toContain('callback({ cancel: true })')
  })

  // ── Keyboard Shortcuts ─────────────────────────────────────────────────────
  test('app.js registers keyboard event listeners', () => {
    const appPath = join(__dirname, '../src/renderer/app.js')
    const appContent = readFileSync(appPath, 'utf8')
    expect(appContent).toContain("document.addEventListener('keydown'")
    expect(appContent).toContain('ctrlKey')
    expect(appContent).toContain('shiftKey')
    expect(appContent).toContain("e.key === 'S'")
    expect(appContent).toContain("e.key === 'C'")
    expect(appContent).toContain("e.key === 'X'")
  })

  // ── Performance ────────────────────────────────────────────────────────────
  test('50k-char input processes in under 100ms', () => {
    const large = 'a'.repeat(50000) + '\u2018'
    const start = performance.now()
    const { text } = sanitize(large)
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(100)
    expect(text.length).toBeGreaterThan(50000)
  })

  // ── Fixture Test ──────────────────────────────────────────────────────────
  test('word-sample fixture sanitizes correctly', async () => {
    const { readFileSync: fsRead } = await import('fs')
    const { join: pathJoin } = await import('path')
    const { fileURLToPath: urlToPath } = await import('url')
    const testDir = dirname(urlToPath(import.meta.url))
    const wordSample = fsRead(pathJoin(testDir, 'fixtures/word-sample.txt'), 'utf8')
    const cleanExpected = fsRead(pathJoin(testDir, 'fixtures/word-sample.clean.txt'), 'utf8')
    const { text } = sanitize(wordSample)
    expect(text).toBe(cleanExpected)
  })
})
