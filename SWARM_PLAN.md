# ClipSanitizer
Swarm: paid
Phase: 1 [IN PROGRESS] | Updated: 2026-04-07T00:42:33.995Z

---
## Phase 1: Project Scaffold [IN PROGRESS]
- [ ] 1.1: Initialize project with package.json and vite.config.js for Electron + Vite bundler [SMALL] ← CURRENT
- [x] 1.2: Create main process (src/main/main.js) with Electron window, network blocking, clipboard IPC handlers, and window geometry persistence via electron-store [SMALL] (depends: 1.1)
- [x] 1.3: Create preload script (src/main/preload.js) exposing electronAPI with readClipboard and writeClipboard via contextBridge [SMALL] (depends: 1.2)

---
## Phase 2: Sanitizer Engine [COMPLETE]
- [x] 2.1: Create character substitution map (src/sanitizer/charmap.js) — ordered CHARMAP array of [unicode, ascii] tuples covering smart quotes, dashes, ellipsis, spaces, invisible chars, symbols, fractions, superscripts, ligatures, arrows, math operators [SMALL]
- [x] 2.2: Create sanitizer engine (src/sanitizer/sanitizer.js) — pure JS pipeline: CHARMAP substitutions → NFKC normalization → whitespace normalization → zero-width strip → C0/C1 control removal → CRLF normalization → final ASCII strip [MEDIUM] (depends: 2.1)
- [x] 2.3: Write sanitizer unit tests (tests/sanitizer.test.js) — minimum 60 cases covering every CHARMAP entry, NFKC, whitespace, invisible chars, edge cases, fixture test [MEDIUM] (depends: 2.1, 2.2)

---
## Phase 3: User Interface [COMPLETE]
- [x] 3.1: Create app shell (src/renderer/index.html) — two-pane layout, header with clear button, input/output textareas, center action column with Sanitize button, status bar, toast notification [SMALL]
- [x] 3.2: Create CSS styles (src/renderer/styles/reset.css and app.css) — dark theme, design tokens, two-pane layout, button variants, status bar, toast, scrollbars [SMALL]
- [x] 3.3: Create app logic (src/renderer/app.js) — sanitize on click, clipboard paste/read/write, clear, char counters, keyboard shortcuts (Ctrl+Shift+S/C/X), toast notifications [SMALL] (depends: 3.1, 3.2)

---
## Phase 4: Performance Hardening [COMPLETE]
- [x] 4.1: Add startup optimizations to main.js — disable background-networking, default-apps, extensions, sync, metrics, first-run, safebrowsing; set NODE_ENV=production in electron-builder extraMetadata [SMALL] (depends: 1.2)

---
## Phase 5: Build Configuration [COMPLETE]
- [x] 5.1: Create electron-builder.config.js — appId gov.mil.clipsanitizer, output to dist/, win target nsis+portable for x64+ia32, asInvoker execution level, NSIS allowChangeDir, portable artifact naming [SMALL] (depends: 1.1)

---
## Phase 6: Test Fixtures [COMPLETE]
- [x] 6.1: Create test fixtures — tests/fixtures/word-sample.txt (Word-generated content with smart chars) and tests/fixtures/word-sample.clean.txt (expected sanitized output); fixture test in sanitizer.test.js asserts byte-for-byte match [SMALL] (depends: 2.3)
- [x] 6.2: Create Electron smoke tests (tests/smoke.test.js) — launch app, verify window opens, verify clipboard IPC works, verify network blocking active, verify keyboard shortcuts registered [SMALL] (depends: 1.3, 3.3)
