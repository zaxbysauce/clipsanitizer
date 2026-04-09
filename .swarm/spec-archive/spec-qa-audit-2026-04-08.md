# ClipSanitizer QA Audit — Specification

## Feature Description

Deep QA audit of the ClipSanitizer codebase (an Electron desktop utility that sanitizes clipboard text for EHR compatibility). The audit applies heightened skepticism to what may be LLM-assisted code, using a strict Explorer → Reviewer → Critic pipeline with inline severity routing.

## User Scenarios (Audit Targets)

This audit covers the shipped code, not user-facing features. Key areas under review:
- Sanitizer engine correctness (character mappings, NFKC, control chars)
- Electron security model (contextBridge, network blocking, preload isolation)
- UI behavior (clipboard IPC, keyboard shortcuts, state management)
- Build output and packaging
- Claimed vs shipped behavior (README, docs, API)

## Functional Requirements Under Audit

### Sanitizer Engine
- **FR-SAN-001**: sanitize() returns only chars in [\x09\x0A\x0D\x20-\x7E]
- **FR-SAN-002**: All CHARMAP entries are applied in order before NFKC
- **FR-SAN-003**: NFKC normalization applied after CHARMAP substitutions
- **FR-SAN-004**: Zero-width and invisible Unicode characters stripped
- **FR-SAN-005**: C0/C1 control chars removed except \t \n \r
- **FR-SAN-006**: Line endings normalized to \n
- **FR-SAN-007**: Change summary records categories correctly
- **FR-SAN-008**: Non-string/empty input returns {text:'', changes:[], warnings:[]}
- **FR-SAN-009**: Digit-adjacent fractions get space guard (e.g., 87½ → 87 1/2)
- **FR-SAN-010**: µg → mcg conversions for clinical units
- **FR-SAN-011**: Latin diacritics transliterated to ASCII (José → Jose)
- **FR-SAN-012**: 50k-char input processes in under 50ms
- **FR-SAN-013**: Output purity regex /[\x09\x0A\x0D\x20-\x7E]/ passes always

### Electron Security Model
- **FR-SEC-001**: contextIsolation:true, nodeIntegration:false confirmed
- **FR-SEC-002**: sandbox:true confirmed
- **FR-SEC-003**: No Node APIs exposed to renderer
- **FR-SEC-004**: All network requests (http/https/ftp) blocked
- **FR-SEC-005**: will-navigate prevented
- **FR-SEC-006**: window.open denied
- **FR-SEC-007**: Clipboard access via IPC invoke/handle only
- **FR-SEC-008**: window.electronAPI unavailable → graceful fallback

### UI / Renderer
- **FR-UI-001**: Two-pane layout (input/output) functional
- **FR-UI-002**: Paste from clipboard reads system clipboard
- **FR-UI-003**: Copy to clipboard writes system clipboard
- **FR-UI-004**: Clear resets both panes and disables copy button
- **FR-UI-005**: Keyboard shortcuts Ctrl+Shift+S/C/X work
- **FR-UI-006**: Toast notifications for empty paste, clipboard errors
- **FR-UI-007**: Character counters update live
- **FR-UI-008**: Status bar shows change summary
- **FR-UI-009**: Copy button disabled until first sanitize

### Build / Packaging
- **FR-BLD-001**: npm run build produces NSIS installer + portable EXE
- **FR-BLD-002**: No Squirrel, no auto-update, no network on packaged app
- **FR-BLD-003**: asInvoker execution level (no UAC prompt)
- **FR-BLD-004**: portable runs from any directory without admin rights

## Key Entities Under Review

- **CHARMAP**: Array of [unicodeCharOrString, asciiReplacement] tuples (src/sanitizer/charmap.js)
- **sanitize()**: Pure function → {text: string, changes: ChangeRecord[], warnings: Warning[]}
- **electronAPI**: contextBridge API {readClipboard(), writeClipboard(text)}
- **BrowserWindow**: Main process window with network blocking, geometry persistence
- **preload.js**: contextBridge-only bridge, no Node integration

## Claim Ledger (from README/docs)

1. "124 character mappings" in sanitizer → need to verify actual count
2. "50,000 characters processed in under 50ms" → need to verify performance test exists and passes
3. "Network Blocking: Electron app blocks all network requests" → verify implementation
4. "Clipboard Isolation: Uses contextBridge for secure clipboard access" → verify preload
5. "No External Dependencies: Core sanitizer has zero external dependencies" → verify sanitizer.js has no imports
6. "Input Validation: Handles null, undefined, and non-string inputs gracefully" → verify
7. "Optimized for EHR system compatibility" → verify output always matches purity regex

## Audit Scope

**Files in scope:**
- src/sanitizer/sanitizer.js (core engine)
- src/sanitizer/charmap.js (character map)
- src/main/main.js (Electron main process)
- src/main/preload.js (contextBridge)
- src/renderer/app.js (UI logic)
- src/renderer/index.html (UI shell)
- src/renderer/styles/app.css, reset.css (styles)
- tests/sanitizer.test.js (unit tests)
- tests/smoke.test.js (smoke tests)
- package.json, vite.config.js, vitest.config.js (configs)

**Files out of scope:**
- dist/ (build output — review config, not artifacts)
- node_modules/ (dependencies — audited via manifest only)

## AI Failure Mode Heuristics (AI-PRIORITY checks)

- Phantom/hallucinated dependencies
- Plausible-but-wrong logic at boundaries
- Partial failures (half-wired features)
- Happy-path-only implementations
- Off-by-one errors
- Stale API usage
- Context rot (comment/code mismatch)
- Unsound type/import assumptions
- Missing edge case coverage in tests
