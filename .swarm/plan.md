<!-- PLAN_HASH: 2s887e2ufe7h5 -->
# ClipSanitizer HTML5 Standalone Build
Swarm: lowtier
Phase: 1 [PENDING] | Updated: 2026-04-09T11:40:32.268Z

---
## Phase 1: Build Infrastructure [PENDING]
- [x] 1.1: Install vite-plugin-singlefile as a devDependency in package.json. Run npm install to update package-lock.json. This is a build-time dependency only. Verify npm test passes after install. [SMALL]
- [ ] 1.2: Create vite.config.web.js in project root. Set root to src/renderer, build.outDir to ../../dist-web, build.emptyOutDir to true, build.target to es2020. Use viteSingleFile({ removeViteModuleLoader: true }) as the only plugin. Set rollupOptions.input to src/renderer/index.web.html via path.join. Do NOT include vite-plugin-electron. Do NOT set base. Existing vite.config.js must remain unchanged. [SMALL] (depends: 1.1)
- [ ] 1.3: In package.json, add two scripts: build:web runs vite build --config vite.config.web.js followed by npm run build:copy-web; build:copy-web runs node scripts/copy-web-artifact.js. Do not modify existing build, dev, test, test:watch, or test:smoke scripts. Also add dist-web/ to .gitignore. [SMALL] (depends: 1.2)

---
## Phase 2: Browser HTML Entry Point [COMPLETE]
- [x] 2.1: Create src/renderer/index.web.html based on src/renderer/index.html with exactly these changes: (1) Remove the CSP meta tag entirely. (2) Change script src from app.js to app.web.js. (3) Add browser-mode notice div with class browser-notice immediately after div#app opens, before the header. (4) Change title to ClipSanitizer (Web). All existing IDs, ARIA labels, stylesheet links, and structural markup must be identical to index.html. src/renderer/index.html must NOT be modified. [SMALL]
- [x] 2.2: In src/renderer/styles/app.css, append the .browser-notice CSS rule at the end of the file. The rule must use only existing CSS custom properties (--text-faint, --surface-alt, --border) and render as a slim centered bar with flex layout, 4px 16px padding, 11px font size, and ellipsis overflow. No existing rules must be modified. [SMALL] (depends: 2.1)

---
## Phase 3: Browser App Logic [COMPLETE]
- [x] 3.1: Create src/renderer/app.web.js as a browser-targeted variant of app.js. Copy all logic from app.js, then make these changes: (1) Remove window.electronAPI startup guard block entirely. (2) Remove window.electronAPI?.onOpenFile listener registration entirely. (3) Replace copyOutput() to use navigator.clipboard.writeText(text) instead of window.electronAPI.writeClipboard. (4) Replace pasteFromClipboard() to use navigator.clipboard.readText() instead of window.electronAPI.readClipboard, with NotAllowedError caught and surfaced as a user-friendly toast. (5) Remove the window.electronAPI guard checks inside copyOutput and pasteFromClipboard. All other logic must be identical: runSanitize, clearAll, loadDocxFile, autoRun, updateCharCount, setStatus, showToast, keyboard shortcuts, drag-and-drop, file input, mammoth import. grep -c electronAPI must return 0. [MEDIUM] (depends: 2.1)

---
## Phase 4: Build Script and Artifact Verification [PENDING]
- [x] 4.1: Create scripts/ directory and scripts/copy-web-artifact.js. The script must: check that dist-web/index.html exists (exit 1 with error if not), create dist/ directory if needed, copy dist-web/index.html to dist/ClipSanitizer-web.html, log success message. Use only Node.js built-in modules (fs, path, url). No third-party dependencies. [SMALL] (depends: 1.3)
- [ ] 4.2: Run npm run build:web and verify the complete pipeline: (1) Command exits 0. (2) dist-web/index.html exists. (3) dist/ClipSanitizer-web.html exists. (4) File is under 2MB. (5) Single-file HTML with all JS/CSS inlined (no separate asset files in dist-web/). (6) npm test still passes. [MEDIUM] (depends: 3.1, 4.1)

---
## Phase 5: Browser Smoke Tests [COMPLETE]
- [x] 5.1: Create tests/web-smoke.test.js using vitest with 7 test categories: (1) Static check: zero electronAPI references in app.web.js via fs.readFileSync. (2) Static check: zero ipcRenderer references. (3) copyOutput uses navigator.clipboard.writeText with mocked clipboard and outputEl. (4) pasteFromClipboard uses navigator.clipboard.readText with mocked clipboard. (5) pasteFromClipboard handles NotAllowedError with permission-denied toast. (6) loadDocxFile works without electronAPI using mocked mammoth. (7) Sanitizer pipeline end-to-end importing sanitize from sanitizer.js. Include adversarial cases: writeText rejection, empty clipboard readText, accidental electronAPI reference. All pre-existing tests must pass. [MEDIUM] (depends: 3.1)
