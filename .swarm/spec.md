# ClipSanitizer Word Document Intake — Specification

## Feature Description

ClipSanitizer currently accepts text only via clipboard paste. Users who receive `.docx` files (common in clinical/EHR workflows) must manually open the file, select all text, copy it, switch to ClipSanitizer, and paste. This feature adds `.docx` file intake directly into ClipSanitizer so users can drag-and-drop or attach a `.docx` file, have its plain text extracted and auto-sanitized, and receive the clean result — matching the one-click UX of the existing "Paste from clipboard" flow.

## User Scenarios

### US-001: Drag-and-drop a .docx file
**Given** ClipSanitizer is open with the input pane visible
**When** the user drags a `.docx` file from Explorer onto the input pane and drops it
**Then** a drop overlay appears during the drag, the file's plain text is extracted, the input pane is populated, the text is auto-sanitized, the output pane shows the clean result, and the result is automatically copied to the clipboard

### US-002: Attach a .docx via file picker button
**Given** ClipSanitizer is open with the input pane visible
**When** the user clicks "Attach .docx" in the input pane footer and selects a `.docx` file from the system file dialog
**Then** the file's plain text is extracted, the input pane is populated, the text is auto-sanitized, the output pane shows the clean result, and the result is automatically copied to the clipboard

### US-003: Send To from Windows Explorer (installed build only)
**Given** ClipSanitizer is installed via NSIS installer
**When** the user right-clicks a `.docx` file in Explorer, selects "Send To → ClipSanitizer"
**Then** ClipSanitizer launches, receives the file path, extracts its plain text, auto-sanitizes it, populates both panes, and auto-copies the result to the clipboard

### US-004: Rejection of non-.docx files
**Given** ClipSanitizer is open
**When** the user drops a non-`.docx` file (e.g., `.pdf`, `.txt`, `.xlsx`) onto the input pane
**Then** no overlay is shown during drag, no text is extracted, and no error toast appears — the action is silently ignored

### US-005: Corrupt or unreadable .docx file
**Given** ClipSanitizer is open
**When** the user drops or attaches a `.docx` file that cannot be parsed (corrupt, empty, or invalid format)
**Then** an error toast "Could not read .docx file." is shown, the input pane remains unchanged, and no sanitization is triggered

### US-006: Manual sanitize does not auto-copy
**Given** the user has loaded a `.docx` file (auto-copy has occurred)
**When** the user edits the input text and clicks the Sanitize button manually
**Then** the text is sanitized and the output is updated, but the result is NOT automatically copied to the clipboard

### US-007: Portable build is unaffected
**Given** ClipSanitizer portable build
**When** the portable EXE is launched
**Then** no "Send To" shell shortcut exists, and drag-drop/file-picker `.docx` intake works identically to the installed build

## Functional Requirements

### Dependency and Version
- **FR-001**: mammoth MUST be added as a runtime dependency (not devDependency) to enable `.docx` extraction at runtime
- **FR-002**: The application version MUST be bumped from `1.0.1` to `1.1.0` to reflect the new feature

### Shell Integration (NSIS Installer Only)
- **FR-003**: The NSIS installer MUST create a "Send To" shell shortcut pointing to the installed ClipSanitizer executable
- **FR-004**: The NSIS uninstaller MUST remove the "Send To" shell shortcut
- **FR-005**: The portable build MUST NOT create or reference any shell shortcuts
- **FR-006**: The "Send To" shortcut MUST use the application icon

### Main Process Extensions
- **FR-007**: The main process MUST expose a `docx:extract` IPC handler that accepts a file path string and returns the extracted plain text
- **FR-008**: The `docx:extract` IPC handler MUST return an empty string for non-string input or paths not ending in `.docx`
- **FR-009**: The `docx:extract` IPC handler MUST catch extraction errors and return an empty string
- **FR-010**: On startup, the main process MUST inspect `process.argv` for a `.docx` file path argument
- **FR-011**: If a `.docx` path is found in argv, the main process MUST forward it to the renderer via an `open-file` event AFTER the renderer has finished loading (`did-finish-load`)
- **FR-012**: If no `.docx` path is found in argv, startup MUST proceed identically to current behavior

### Preload Bridge
- **FR-013**: The preload script MUST expose `extractDocx(filePath)` to the renderer via contextBridge
- **FR-014**: The preload script MUST expose `onOpenFile(callback)` to the renderer via contextBridge for receiving `open-file` events from the main process
- **FR-015**: No new Node.js APIs MUST be exposed to the renderer

### Renderer UI
- **FR-016**: The input pane MUST contain a drop zone overlay that appears when a `.docx` file is dragged over it
- **FR-017**: The drop zone overlay MUST be hidden by default and shown only when a valid `.docx` file is detected in the drag data
- **FR-018**: The input pane footer MUST contain an "Attach .docx" file input button that accepts only `.docx` files
- **FR-019**: All existing element IDs, ARIA attributes, and the CSP meta tag MUST remain unchanged

