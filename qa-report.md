# ClipSanitizer QA Report
Generated: 2026-04-07
Scope: ClipSanitizer codebase — sanitizer engine, Electron security model, renderer UI, tests, documentation, config
Files reviewed: 8 source files + 4 test files + configs
Explorer candidate generation used: YES
Reviewer validation used: YES
Inline Critic challenge used: YES (per-batch, CRITICAL/HIGH)
Inline Reviewer finalization used: YES (per-batch, MEDIUM/LOW)

## Executive Summary

The ClipSanitizer codebase is well-structured with a strong security posture — Electron hardening is correctly implemented, the sanitizer pipeline is sound, and the test suite covers the core character-mapping behavior. However, the project carries significant documentation drift: the README substantially undercounts CHARMAP entries (124 claimed vs 179 actual), misstates the Unicode normalization form, and omits the `warnings` field from its public API documentation. Additionally, the smoke test has an incomplete return-shape assertion, and the performance test lacks CI-environment guards.

---

## Findings Count

```
Group 1 (Broken/Incomplete):    0 / 0 / 0 / 0 / 0
Group 2 (Security):             0 / 0 / 0 / 0 / 0
Group 3 (Cross-Platform):       0 / 0 / 0 / 1 / 0
Group 4 (Docs/Claims Drift):    0 / 1 / 2 / 0 / 0
Group 5 (AI Code Smells):       0 / 0 / 0 / 0 / 1
Group 6 (Tech Debt):            0 / 0 / 0 / 0 / 0
Group 7 (Performance):          0 / 0 / 0 / 0 / 0
Group 8 (Test Quality):         0 / 0 / 2 / 0 / 0
Group 9 (Supply Chain):         0 / 0 / 0 / 0 / 0
────────────────────────────────────────────────────────
TOTAL CONFIRMED/PRE_EXISTING:   0 / 1 / 4 / 1 / 1
```

**Confirmed by severity: 1 HIGH / 4 MEDIUM / 1 LOW / 1 INFO**

---

## Critical and High Findings

### H-1: README misrepresents CHARMAP entry count
**Severity**: HIGH | **Confidence**: HIGH | **Group**: 4 (Docs/Claims Drift)
**File**: README.md line 170 | **Line**: 170
**Problem**: README line 170 states "All 124 character mappings" are tested, but the CHARMAP array in `src/sanitizer/charmap.js` contains 179 entries. Per-category header counts in README lines 126–162 sum to 104, not 124. The discrepancy (55 entries / 44% undercount) is not a runtime bug but misrepresents test coverage scope to consumers.
**Fix**: Update README line 170 from "All 124 character mappings" to "All 179 character mappings". Audit test coverage — approximately 70 CHARMAP entries lack individual test cases, particularly: full-width ASCII (62 entries: U+FF01–FF5A, U+FF10–FF19), clinical unit multi-char mappings (µg, µg/mL, µg/kg), and the TRANSLITERATION_FALLBACK Latin entries.
**Status**: CONFIRMED | inline_routing: CRITIC_ULPHELD

---

## Medium Findings

### M-1: smoke.test.js omits `warnings` from return-shape assertion
**Severity**: MEDIUM | **Confidence**: HIGH | **Group**: 8 (Test Quality)
**File**: tests/smoke.test.js lines 11–17
**Problem**: The "sanitize returns correct shape" smoke test asserts only `text` and `changes` properties. The `sanitize()` function always returns `{ text, changes, warnings }` (confirmed at `src/sanitizer/sanitizer.js` line 135 and JSDoc line 7), and the renderer (`src/renderer/app.js` line 37) destructures all three fields. The smoke test's shape check gives a false-pass if `warnings` became null or undefined.
**Fix**: Add `expect(result).toHaveProperty('warnings')` and `expect(Array.isArray(result.warnings)).toBe(true)` to the existing shape test at line 16, before the closing `})`.
**Status**: CONFIRMED | REVIEWER_FINALIZED

