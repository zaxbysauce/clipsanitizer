// src/sanitizer/charmap.js
// Each entry: [unicodeCharOrString, asciiReplacement]
// Applied in order before NFKC normalization.

export const CHARMAP = [
  // ── Word smart quotes ──────────────────────────────────────────────────────
  ['\u2018', "'"],   // left single quotation mark  '
  ['\u2019', "'"],   // right single quotation mark '
  ['\u201A', "'"],   // single low-9 quotation mark ‚
  ['\u201B', "'"],   // single high-reversed-9      ‛
  ['\u201C', '"'],   // left double quotation mark  "
  ['\u201D', '"'],   // right double quotation mark "
  ['\u201E', '"'],   // double low-9 quotation mark „
  ['\u201F', '"'],   // double high-reversed-9      ‟
  ['\u2039', '<'],   // single left-pointing angle  ‹
  ['\u203A', '>'],   // single right-pointing angle ›
  ['\u00AB', '"'],   // left-pointing double angle  «
  ['\u00BB', '"'],   // right-pointing double angle »

  // ── Dashes ─────────────────────────────────────────────────────────────────
  ['\u2013', '-'],     // en dash –
  ['\u2014', '--'],    // em dash —
  ['\u2015', '--'],    // horizontal bar ―
  ['\u2212', '-'],     // minus sign −
  ['\u2011', '-'],     // non-breaking hyphen ‑
  ['\u00AD', ''],      // soft hyphen (invisible — remove)

  // ── Ellipsis ───────────────────────────────────────────────────────────────
  ['\u2026', '...'],   // horizontal ellipsis …

  // ── Spaces and invisible ───────────────────────────────────────────────────
  ['\u00A0', ' '],     // no-break space
  ['\u202F', ' '],     // narrow no-break space
  ['\u2007', ' '],     // figure space
  ['\u2008', ' '],     // punctuation space
  ['\u2009', ' '],     // thin space
  ['\u200A', ' '],     // hair space
  ['\u3000', ' '],     // ideographic space
  ['\u200B', ''],      // zero-width space
  ['\u200C', ''],      // zero-width non-joiner
  ['\u200D', ''],      // zero-width joiner
  ['\u2060', ''],      // word joiner
  ['\uFEFF', ''],      // BOM / zero-width no-break space
  ['\u200E', ''],      // left-to-right mark
  ['\u200F', ''],      // right-to-left mark
  ['\u202A', ''],      // left-to-right embedding
  ['\u202B', ''],      // right-to-left embedding
  ['\u202C', ''],      // pop directional formatting
  ['\u202D', ''],      // left-to-right override
  ['\u202E', ''],      // right-to-left override

  // ── Typographic symbols ────────────────────────────────────────────────────
  ['\u2022', '-'],     // bullet •
  ['\u2023', '-'],     // triangular bullet ‣
  ['\u2024', '.'],     // one dot leader ․
  ['\u2025', '..'],    // two dot leader ‥
  ['\u00B7', '.'],     // middle dot ·
  ['\u2219', '.'],     // bullet operator ∙
  ['\u2122', '(TM)'],  // trade mark ™
  ['\u00AE', '(R)'],   // registered ®
  ['\u00A9', '(C)'],   // copyright ©
  ['\u00B0', ' deg'],  // degree °
  ['\u2103', ' deg C'],// degree celsius ℃
  ['\u2109', ' deg F'],// degree fahrenheit ℉
  ['\u00A7', 'S.'],    // section §
  ['\u00B6', ''],      // pilcrow ¶ (remove)
  ['\u2020', '+'],     // dagger †
  ['\u2021', '++'],    // double dagger ‡
  ['\u2044', '/'],     // fraction slash ⁄

  // ── Fractions ─────────────────────────────────────────────────────────────
  ['\u00BD', '1/2'],   // ½
  ['\u00BC', '1/4'],   // ¼
  ['\u00BE', '3/4'],   // ¾
  ['\u2153', '1/3'],   // ⅓
  ['\u2154', '2/3'],   // ⅔
  ['\u215B', '1/8'],   // ⅛
  ['\u215C', '3/8'],   // ⅜
  ['\u215D', '5/8'],   // ⅝
  ['\u215E', '7/8'],   // ⅞

  // ── Superscript/subscript digits (common in Word) ─────────────────────────
  ['\u00B9', '1'],     // superscript 1
  ['\u00B2', '2'],     // superscript 2
  ['\u00B3', '3'],     // superscript 3
  ['\u2070', '0'],     // superscript 0
  ['\u2074', '4'],     ['\u2075', '5'],  ['\u2076', '6'],
  ['\u2077', '7'],     ['\u2078', '8'],  ['\u2079', '9'],
  ['\u2080', '0'],     ['\u2081', '1'],  ['\u2082', '2'],
  ['\u2083', '3'],     ['\u2084', '4'],  ['\u2085', '5'],
  ['\u2086', '6'],     ['\u2087', '7'],  ['\u2088', '8'],  ['\u2089', '9'],

  // ── Ligatures (explicit fallback — NFKC handles most) ────────────────────
  ['\uFB00', 'ff'],    // ﬀ
  ['\uFB01', 'fi'],    // ﬁ
  ['\uFB02', 'fl'],    // ﬂ
  ['\uFB03', 'ffi'],   // ﬃ
  ['\uFB04', 'ffl'],   // ﬄ
  ['\uFB05', 'st'],    // ﬅ
  ['\uFB06', 'st'],    // ﬆ
  ['\u0153', 'oe'],    // œ
  ['\u0152', 'OE'],    // Œ
  ['\u00E6', 'ae'],    // æ
  ['\u00C6', 'AE'],    // Æ

  // ── Full-width ASCII (NFKC fallback) ─────────────────────────────────────
  ['\uFF21', 'A'],  // full-width A
  ['\uFF22', 'B'],  // full-width B
  ['\uFF23', 'C'],  // full-width C
  ['\uFF24', 'D'],  // full-width D
  ['\uFF25', 'E'],  // full-width E
  ['\uFF26', 'F'],  // full-width F
  ['\uFF27', 'G'],  // full-width G
  ['\uFF28', 'H'],  // full-width H
  ['\uFF29', 'I'],  // full-width I
  ['\uFF2A', 'J'],  // full-width J
  ['\uFF2B', 'K'],  // full-width K
  ['\uFF2C', 'L'],  // full-width L
  ['\uFF2D', 'M'],  // full-width M
  ['\uFF2E', 'N'],  // full-width N
  ['\uFF2F', 'O'],  // full-width O
  ['\uFF30', 'P'],  // full-width P
  ['\uFF31', 'Q'],  // full-width Q
  ['\uFF32', 'R'],  // full-width R
  ['\uFF33', 'S'],  // full-width S
  ['\uFF34', 'T'],  // full-width T
  ['\uFF35', 'U'],  // full-width U
  ['\uFF36', 'V'],  // full-width V
  ['\uFF37', 'W'],  // full-width W
  ['\uFF38', 'X'],  // full-width X
  ['\uFF39', 'Y'],  // full-width Y
  ['\uFF3A', 'Z'],  // full-width Z
  ['\uFF41', 'a'],  // full-width a
  ['\uFF42', 'b'],  // full-width b
  ['\uFF43', 'c'],  // full-width c
  ['\uFF44', 'd'],  // full-width d
  ['\uFF45', 'e'],  // full-width e
  ['\uFF46', 'f'],  // full-width f
  ['\uFF47', 'g'],  // full-width g
  ['\uFF48', 'h'],  // full-width h
  ['\uFF49', 'i'],  // full-width i
  ['\uFF4A', 'j'],  // full-width j
  ['\uFF4B', 'k'],  // full-width k
  ['\uFF4C', 'l'],  // full-width l
  ['\uFF4D', 'm'],  // full-width m
  ['\uFF4E', 'n'],  // full-width n
  ['\uFF4F', 'o'],  // full-width o
  ['\uFF50', 'p'],  // full-width p
  ['\uFF51', 'q'],  // full-width q
  ['\uFF52', 'r'],  // full-width r
  ['\uFF53', 's'],  // full-width s
  ['\uFF54', 't'],  // full-width t
  ['\uFF55', 'u'],  // full-width u
  ['\uFF56', 'v'],  // full-width v
  ['\uFF57', 'w'],  // full-width w
  ['\uFF58', 'x'],  // full-width x
  ['\uFF59', 'y'],  // full-width y
  ['\uFF5A', 'z'],  // full-width z
  ['\uFF10', '0'],  // full-width 0
  ['\uFF11', '1'],  // full-width 1
  ['\uFF12', '2'],  // full-width 2
  ['\uFF13', '3'],  // full-width 3
  ['\uFF14', '4'],  // full-width 4
  ['\uFF15', '5'],  // full-width 5
  ['\uFF16', '6'],  // full-width 6
  ['\uFF17', '7'],  // full-width 7
  ['\uFF18', '8'],  // full-width 8
  ['\uFF19', '9'],  // full-width 9

  // ── Arrows (common in clinical documentation) ────────────────────────────
  ['\u2192', '->'],    // →
  ['\u2190', '<-'],    // ←
  ['\u2191', '^'],     // ↑
  ['\u2193', 'v'],     // ↓
  ['\u21D2', '=>'],    // ⇒
  ['\u21D4', '<=>'],   // ⇔

  // ── Math operators (appear in clinical notes) ────────────────────────────
  ['\u00D7', 'x'],     // multiplication sign ×
  ['\u00F7', '/'],     // division sign ÷
  ['\u00B1', '+/-'],   // plus-minus ±
  ['\u2260', '!='],    // not equal ≠
  ['\u2264', '<='],    // less-than or equal ≤
  ['\u2265', '>='],    // greater-than or equal ≥
  ['\u2248', '~='],    // almost equal ≈
  ['\u221E', 'inf'],   // infinity ∞
  ['\u03BC', 'u'],     // micro sign µ / lowercase mu (medication dosing)
  ['\u00B5', 'u'],     // micro sign µ (alt codepoint)
]
