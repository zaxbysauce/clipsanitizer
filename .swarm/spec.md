# ClipSanitizer — Specification

## Feature Description

ClipSanitizer is a lightweight Electron desktop utility for Windows 11 that sanitizes clipboard text for compatibility with military EHR systems (MHS GENESIS, AHLTA, etc.). Users paste raw Word-authored content into the left pane, click Sanitize, review the cleaned result in the right pane, and copy the safe text out. The app makes zero network calls, runs fully offline, and must function on low-end edge hardware.

## User Scenarios

### Scenario 1: Basic Sanitization
**Given** a user has copied text from Microsoft Word containing smart quotes, em-dashes, and special characters
**When** the user pastes the text into the left pane and clicks Sanitize
**Then** the cleaned ASCII-safe text appears in the right pane with a change summary indicating what was converted

### Scenario 2: Clipboard Integration
**Given** a user has text on the system clipboard
**When** the user clicks "Paste from clipboard"
**Then** the text appears in the input pane and auto-sanitizes immediately, populating the output pane

### Scenario 3: Copy Clean Result
**Given** the output pane contains sanitized text
**When** the user clicks "Copy to clipboard"
**Then** the clean text is written to the system clipboard with visual confirmation

### Scenario 4: Air-Gap Enforcement
**Given** the app is running
**When** any JavaScript in the renderer attempts a network request (http/https/ftp)
**Then** the request is blocked and logged; the app remains fully offline

### Scenario 5: Low-End Hardware
**Given** hardware with 4GB RAM and a HDD
**When** the app launches
**Then** the window appears within 3 seconds and CPU returns to <5% within 2 seconds of showing

## Functional Requirements

- **FR-001**: The app MUST provide a two-pane user interface — left pane for raw/input text, right pane for clean/output text
- **FR-002**: The app MUST provide a "Paste from clipboard" button that reads system clipboard and auto-runs sanitization
- **FR-003**: The app MUST provide a "Copy to clipboard" button (disabled until first sanitize) that writes output text to system clipboard
- **FR-004**: The app MUST provide a "Clear" button that resets both panes, char counts, and disables the copy button
- **FR-005**: The app MUST display live character counts for both input and output panes
- **FR-006**: The app MUST display a status bar showing change summary after sanitization
- **FR-007**: The app MUST provide keyboard shortcuts: Ctrl+Shift+S (sanitize), Ctrl+Shift+C (copy), Ctrl+Shift+X (clear)
- **FR-008**: The app MUST show toast notifications for user feedback (empty paste, clipboard errors, copy success)
- **FR-009**: The app MUST block ALL outbound network requests (http, https, ftp) from the renderer process
- **FR-010**: The app MUST prevent navigation away from the app (no will-navigate, window.open denied)
- **FR-011**: The app MUST NOT expose Node.js APIs to the renderer — contextIsolation:true, nodeIntegration:false
- **FR-012**: The app MUST use sandbox:false only if required for preload script
- **FR-013**: The app MUST provide clipboard read/write via IPC through a secure contextBridge API
- **FR-014**: The sanitizer engine MUST apply character substitutions from an ordered CHARMAP array before any other normalization
- **FR-015**: The sanitizer engine MUST apply NFKC normalization after CHARMAP substitutions
- **FR-016**: The sanitizer engine MUST strip zero-width and invisible Unicode characters
- **FR-017**: The sanitizer engine MUST remove C0/C1 control characters except tab (\\x09), newline (\\x0A), carriage-return (\\x0D)
- **FR-018**: The sanitizer engine MUST normalize all line endings to \\n (Unix style)
- **FR-019**: The sanitizer engine MUST strip any remaining non-ASCII characters, keeping only printable ASCII (32-126), tab, newline, carriage-return
- **FR-020**: The sanitizer engine MUST return a change summary listing categories of changes made (e.g., "smart quotes → straight: 5")
- **FR-021**: The sanitizer engine MUST process 50,000-character input in under 50ms
- **FR-022**: The sanitizer engine output MUST contain only characters matching regex /[\\x09\\x0A\\x0D\\x20-\\x7E]/
- **FR-023**: The app MUST be buildable as NSIS installer (x64 and ia32) and portable EXE (x64 and ia32)
- **FR-024**: The app MUST NOT require admin/UAC rights for installation or execution
- **FR-025**: The packaged app MUST run fully offline with no network connectivity
- **FR-026**: The app window MUST appear within 3 seconds on hardware with 4GB RAM and HDD
- **FR-027**: Memory footprint at idle MUST be below 150MB
- **FR-028**: CPU usage MUST return to <5% within 2 seconds of window showing

