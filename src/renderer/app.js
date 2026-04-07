// src/renderer/app.js
import { sanitize } from '../sanitizer/sanitizer.js'

// ── Element references ───────────────────────────────────────────────────────
const inputEl        = document.getElementById('textarea-input')
const outputEl       = document.getElementById('textarea-output')
const btnSanitize    = document.getElementById('btn-sanitize')
const btnCopyOutput  = document.getElementById('btn-copy-output')
const btnClear       = document.getElementById('btn-clear')
const btnPaste       = document.getElementById('btn-paste-clipboard')
const inputCount     = document.getElementById('input-char-count')
const outputCount    = document.getElementById('output-char-count')
const statusChanges  = document.getElementById('status-changes')
const toastEl        = document.getElementById('toast')
const toastMsg       = document.getElementById('toast-message')

// ── State ────────────────────────────────────────────────────────────────────
let toastTimer = null
let copyResetTimer = null

// ── Character counter ────────────────────────────────────────────────────────
function updateCharCount(el, counterEl) {
  const n = el.value.length
  counterEl.textContent = n.toLocaleString() + ' char' + (n === 1 ? '' : 's')
}

inputEl.addEventListener('input', () => updateCharCount(inputEl, inputCount))

// ── Sanitize ─────────────────────────────────────────────────────────────────
function runSanitize() {
  const raw = inputEl.value
  if (!raw.trim()) {
    showToast('Paste some text first.')
    return
  }

  const { text, changes } = sanitize(raw)

  outputEl.value = text
  updateCharCount(outputEl, outputCount)

  btnCopyOutput.disabled = false

  if (changes.length === 0) {
    setStatus('No changes needed — text is already clean.', 'no-changes')
  } else {
    const summary = changes
      .map(c => `${c.count.toLocaleString()} ${c.label}`)
      .join(' · ')
    setStatus(summary, 'has-changes')
  }
}

btnSanitize.addEventListener('click', runSanitize)

// ── Copy output to clipboard ─────────────────────────────────────────────────
async function copyOutput() {
  const text = outputEl.value
  if (!text) return

  try {
    await window.electronAPI.writeClipboard(text)
    btnCopyOutput.classList.add('btn--copied')
    btnCopyOutput.textContent = 'Copied!'
    clearTimeout(copyResetTimer)
    copyResetTimer = setTimeout(() => {
      btnCopyOutput.classList.remove('btn--copied')
      btnCopyOutput.textContent = 'Copy to clipboard'
    }, 1500)
    showToast('Copied to clipboard.')
  } catch (err) {
    showToast('Could not write to clipboard.')
    console.error('[ClipSanitizer] clipboard write error:', err)
  }
}

btnCopyOutput.addEventListener('click', copyOutput)

// ── Paste from clipboard ──────────────────────────────────────────────────────
async function pasteFromClipboard() {
  try {
    const text = await window.electronAPI.readClipboard()
    if (!text) {
      showToast('Clipboard is empty.')
      return
    }
    inputEl.value = text
    updateCharCount(inputEl, inputCount)
    runSanitize()
  } catch (err) {
    showToast('Could not read clipboard.')
    console.error('[ClipSanitizer] clipboard read error:', err)
  }
}

btnPaste.addEventListener('click', pasteFromClipboard)

// ── Clear ─────────────────────────────────────────────────────────────────────
function clearAll() {
  inputEl.value = ''
  outputEl.value = ''
  updateCharCount(inputEl, inputCount)
  updateCharCount(outputEl, outputCount)
  btnCopyOutput.disabled = true
  setStatus('Paste text into the left pane and click Sanitize.')
  inputEl.focus()
}

btnClear.addEventListener('click', clearAll)

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey) {
    if (e.key === 'S') { e.preventDefault(); runSanitize() }
    if (e.key === 'C') { e.preventDefault(); copyOutput() }
    if (e.key === 'X') { e.preventDefault(); clearAll() }
  }
})

// ── Status bar helper ─────────────────────────────────────────────────────────
function setStatus(msg, modifier = '') {
  statusChanges.textContent = msg
  statusChanges.classList.remove('has-changes', 'no-changes')
  if (modifier) statusChanges.classList.add(modifier)
}

// ── Toast helper ──────────────────────────────────────────────────────────────
function showToast(msg, duration = 2000) {
  toastMsg.textContent = msg
  toastEl.hidden = false
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastEl.hidden = true
  }, duration)
}

// ── Init ─────────────────────────────────────────────────────────────────────
updateCharCount(inputEl, inputCount)
updateCharCount(outputEl, outputCount)
inputEl.focus()