### Renderer Behavior
- **FR-020**: Dragging a `.docx` file and dropping it on the input pane MUST extract the file's plain text, populate the input pane, auto-sanitize, and auto-copy the result
- **FR-021**: Clicking "Attach .docx" and selecting a file MUST extract the file's plain text, populate the input pane, auto-sanitize, and auto-copy the result
- **FR-022**: When launched via Send To (shell), the renderer MUST receive the file path via IPC, extract text using the main process handler, populate the input pane, auto-sanitize, and auto-copy the result
- **FR-023**: An `autoRun` flag MUST control auto-copy behavior — it MUST be set to `true` only by file intake paths (drag-drop, file picker, Send To), never by manual sanitize button clicks
- **FR-024**: After auto-copy, the `autoRun` flag MUST be reset to `false` before `copyOutput()` is called to prevent double-trigger
- **FR-025**: Corrupt or unreadable `.docx` files MUST show an error toast and MUST NOT trigger sanitization
- **FR-026**: Non-`.docx` files dropped on the input pane MUST be silently ignored — no overlay shown, no error, no action taken

### Existing Behavior Preservation
- **FR-027**: The existing "Paste from clipboard" flow MUST continue to work identically, including its auto-copy behavior
- **FR-028**: The sanitizer core (sanitizer.js, charmap.js) MUST require zero changes
- **FR-029**: The network air-gap (onBeforeRequest block) MUST remain unaffected — mammoth operates on local file data with no network calls
- **FR-030**: The `sandbox: true` and `contextIsolation: true` security model MUST be maintained
- **FR-031**: Dev mode startup (Vite dev server at localhost:5173) MUST work identically when no `.docx` argument is present

### Testing
- **FR-032**: Tests MUST cover mammoth extraction against a real `.docx` fixture file
- **FR-033**: Tests MUST cover `loadDocxFile` success and error paths
- **FR-034**: Tests MUST cover drag-drop rejection of non-`.docx` files
- **FR-035**: Tests MUST cover `autoRun` flag behavior (set, consumed, reset, no double-trigger)
- **FR-036**: Tests MUST cover the `onOpenFile` IPC path
- **FR-037**: Tests MUST include adversarial cases: corrupt file, empty IPC return, non-`.docx` drop
- **FR-038**: All existing sanitizer and smoke tests MUST continue to pass with zero regressions

## Success Criteria

- **SC-001**: User can drag-drop a `.docx` file onto ClipSanitizer and receive sanitized, clipboard-ready text in one action
- **SC-002**: User can attach a `.docx` file via button and receive sanitized, clipboard-ready text in one action
- **SC-003**: Right-click "Send To" launches ClipSanitizer with the file pre-loaded and auto-sanitized (installed build only)
- **SC-004**: Non-`.docx` files are silently rejected with no side effects
- **SC-005**: Manual sanitize button click never triggers auto-copy
- **SC-006**: All existing tests pass — zero regressions
- **SC-007**: New test suite covers all 6 test categories with positive, negative, and adversarial cases
- **SC-008**: The sanitizer core requires zero modifications

## Key Entities

- **mammoth**: External library for `.docx` plain text extraction
- **docx:extract IPC channel**: Main-process handler for file-path-based extraction
- **open-file IPC channel**: Main-to-renderer event for argv-detected `.docx` paths
- **autoRun flag**: Boolean state variable controlling auto-copy on sanitize
- **loadDocxFile()**: Renderer function that orchestrates extraction → populate → sanitize → copy
- **intake-zone**: DOM container enabling drag-drop with overlay
- **drop-overlay**: Visual feedback shown during valid `.docx` drag
- **file-input**: Hidden file input triggered by "Attach .docx" button
- **Send To shortcut**: NSIS-created shell entry (installed build only)

## Edge Cases and Known Failure Modes

- **EC-001**: File with `.docx` extension but invalid/corrupt OXML content — mammoth may throw; must be caught and reported via toast
- **EC-002**: Very large `.docx` file — mammoth extracts plain text only (no images), but a multi-hundred-page document may produce a large string; the existing 50ms performance budget applies only to sanitizer, not extraction
- **EC-003**: `.docx` file with embedded macros or complex formatting — mammoth.extractRawText() strips all formatting, so macros are inherently ignored
- **EC-004**: Drag-drop of multiple files — only the first `.docx` in the drop payload is processed
- **EC-005**: Dev mode with `process.argv` containing Vite's own arguments — the argv check MUST filter for `.docx`-ending arguments only, not match unrelated CLI args
- **EC-006**: Send To launch while ClipSanitizer is already running — single-instance behavior is not in scope; this is a known limitation of the current app (no single-instance lock)
