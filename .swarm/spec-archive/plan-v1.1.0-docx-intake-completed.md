<!-- PLAN_HASH: 1dhdx9ya2wa7y -->
# ClipSanitizer Word Document Intake v1.1.0
Swarm: lowtier
Phase: 1 [COMPLETE] | Updated: 2026-04-09T01:53:00.734Z

---
## Phase 1: Dependency and Version Bump [COMPLETE]
- [x] 1.1: Add mammoth as a runtime dependency in package.json (NOT devDependencies). Bump version from 1.0.1 to 1.1.0. Run npm install to update package-lock.json. Verify import mammoth from 'mammoth' resolves in renderer context via npm run dev startup. Rollback: if mammoth import fails, remove from dependencies and revert version bump. [SMALL]

---
## Phase 2: NSIS Shell Integration [COMPLETE]
- [x] 2.1: Create build/ directory and build/installer.nsh with two NSIS macros: customInstall creates a Send To shortcut ($SENDTO\ClipSanitizer.lnk) pointing to $INSTDIR\ClipSanitizer.exe with icon at $INSTDIR\resources\assets\icons\win\icon.ico; customUninstall deletes $SENDTO\ClipSanitizer.lnk. No other macros or directives. Verify syntax is valid NSIS (CreateShortcut and Delete are standard instructions). [SMALL]
- [x] 2.2: Add "include": "build/installer.nsh" to the existing nsis build config block in package.json. Do not modify the portable block or any other nsis fields. [SMALL] (depends: 2.1)

---
## Phase 3: Main Process IPC [COMPLETE]
- [x] 3.1: Add ipcMain.handle('docx:extract', ...) handler in src/main/main.js alongside existing clipboard handlers (near line 89). Add const mammoth = require('mammoth') at file top. Handler: guard non-string or non-.docx input returns ''; call mammoth.extractRawText({path: filePath}) and return result.value; catch errors, log [ClipSanitizer] docx IPC extract error, return ''. Verify handler does not modify existing clipboard:read or clipboard:write handlers. [SMALL] (depends: 1.1)
- [x] 3.2: Update app.whenReady().then(createWindow) in src/main/main.js to inspect process.argv.slice(1) for a .docx-ending argument after createWindow(). If found, get window via BrowserWindow.getAllWindows()[0], wait for win.webContents.once('did-finish-load'), then send via win.webContents.send('open-file', filePath). No change when no .docx arg present. Dev mode startup unchanged. Verify Vite dev args in argv are not matched as .docx files. [SMALL] (depends: 3.1)

---
## Phase 4: Preload Bridge [COMPLETE]
- [x] 4.1: Add two entries to the existing contextBridge.exposeInMainWorld('electronAPI', {...}) object in src/main/preload.js: extractDocx: (filePath) => ipcRenderer.invoke('docx:extract', filePath) and onOpenFile: (cb) => ipcRenderer.on('open-file', (_e, path) => cb(path)). Do not modify existing readClipboard or writeClipboard entries. [SMALL] (depends: 3.1, 3.2)

---
## Phase 5: Renderer UI [COMPLETE]
- [x] 5.1: In src/renderer/index.html inside the pane pane--input section: (1) Wrap existing textarea in a new div id='intake-zone' class='intake-zone' with a div id='drop-overlay' class='drop-overlay' hidden aria-hidden='true' as first child containing span class='drop-label'. (2) In pane__footer after input-char-count span, add a label class='btn btn--ghost btn--xs btn--file' for='file-input' with hidden input type='file' id='file-input' accept='.docx'. All existing IDs, ARIA attrs, CSP unchanged. [MEDIUM]
- [x] 5.2: In src/renderer/styles/app.css, add new rule blocks: .intake-zone (position:relative, flex:1, min-height:0, display:flex, flex-direction:column), .drop-overlay (position:absolute, inset:0, flex centering, accent-dim bg, dashed border, pointer-events:none, z-index:10), .drop-overlay[hidden] (display:none), .drop-label (13px, weight 500, accent color), .intake-zone.drag-over (dashed outline), .btn--file (cursor:pointer). Extend existing .pane__footer rule to add justify-content:space-between without duplicating the rule. [MEDIUM] (depends: 5.1)

---
## Phase 6: Renderer Logic [COMPLETE]
- [x] 6.1: In src/renderer/app.js: add import mammoth from 'mammoth' at top after existing imports. Add let autoRun = false alongside existing state vars. Add async loadDocxFile(file) function: read file.arrayBuffer(), call mammoth.extractRawText({arrayBuffer}), set inputEl.value = result.value, call updateCharCount, set autoRun = true, call runSanitize(), show toast 'Loaded: ' + file.name. On error: show toast 'Could not read .docx file.', log error, reset autoRun = false. [MEDIUM] (depends: 4.1, 5.2)
- [x] 6.2: In src/renderer/app.js: add element references for intakeZone, dropOverlay, fileInput after existing refs block. Wire three event listeners on intakeZone: dragover (check dataTransfer items/files for .docx MIME or extension, toggle drag-over class and overlay hidden), dragleave (remove class, hide overlay), drop (preventDefault, remove class, hide overlay, find .docx file, call loadDocxFile). Non-.docx drag shows no overlay. [MEDIUM] (depends: 6.1)
- [x] 6.3: In src/renderer/app.js: add fileInput.addEventListener('change', ...) calling loadDocxFile with first file. Add onOpenFile IPC listener guarded by window.electronAPI?.onOpenFile: calls extractDocx(filePath), populates inputEl and charCount, sets autoRun = true, calls runSanitize(), shows toast 'Loaded from shell.'. Empty/falsy text shows error toast and returns early. Error shows toast and logs. [MEDIUM] (depends: 6.2)
- [x] 6.4: In src/renderer/app.js: modify runSanitize() to check autoRun flag at end of successful path (after btnCopyOutput.disabled = false and setStatus call). Add: if (autoRun) { autoRun = false; copyOutput() }. Also in pasteFromClipboard(), add autoRun = true before runSanitize() call — this is an intentional UX enhancement (FR-027 'identical' refers to the paste flow mechanism, not the auto-copy behavior which is new). Early-return guard must not touch autoRun. Manual sanitize click never sets autoRun. Verify: manual sanitize click does NOT auto-copy, while drag-drop/file-picker/SendTo/pasteFromClipboard DO auto-copy. [MEDIUM] (depends: 6.1)

---
## Phase 7: Tests [COMPLETE]
- [x] 7.1: Create tests/fixtures/sample.docx — a minimal real .docx file containing the text 'ClipSanitizer test document'. This fixture is used by the mammoth extraction test in Task 7.2 to validate mammoth works in the Node.js test environment against a real file. [SMALL] (depends: 6.1)
- [x] 7.2: Create tests/docx-intake.test.js with vitest covering 6 test categories: (1) mammoth fixture extraction against real sample.docx, (2) loadDocxFile success path with mocked mammoth, (3) loadDocxFile error path, (4) drop handler rejects non-.docx, (5) autoRun auto-copy behavior with runSanitize, (6) onOpenFile IPC path with mocked electronAPI. Include adversarial cases: corrupt file (mammoth throws), empty extractDocx IPC return, non-.docx drop. All existing sanitizer and smoke tests must pass. [LARGE] (depends: 6.2, 6.3, 6.4, 7.1)
