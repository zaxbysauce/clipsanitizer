// tests/web-smoke.test.js
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Mocks must be at top level BEFORE any module that uses them ──────────────
vi.mock('mammoth', () => ({
  default: { extractRawText: vi.fn() },
}))

// ── Persistent DOM stubs — same object refs across all buildDOM() calls ──────
const makeEl = (value = '') => ({
  value,
  textContent: '',
  hidden: false,
  disabled: false,
  classList: {
    add: vi.fn(), remove: vi.fn(), toggle: vi.fn(),
  },
  addEventListener: vi.fn(),
  focus: vi.fn(),
})

// Singleton element objects — created ONCE
const _inputEl       = makeEl('')
const _outputEl      = makeEl('')
const _btnSanitize   = makeEl()
const _btnCopyOutput = makeEl()
const _btnClear      = makeEl()
const _btnPaste      = makeEl()
const _inputCount    = makeEl('0 chars')
const _outputCount   = makeEl('0 chars')
const _statusChanges = makeEl()
const _toastEl       = makeEl()
const _toastMsg      = makeEl()
const _intakeZone    = makeEl()
const _dropOverlay   = makeEl()
const _fileInput      = makeEl()

// Singleton clipboard mock — same object reference across all tests
const _clipboard = {
  writeText: vi.fn(),
  readText:  vi.fn(),
}

function buildDOM() {
  const registry = {
    'textarea-input':      _inputEl,
    'textarea-output':     _outputEl,
    'btn-sanitize':        _btnSanitize,
    'btn-copy-output':    _btnCopyOutput,
    'btn-clear':           _btnClear,
    'btn-paste-clipboard': _btnPaste,
    'input-char-count':    _inputCount,
    'output-char-count':  _outputCount,
    'status-changes':      _statusChanges,
    'toast':               _toastEl,
    'toast-message':       _toastMsg,
    'intake-zone':         _intakeZone,
    'drop-overlay':        _dropOverlay,
    'file-input':          _fileInput,
  }
  vi.stubGlobal('document', {
    getElementById: vi.fn(id => registry[id] ?? null),
    addEventListener: vi.fn(),
  })
  vi.stubGlobal('navigator', { clipboard: _clipboard })
}

// Build DOM + import app.web.js ONCE at module load time
buildDOM()
const appModule = await import('../src/renderer/app.web.js')

beforeEach(() => {
  // Re-stub globals before each test (clears spy history on same object refs)
  buildDOM()
  vi.clearAllMocks()
  // Reset element values
  _inputEl.value = ''
  _outputEl.value = ''
  _btnCopyOutput.disabled = false
  _toastEl.hidden = false
  _toastMsg.textContent = ''
  // Reset spy implementations on the SAME clipboard object
  _clipboard.writeText = vi.fn()
  _clipboard.readText  = vi.fn()
  // Reset classList mock implementations
  _btnCopyOutput.classList.add.mockClear()
  _btnCopyOutput.classList.remove.mockClear()
})