## Success Criteria

- **SC-001**: `npm run dev` launches Electron with a renderer window without errors
- **SC-002**: Network request blocker is confirmed active — external URL load is denied
- **SC-003**: `window.electronAPI.readClipboard()` and `writeClipboard(text)` are callable from DevTools
- **SC-004**: All 60+ sanitizer unit tests pass with zero skipped
- **SC-005**: 100% of CHARMAP entries are covered by at least one test
- **SC-006**: Performance test passes: 50k-char input sanitizes in under 50ms
- **SC-007**: All output from sanitize() passes the purity regex /[\\x09\\x0A\\x0D\\x20-\\x7E]/
- **SC-008**: App renders correctly at 960×560, 700×420 (minimum), and 1280×800
- **SC-009**: All button states (default, hover, active, disabled, copied) render correctly
- **SC-010**: Both textareas scroll independently with 50,000-character inputs
- **SC-011**: All keyboard shortcuts (Ctrl+Shift+S/C/X) work correctly
- **SC-012**: Tab order is logical through all interactive elements
- **SC-013**: Focus rings are visible on all interactive elements (WCAG AA)
- **SC-014**: Header drag region allows window movement; buttons inside header do not interfere
- **SC-015**: Build produces exactly 4 artifacts: NSIS x64, NSIS ia32, portable x64, portable ia32
- **SC-016**: Portable EXE runs from any directory including USB drive without admin rights

## Key Entities

- **ClipboardText**: Raw text content from system clipboard (input)
- **SanitizedText**: Clean ASCII-safe text output
- **ChangeRecord**: { category: string, label: string, count: number } — summary of a change category
- **CHARMAP**: Array of [unicodeCharOrString, asciiReplacement] tuples applied in order
- **ElectronAPI**: contextBridge-exposed API with readClipboard() and writeClipboard(text)

## Edge Cases and Known Failure Modes

- **Empty input**: sanitize() returns { text: '', changes: [] } — no error thrown
- **Non-string input**: sanitize() returns { text: '', changes: [] } for non-string types
- **Already-clean ASCII text**: returns input unchanged, changes: []
- **Very large input (50k+ chars)**: must process in <50ms — performance regression detected
- **Clipboard empty on paste**: shows toast "Clipboard is empty." — no error thrown
- **Clipboard read/write failure**: shows toast with error message — no exception propagated
- **Non-string passed to writeClipboard**: returns false without throwing
- **Smart quotes in clinical terms (e.g., O'Brien)**: correctly converted to straight quotes
- **Micro sign (µ) in medication dosing**: converted to lowercase 'u' (not 'mc')
- **Fraction ½**: converted to '1/2' (not decimal 0.5)
- **Windows-1252 misencoded bytes**: handled as safety net in CHARMAP

## Implementation Constraints

- **Technology**: Electron 33+, Vite 6+, Vanilla JS + DOM (no React), Plain CSS, Vitest, electron-builder
- **No network calls**: All outbound HTTP/HTTPS/FTP requests blocked
- **Low-end hardware**: Startup under 3s, CPU <5% idle, memory <150MB
- **Offline-only**: No auto-update, no publish, no Squirrel
- **Security**: contextIsolation:true, nodeIntegration:false, no Node APIs in renderer

## Unresolved Areas

- ~~[NEEDS CLARIFICATION] Does the app need to preserve the user's window size/position between sessions?~~ → **RESOLVED: Yes** — window geometry persisted between sessions via electron-store. Costs minimal, improves UX on shared workstations.
- ~~[NEEDS CLARIFICATION] Is there a need for a settings/preferences mechanism, or is the UI intentionally minimal?~~ → **RESOLVED: No settings UI** — v1 ships minimal (as-builts only). Settings creep increases testing burden and attack surface in air-gapped environments.
- ~~[NEEDS CLARIFICATION] Should the app log sanitization events anywhere (local file?), or is zero-logging required?~~ → **RESOLVED: No logging** — zero-logging for HIPAA/STIG compliance. No PHI in plaintext files on shared workstations. Audit trail can be added in v2 if needed.