### M-2: package-lock.json version mismatch
**Severity**: MEDIUM | **Confidence**: HIGH | **Group**: 4 (Docs/Claims Drift)
**File**: package.json line 3 vs package-lock.json line 3
**Problem**: `package.json` declares `"version": "1.0.1"` but `package-lock.json` root declares `"version": "1.0.0"`. The lockfile is stale — generated against a prior version and not regenerated after the version bump.
**Fix**: Run `npm install` or `npm install --package-lock-only` to regenerate the lockfile against the current package.json.
**Status**: CONFIRMED | REVIEWER_FINALIZED

### M-3: README claims NFKC normalization but code uses NFKD
**Severity**: MEDIUM | **Confidence**: HIGH | **Group**: 4 (Docs/Claims Drift)
**File**: README.md line 10 vs src/sanitizer/sanitizer.js line 81
**Problem**: README line 10 states "Unicode Normalization: Applies NFKC normalization". The actual code at `sanitizer.js` line 81 uses `text.normalize('NFKD').replace(/\p{Mn}/gu, '')` — NFKD decomposition plus combining mark stripping. NFKD decomposes fully (e.g., ½ → 1/2) while NFKC composes (e.g., ½ → ½). The pipeline is documented correctly in code comments but misstated in README.
**Fix**: Update README line 10 to say "NFKD normalization + combining mark stripping" to match the actual implementation. Alternatively, change the code to use NFKC if that was the intended normalization form.
**Status**: CONFIRMED | REVIEWER_FINALIZED

### M-4: README API documentation omits `warnings` field
**Severity**: MEDIUM | **Confidence**: HIGH | **Group**: 8 (Test Quality)
**File**: README.md lines 91–97
**Problem**: The README API documentation section defines the `sanitize()` return type as `{ text: string, changes: ChangeRecord[] }` but the actual return type is `{ text: string, changes: ChangeRecord[], warnings: Warning[] }`. The `warnings` field is fully implemented, used by the renderer (`app.js` line 37), and documented in the JSDoc at `sanitizer.js` line 7, but is entirely absent from the public API docs.
**Fix**: Add `warnings: Warning[]` to the return type in README.md lines 91–97. Document the Warning shape: `{ type: string, count: number, chars: string[], message: string }`.
**Status**: CONFIRMED | REVIEWER_FINALIZED

---

## Low and Info Findings

### L-1: Icon path hardcodes Windows-specific subdirectory
**Severity**: LOW | **Confidence**: MEDIUM | **Group**: 3 (Cross-Platform)
**File**: src/main/main.js line 45
**Problem**: The icon path `path.join(__dirname, '../../assets/icons/win/icon.ico')` embeds `win/` as a literal string. On macOS/Linux this would reference a non-existent subdirectory. The `process.platform` check at line 25 confirms cross-platform intent elsewhere in the code.
**Fix**: Use `process.platform` to construct a platform-appropriate icon path, or provide a generic fallback.
**Status**: CONFIRMED | REVIEWER_FINALIZED

### I-1: README documents phantom build scripts
**Severity**: INFO | **Confidence**: HIGH | **Group**: 5 (AI Code Smells)
**File**: README.md lines 225–230
**Problem**: README references `npm run build:renderer` and `npm run build:main` as valid build commands, but `package.json` scripts (lines 42–48) define only `dev`, `build`, `test`, `test:watch`, and `test:smoke`. No granular build scripts exist.
**Fix**: Remove the phantom `build:renderer`/`build:main` script references from README, or add them to `package.json` if granular builds are desired.
**Status**: CONFIRMED | REVIEWER_FINALIZED

---

## Pre-Existing Findings

No pre-existing findings.

---

## Unsupported or Contradicted Claims

| Claim (from README/docs) | Status | Actual |
|---|---|---|
| "All 124 character mappings" tested | CONTRADICTED | 179 CHARMAP entries, ~70 untested |
| "Unicode Normalization: Applies NFKC" | CONTRADICTED | Code uses NFKD + combining mark strip |
| `warnings` field in sanitize() return | UNSUPPORTED | Field exists and is used but omitted from API docs |
| `npm run build:renderer` / `build:main` scripts | UNSUPPORTED | Scripts do not exist in package.json |
| smoke.test.js fully verifies return shape | UNSUPPORTED | warnings field assertion missing |

