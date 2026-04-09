# ClipSanitizer HTML5 Standalone Build

## Feature Description

Users need a self-contained, single-file HTML artifact that runs the full ClipSanitizer application entirely in a web browser from the local filesystem (`file://` protocol). This provides an alternative distribution method for non-Windows users, users who cannot run executables, or environments where installing applications is restricted. The standalone build must reuse the existing sanitizer engine and UI structure without modification, and must ship alongside the existing Electron portable executable.

## User Scenarios

### US-001: Non-Windows user opens ClipSanitizer in a browser
**Given** a user on macOS or Linux does not have the Electron app
**When** they open `ClipSanitizer-web.html` in a Chromium-based browser via `file://` protocol
**Then** the full two-pane sanitizer UI renders correctly with all interactive elements functional

### US-002: User pastes text via browser clipboard permission prompt
**Given** the standalone HTML file is open in a browser
**When** the user clicks "Paste from clipboard" for the first time
**Then** the browser shows a clipboard permission prompt, and upon granting permission, clipboard content is pasted into the input pane

### US-003: User copies sanitized output via browser clipboard API
**Given** the user has sanitized text with visible output
**When** the user clicks "Copy to clipboard"
**Then** the sanitized text is written to the system clipboard via `navigator.clipboard.writeText` with a visual confirmation

### US-004: User understands browser-mode limitations via notice banner
**Given** the standalone HTML file is open
**When** the user views the application
**Then** a visible but unobtrusive notice informs them that clipboard paste requires permission and that the network air-gap enforcement from the Electron version does not apply

### US-005: User attaches a .docx file via file picker
**Given** the standalone HTML file is open
**When** the user clicks "Attach .docx" and selects a valid .docx file
**Then** the file text is extracted using mammoth.js in the browser and placed into the input pane, then auto-sanitized

### US-006: User drags and drops a .docx file
**Given** the standalone HTML file is open
**When** the user drags a .docx file over the input pane and drops it
**Then** the drop overlay appears during drag, the file is extracted, placed into the input pane, and auto-sanitized

### US-007: User handles clipboard permission denial
**Given** the standalone HTML file is open and the user has not granted clipboard permission
**When** the user clicks "Paste from clipboard" and denies the browser permission prompt
**Then** a user-friendly toast message explains the permission was denied and suggests allowing access

## Functional Requirements

- FR-001: The build system MUST produce a single `ClipSanitizer-web.html` file containing all JS, CSS, and HTML inlined with no external asset dependencies.
- FR-002: The standalone build MUST reuse `src/sanitizer/sanitizer.js` and `src/sanitizer/charmap.js` without modification.
- FR-003: The standalone build MUST reuse the existing UI structure and `app.css` styles with minimal adaptation.
- FR-004: The standalone entry point MUST NOT include the Electron Content Security Policy meta tag, as inlined scripts would be blocked by `script-src 'self'`.
- FR-005: The standalone app MUST use `navigator.clipboard.writeText()` instead of `window.electronAPI.writeClipboard()` for copying sanitized output.
- FR-006: The standalone app MUST use `navigator.clipboard.readText()` instead of `window.electronAPI.readClipboard()` for reading clipboard content.
- FR-007: The standalone app MUST handle `NotAllowedError` from `navigator.clipboard.readText()` with a user-friendly toast message directing the user to grant permission.
- FR-008: The standalone app MUST contain zero references to `window.electronAPI` or `ipcRenderer`.
- FR-009: The standalone app MUST preserve all functionality from the Electron version: sanitization pipeline, drag-and-drop .docx extraction, file picker, keyboard shortcuts (Ctrl+Shift+S/C/X), toast notifications, status bar, character counters, and auto-run behavior.
- FR-010: The standalone app MUST NOT register an `onOpenFile` listener or include a startup guard checking for `window.electronAPI`, as these are Electron-only concepts.
- FR-011: The standalone build MUST display a browser-mode notice banner informing users of clipboard permission behavior and the absence of network air-gap enforcement.
- FR-012: The Electron entry point (`src/renderer/index.html`) and Electron app logic (`src/renderer/app.js`) MUST NOT be modified by this feature.
- FR-013: The standalone build MUST NOT include `vite-plugin-electron` — it is a pure browser build with no Electron process.
- FR-014: The build output MUST be under 2MB in file size.
- FR-015: The `dist-web/` intermediate build directory MUST be gitignored.
- FR-016: The final artifact MUST be copied to `dist/ClipSanitizer-web.html` so both the Electron portable EXE and the web artifact ship from the same distribution directory.
- FR-017: All existing Electron sanitizer tests, docx-intake tests, and smoke tests MUST continue to pass without modification.

## Success Criteria

- SC-001: `npm run build:web` exits 0 and produces a valid single-file HTML artifact.
- SC-002: The produced HTML file opens correctly in Chromium-based browsers via `file://` protocol with no console errors related to missing assets or module loading.
- SC-003: The full sanitizer pipeline works end-to-end in the browser: paste text, sanitize, verify output.
- SC-004: Clipboard read and write operations function correctly in the browser with appropriate permission handling.
- SC-005: Drag-and-drop and file picker .docx extraction work identically to the Electron version.
- SC-006: `npm test` passes with zero regressions across all existing test suites plus new browser smoke tests.
- SC-007: Static analysis confirms zero `electronAPI` or `ipcRenderer` references in the standalone app code.

## Key Entities

- **Standalone HTML artifact** — single-file output containing all application code
- **Browser app entry point** — separate HTML/JS files for the browser build variant
- **Build configuration** — separate Vite config for the browser build pipeline
- **Artifact copy script** — Node script that copies the built HTML to the distribution directory

## Edge Cases and Known Failure Modes

- **Clipboard permission denial**: `navigator.clipboard.readText()` triggers a browser permission prompt. If denied, the app must show a clear toast rather than failing silently.
- **Non-Chromium browsers**: `navigator.clipboard` API behavior varies across browsers. Firefox on `file://` may not support clipboard write. This is an accepted limitation.
- **No network air-gap**: The Electron version blocks network requests via `onBeforeRequest`. The browser version has no equivalent mechanism. Users must be informed of this difference.
- **Large .docx files**: mammoth.js processes files entirely in memory. Very large documents could cause performance issues in the browser. This is inherited behavior from the Electron version and is not addressed by this feature.
- **`dist-web/` not gitignored**: The intermediate build output directory must be gitignored before the first build, otherwise build artifacts would be committed.
