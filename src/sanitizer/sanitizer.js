// src/sanitizer/sanitizer.js
import { CHARMAP } from './charmap.js'

/**
 * sanitize(input)
 *
 * Returns { text: string, changes: ChangeRecord[] }
 *
 * ChangeRecord: { category: string, label: string, count: number }
 *
 * Pipeline (order is mandatory):
 *  1. Named substitutions from CHARMAP
 *  2. NFKC normalization
 *  3. Unicode whitespace variants → regular space
 *  4. Zero-width + invisible char strip
 *  5. C0/C1 control char removal (keep \t \n \r)
 *  6. CRLF normalization → \n
 *  7. Final strip: remove anything outside printable ASCII (32-126) + \t\n\r
 */
export function sanitize(input) {
  if (typeof input !== 'string') return { text: '', changes: [] }
  if (input.length === 0) return { text: '', changes: [] }

  let text = input
  const changeCounts = new Map()

  // ── Step 1: Named substitutions ────────────────────────────────────────────
  for (const [from, to] of CHARMAP) {
    if (!text.includes(from)) continue
    const before = text
    text = text.split(from).join(to)
    if (text !== before) {
      const count = (before.split(from).length - 1)
      const key = `${from}→${to}`
      changeCounts.set(key, (changeCounts.get(key) ?? 0) + count)
    }
  }

  // ── Step 2: NFKC normalization ─────────────────────────────────────────────
  const beforeNFKC = text
  text = text.normalize('NFKC')
  if (text !== beforeNFKC) {
    changeCounts.set('nfkc_normalize', 1)
  }

  // ── Step 3: Unicode whitespace → regular space ────────────────────────────
  const wsRegex = /[\u1680\u2000-\u200A\u205F\u3000]/g
  text = text.replace(wsRegex, ' ')

  // ── Step 4: C0/C1 control characters (keep \t \n \r) ─────────────────────
  const ctrlBefore = text
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x80-\x9F]/g, '')
  if (text !== ctrlBefore) {
    changeCounts.set('control_chars_removed', 1)
  }

  // ── Step 5: Normalize line endings → \n ───────────────────────────────────
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // ── Step 6: Final strip — remove anything outside printable ASCII ──────────
  const finalBefore = text
  text = text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
  if (text !== finalBefore) {
    changeCounts.set('final_strip', 1)
  }

  // ── Build change summary ───────────────────────────────────────────────────
  const changes = buildChangeSummary(changeCounts)

  return { text, changes }
}

/**
 * buildChangeSummary
 * Converts internal change map into human-readable records grouped by category.
 */
function buildChangeSummary(changeCounts) {
  if (changeCounts.size === 0) return []

  const categoryMap = {
    quotes:       ['\u2018', '\u2019', '\u201A', '\u201B', '\u201C', '\u201D', '\u201E', '\u201F', '\u2039', '\u203A', '\u00AB', '\u00BB'],
    dashes:       ['\u2013', '\u2014', '\u2015', '\u2212', '\u00AD'],
    ellipsis:     ['\u2026'],
    spaces:       ['\u00A0', '\u202F', '\u2007', '\u2008', '\u2009', '\u200A', '\u3000'],
    invisible:    ['\u200B', '\u200C', '\u200D', '\u2060', '\uFEFF', '\u200E', '\u200F', '\u202A', '\u202B', '\u202C', '\u202D', '\u202E'],
    symbols:      ['\u2022', '\u2023', '\u2024', '\u2025', '\u00B7', '\u2122', '\u00AE', '\u00A9', '\u00B0', '\u2124', '\u212A', '\u00A7', '\u00B6', '\u2020', '\u2021', '\u2044'],
    fractions:    ['\u00BD', '\u00BC', '\u00BE', '\u2153', '\u2154', '\u215B', '\u215C', '\u215D', '\u215E'],
    superscript:  ['\u00B9', '\u00B2', '\u00B3', '\u2070', '\u2074', '\u2075', '\u2076', '\u2077', '\u2078', '\u2079', '\u2080', '\u2081', '\u2082', '\u2083', '\u2084', '\u2085', '\u2086', '\u2087', '\u2088', '\u2089'],
    ligatures:    ['\uFB00', '\uFB01', '\uFB02', '\uFB03', '\uFB04', '\uFB05', '\uFB06', '\u0153', '\u0152', '\u00E6', '\u00C6'],
    arrows:       ['\u2192', '\u2190', '\u2191', '\u2193', '\u21D2', '\u21D4'],
    math:         ['\u00D7', '\u00F7', '\u00B1', '\u2260', '\u2264', '\u2265', '\u2248', '\u221E', '\u03BC', '\u00B5'],
  }

  const labelMap = {
    quotes:      'smart quotes → straight',
    dashes:      'dashes → hyphen(s)',
    ellipsis:    'ellipsis → ...',
    spaces:      'non-standard spaces → space',
    invisible:   'invisible characters removed',
    symbols:     'typographic symbols converted',
    fractions:   'fraction characters converted',
    superscript: 'superscript/subscript digits flattened',
    ligatures:   'ligatures expanded',
    arrows:      'arrow characters converted',
    math:        'math symbols converted',
    nfkc_normalize: 'NFKC normalization applied',
    control_chars_removed: 'control characters removed',
    final_strip: 'remaining non-ASCII characters stripped',
  }

  const categoryCounts = {}

  for (const [key, count] of changeCounts.entries()) {
    if (key === 'nfkc_normalize' || key === 'control_chars_removed' || key === 'final_strip') {
      if (!categoryCounts[key]) categoryCounts[key] = 0
      categoryCounts[key] += count
      continue
    }
    const from = key.split('→')[0]
    let matched = false
    for (const [cat, chars] of Object.entries(categoryMap)) {
      if (chars.includes(from)) {
        if (!categoryCounts[cat]) categoryCounts[cat] = 0
        categoryCounts[cat] += count
        matched = true
        break
      }
    }
    if (!matched) {
      if (!categoryCounts['final_strip']) categoryCounts['final_strip'] = 0
      categoryCounts['final_strip'] += count
    }
  }

  return Object.entries(categoryCounts)
    .filter(([, count]) => count > 0)
    .map(([category, count]) => ({
      category,
      label: labelMap[category] ?? category,
      count,
    }))
}