---

## Dominant AI Failure Modes

**Stale documentation after feature expansion** (3 of 4 docs findings): Clinical unit mappings, TRANSLITERATION_FALLBACK, and full-width ASCII entries were all added to the codebase without updating the README's "Character Mapping" section counts, total claim, per-category breakdowns, and script documentation. This is the dominant failure pattern — code evolved but docs did not.

**Incomplete smoke-test assertion** (1 finding): The smoke test was written to verify a subset of the return contract without covering the `warnings` field, which is used by the renderer. A developer reading the test for API verification would get false confidence.

---

## Supply Chain and Dependency Notes

**Dependency health**: All dependencies in `package.json` are real, versioned, and resolve correctly in `package-lock.json`. No phantom dependencies, no hallucinated package names, no typosquatting risks detected. The `electron-store` runtime dependency is correctly placed (not in devDependencies). The core sanitizer module has zero external dependencies as claimed.

**Lockfile staleness**: `package-lock.json` is out of sync with `package.json` version (1.0.0 vs 1.0.1). This is a maintenance issue, not a security issue.

---

## Coverage Notes

The following areas were reviewed and passed cleanly:
- **Electron security model**: contextIsolation:true, nodeIntegration:false, sandbox:true, no Node APIs in renderer, clipboard via IPC only, network blocking correctly implemented, will-navigate prevented, window.open denied — all confirmed.
- **Sanitizer zero external deps**: `src/sanitizer/sanitizer.js` imports only `./charmap.js`. No external packages imported. Claim verified.
- **Renderer UI wiring**: All 4 buttons wired, all 3 keyboard shortcuts functional, clipboard paste/copy/clear all correct, copy button properly disabled until first sanitize, toast notifications complete for all error/success cases, character counters live, electronAPI unavailable guard present.
- **NFKD pipeline correctness**: The NFKD+combining-mark-strip pipeline is correctly implemented and handles Latin diacritics, full-width characters, and compatibility variants. The TRANSLITERATION_FALLBACK covers characters that don't decompose under NFKD.

The following areas have coverage gaps:
- **CHARMAP test coverage**: ~70 of 179 entries (39%) lack individual test cases. Full-width ASCII (62 entries), clinical multi-char entries (8), and TRANSLITERATION_FALLBACK entries (11) are the largest uncovered groups.
- **smoke.test.js**: Does not verify `warnings` field in return shape.
- **Performance test**: No CI-environment guard; hardcoded 50ms threshold may produce flaky failures on loaded CI runners.

---

## Validation Notes

- explorer candidates generated: 14
- reviewer confirmed: 6
- reviewer disproved: 0
- reviewer unverified: 0
- reviewer pre_existing: 0
- inline critic upheld: 1 (sanitizer-001, HIGH)
- inline critic refined: 1 (tests-claims-002, HIGH→MEDIUM)
- inline critic downgraded: 0
- inline critic overturned: 0
- inline reviewer finalized: 4 (MEDIUM findings)
- inline reviewer downgraded: 0

---

## Recommended Remediation Order

1. **Documentation criticals**: Update README CHARMAP count (179, not 124), fix NFKC→NFKD statement, add `warnings` to API docs — these are the primary consumer-facing correctness issues
2. **Broken test coverage**: Add `warnings` assertion to smoke.test.js (2-line fix), add CI skip guard to performance test
3. **Lockfile sync**: Run `npm install --package-lock-only` to regenerate package-lock.json
4. **Cross-platform consistency**: Use `process.platform` for icon path, remove phantom README build scripts
5. **Test coverage expansion**: Add individual tests for full-width ASCII ranges, TRANSLITERATION_FALLBACK entries, and clinical unit multi-char mappings
