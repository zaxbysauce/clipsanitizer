// src/renderer/app.js
import { sanitize } from '../sanitizer/sanitizer.js'
import mammoth from 'mammoth'

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

// ── Element references (intake zone) ────────────────────────────────────────
const intakeZone    = document.getElementById('intake-zone')
const dropOverlay   = document.getElementById('drop-overlay')
const fileInput     = document.getElementById('file-input')

// ── State ────────────────────────────────────────────────────────────────────
let toastTimer = null
let copyResetTimer = null
let autoRun = false

// ── Character counter ────────────────────────────────────────────────────────
function updateCharCount(el, counterEl) {
  const n = el.value.length
  counterEl.textContent = n.toLocaleString() + ' char' + (n === 1 ? '' : 's')
}

inputEl.addEventListener('input', () => updateCharCount(inputEl, inputCount))

// ── Docx file loading ────────────────────────────────────────────────────
async function loadDocxFile(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    inputEl.value = result.value
    updateCharCount(inputEl, inputCount)
    autoRun = true
    runSanitize()
    showToast(`Loaded: ${file.name}`)
  } catch (err) {
    showToast('Could not read .docx file.')
    console.error('[ClipSanitizer] docx parse error:', err)
    autoRun = false
  }
}

// ── Drag-and-drop ─────────────────────────────────────────────────────────
intakeZone.addEventListener('dragover', (e) => {
  e.preventDefault()
  const hasDocx =
    [...(e.dataTransfer?.items || [])].some(i =>
      i.kind === 'file' &&
      (i.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
       i.getAsFile()?.name?.endsWith('.docx'))
    ) ||
    [...(e.dataTransfer?.files || [])].some(f => f.name?.endsWith('.docx'))
  intakeZone.classList.toggle('drag-over', hasDocx)
  dropOverlay.hidden = !hasDocx
})

intakeZone.addEventListener('dragleave', () => {
  intakeZone.classList.remove('drag-over')
  dropOverlay.hidden = true
})

intakeZone.addEventListener('drop', async (e) => {
  e.preventDefault()
  intakeZone.classList.remove('drag-over')
  dropOverlay.hidden = true
  const file = [...e.dataTransfer.files].find(f => f.name.endsWith('.docx'))
  if (file) await loadDocxFile(file)
})

// ── File input ──────────────────────────────────────────────────────────────
fileInput.addEventListener('change', async () => {
  if (fileInput.files[0]) await loadDocxFile(fileInput.files[0])
})

// ── Sanitize ─────────────────────────────────────────────────────────────────
function runSanitize() {
  const raw = inputEl.value
  if (!raw.trim()) {
    showToast('Paste some text first.')
    return
  }

  const { text, changes, warnings } = sanitize(raw)

  outputEl.value = text
  updateCharCount(outputEl, outputCount)

  btnCopyOutput.disabled = false

  if (warnings && warnings.length > 0) {
    // Warning takes priority — unmapped chars were dropped
    const w = warnings[0]
    setStatus(`Warning: ${w.message}`, 'has-warning')
  } else if (changes.length === 0) {
    setStatus('No changes needed — text is already clean.', 'no-changes')
  } else {
    const summary = changes
      .map(c => `${c.count.toLocaleString()} ${c.label}`)
      .join(' · ')
    setStatus(summary, 'has-changes')
  }

  if (autoRun) {
    autoRun = false
    copyOutput()
  }
}

btnSanitize.addEventListener('click', runSanitize)

// ── Copy output to clipboard ─────────────────────────────────────────────────
async function copyOutput() {
  if (!window.electronAPI) { showToast('Clipboard unavailable.'); return }
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
  if (!window.electronAPI) { showToast('Clipboard unavailable.'); return }
  try {
    const text = await window.electronAPI.readClipboard()
    if (!text) {
      showToast('Clipboard is empty.')
      return
    }
    inputEl.value = text
    updateCharCount(inputEl, inputCount)
    autoRun = true
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

// ── Shell launch (Send To) listener ─────────────────────────────────────────
if (window.electronAPI?.onOpenFile) {
  window.electronAPI.onOpenFile(async (filePath) => {
    try {
      const text = await window.electronAPI.extractDocx(filePath)
      if (!text) { showToast('Could not read file.'); return }
      inputEl.value = text
      updateCharCount(inputEl, inputCount)
      autoRun = true
      runSanitize()
      showToast('Loaded from shell.')
    } catch (err) {
      showToast('Could not read file.')
      console.error('[ClipSanitizer] open-file IPC error:', err)
    }
  })
}

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
  statusChanges.classList.remove('has-changes', 'no-changes', 'has-warning')
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

// ── Startup guard ──────────────────────────────────────────────────────────────
if (!window.electronAPI) {
  console.error('[ClipSanitizer] window.electronAPI unavailable — preload failed')
  if (btnPaste) btnPaste.disabled = true
  if (btnCopyOutput) btnCopyOutput.disabled = true
  setStatus('Clipboard integration unavailable. Paste text manually.')
}