afterEach(() => {
  vi.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Zero electronAPI references in app.web.js
// ─────────────────────────────────────────────────────────────────────────────
describe('Static code analysis — no Electron API', () => {

  test('app.web.js contains ZERO occurrences of "electronAPI"', () => {
    const filePath = path.join(__dirname, '..', 'src', 'renderer', 'app.web.js')
    const content = fs.readFileSync(filePath, 'utf8')
    expect(content.split('electronAPI').length - 1).toBe(0)
  })

  test('app.web.js contains ZERO occurrences of "ipcRenderer"', () => {
    const filePath = path.join(__dirname, '..', 'src', 'renderer', 'app.web.js')
    const content = fs.readFileSync(filePath, 'utf8')
    expect(content.split('ipcRenderer').length - 1).toBe(0)
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: copyOutput uses navigator.clipboard.writeText
// ─────────────────────────────────────────────────────────────────────────────
describe('copyOutput()', () => {

  test('calls navigator.clipboard.writeText with outputEl.value', async () => {
    _outputEl.value = 'sanitized text here'
    await appModule.copyOutput()
    expect(_clipboard.writeText).toHaveBeenCalledOnce()
    expect(_clipboard.writeText).toHaveBeenCalledWith('sanitized text here')
  })

  test('does NOT call writeText when outputEl.value is empty', async () => {
    _outputEl.value = ''
    await appModule.copyOutput()
    expect(_clipboard.writeText).not.toHaveBeenCalled()
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4 & 5: pasteFromClipboard
// ─────────────────────────────────────────────────────────────────────────────
describe('pasteFromClipboard()', () => {

  test('reads clipboard and sets inputEl.value to pasted text', async () => {
    _clipboard.readText = vi.fn().mockResolvedValue('pasted text')
    await appModule.pasteFromClipboard()
    expect(_clipboard.readText).toHaveBeenCalledOnce()
    expect(_inputEl.value).toBe('pasted text')
  })

  test('shows toast when clipboard is empty', async () => {
    _clipboard.readText = vi.fn().mockResolvedValue('')
    await appModule.pasteFromClipboard()
    expect(_toastMsg.textContent).toBe('Clipboard is empty.')
  })

  test('shows permission denied toast on NotAllowedError', async () => {
    const err = Object.assign(new Error('denied'), { name: 'NotAllowedError' })
    _clipboard.readText = vi.fn().mockRejectedValue(err)
    await appModule.pasteFromClipboard()
    expect(_toastMsg.textContent).toContain('permission denied')
  })

  test('shows generic error toast on other errors', async () => {
    const err = new Error('generic error')
    _clipboard.readText = vi.fn().mockRejectedValue(err)
    await appModule.pasteFromClipboard()
    expect(_toastMsg.textContent).toBe('Could not read clipboard.')
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: loadDocxFile works without electronAPI
// ─────────────────────────────────────────────────────────────────────────────
describe('loadDocxFile()', () => {

  test('reads a File object via mammoth and sets inputEl.value', async () => {
    const mammoth = await import('mammoth')
    mammoth.default.extractRawText = vi.fn().mockResolvedValue({ value: 'browser doc text' })

    const mockFile = {
      name: 'report.docx',
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    }

    await appModule.loadDocxFile(mockFile)

    expect(mammoth.default.extractRawText).toHaveBeenCalledOnce()
    expect(_inputEl.value).toBe('browser doc text')
  })

  test('shows error toast when mammoth throws', async () => {
    const mammoth = await import('mammoth')
    mammoth.default.extractRawText = vi.fn().mockRejectedValue(new Error('bad file'))

    const mockFile = {
      name: 'bad.docx',
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    }

    await appModule.loadDocxFile(mockFile)

    expect(_toastMsg.textContent).toBe('Could not read .docx file.')
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7: Sanitizer pipeline e2e
// ─────────────────────────────────────────────────────────────────────────────
describe('Sanitizer pipeline end-to-end', () => {

  test('sanitize converts curly double quotes to straight quotes', async () => {
    const { sanitize } = await import('../src/sanitizer/sanitizer.js')
    const result = sanitize('\u201CHello\u201D')
    expect(result.text).toBe('"Hello"')
  })

  test('sanitize returns { text, changes, warnings } shape', async () => {
    const { sanitize } = await import('../src/sanitizer/sanitizer.js')
    const result = sanitize('Hello world')
    expect(typeof result.text).toBe('string')
    expect(Array.isArray(result.changes)).toBe(true)
    expect(Array.isArray(result.warnings)).toBe(true)
  })

  test('sanitize handles non-ASCII Latin characters', async () => {
    const { sanitize } = await import('../src/sanitizer/sanitizer.js')
    // ø → o
    const result = sanitize('\u00F8')
    expect(result.text).toBe('o')
  })

  test('sanitize handles NBSP → regular space', async () => {
    const { sanitize } = await import('../src/sanitizer/sanitizer.js')
    const result = sanitize('hello\u00A0world')
    expect(result.text).toBe('hello world')
  })

  test('sanitize removes C0 control characters but preserves \\t \\n \\r', async () => {
    const { sanitize } = await import('../src/sanitizer/sanitizer.js')
    // Step 5 normalizes \r → \n, so \r becomes \n
    const result = sanitize('hello\x00world\t\n\r')
    expect(result.text).toBe('helloworld\t\n\n')
  })

  test('sanitize normalizes CRLF and lone CR to LF', async () => {
    const { sanitize } = await import('../src/sanitizer/sanitizer.js')
    const result = sanitize('line1\r\nline2\rline3')
    expect(result.text).toBe('line1\nline2\nline3')
  })

  test('sanitize returns empty for empty string input', async () => {
    const { sanitize } = await import('../src/sanitizer/sanitizer.js')
    const result = sanitize('')
    expect(result.text).toBe('')
    expect(result.changes).toEqual([])
  })

})
