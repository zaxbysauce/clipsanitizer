import { describe, test, expect } from 'vitest'
import { sanitize } from '../src/sanitizer/sanitizer.js'

// ── Helper ────────────────────────────────────────────────────────────────────
const assertPurity = (text) => {
  expect(text).toMatch(/^[\x09\x0A\x0D\x20-\x7E]*$/)
}

// ── Non-string / Empty ────────────────────────────────────────────────────────
test('non-string input returns empty', () => {
  expect(sanitize(null)).toEqual({ text: '', changes: [] })
  expect(sanitize(undefined)).toEqual({ text: '', changes: [] })
  expect(sanitize(123)).toEqual({ text: '', changes: [] })
  expect(sanitize({})).toEqual({ text: '', changes: [] })
})

test('empty string returns empty', () => {
  expect(sanitize('')).toEqual({ text: '', changes: [] })
})

// ── ASCII passthrough ─────────────────────────────────────────────────────────
test('pure ASCII passes through unchanged', () => {
  const input = 'Hello World 123 !@#$'
  const { text, changes } = sanitize(input)
  expect(text).toBe(input)
  expect(changes).toEqual([])
  assertPurity(text)
})

// ── Smart Quotes ──────────────────────────────────────────────────────────────
test('\u2018 left single quote → straight', () => {
  const { text } = sanitize('\u2018test\u2019')
  expect(text).toBe("'test'")
  assertPurity(text)
})
test('\u2019 right single quote → straight', () => {
  const { text } = sanitize("hello\u2019world")
  expect(text).toBe("hello'world")
  assertPurity(text)
})
test('\u201A single low-9 → straight', () => {
  const { text } = sanitize('test\u201Atest')
  expect(text).toBe("test'test")
  assertPurity(text)
})
test('\u201B single high-reversed-9 → straight', () => {
  const { text } = sanitize('\u201Btest')
  expect(text).toBe("'test")
  assertPurity(text)
})
test('\u201C left double quote → straight', () => {
  const { text } = sanitize('\u201CHello\u201D')
  expect(text).toBe('"Hello"')
  assertPurity(text)
})
test('\u201D right double quote → straight', () => {
  const { text } = sanitize('"Hello\u201D')
  expect(text).toBe('"Hello"')
  assertPurity(text)
})
test('\u201E double low-9 → straight', () => {
  const { text } = sanitize('\u201Etest')
  expect(text).toBe('"test')
  assertPurity(text)
})
test('\u201F double high-reversed-9 → straight', () => {
  const { text } = sanitize('\u201Ftest')
  expect(text).toBe('"test')
  assertPurity(text)
})
test('\u2039 single left-pointing angle → <', () => {
  const { text } = sanitize('\u2039')
  expect(text).toBe('<')
  assertPurity(text)
})
test('\u203A single right-pointing angle → >', () => {
  const { text } = sanitize('\u203A')
  expect(text).toBe('>')
  assertPurity(text)
})
test('\u00AB left-pointing double angle → straight', () => {
  const { text } = sanitize('\u00ABtest\u00BB')
  expect(text).toBe('"test"')
  assertPurity(text)
})
test('\u00BB right-pointing double angle → straight', () => {
  const { text } = sanitize('test\u00BB')
  expect(text).toBe('test"')
  assertPurity(text)
})

// ── Dashes ────────────────────────────────────────────────────────────────────
test('\u2013 en dash → hyphen', () => {
  const { text } = sanitize('test\u2013test')
  expect(text).toBe('test-test')
  assertPurity(text)
})
test('\u2014 em dash → double hyphen', () => {
  const { text } = sanitize('test\u2014test')
  expect(text).toBe('test--test')
  assertPurity(text)
})
test('\u2015 horizontal bar → double hyphen', () => {
  const { text } = sanitize('\u2015')
  expect(text).toBe('--')
  assertPurity(text)
})
test('\u2212 minus sign → hyphen', () => {
  const { text } = sanitize('5\u22122')
  expect(text).toBe('5-2')
  assertPurity(text)
})
test('\u00AD soft hyphen → removed', () => {
  const { text } = sanitize('soft\u00ADhyphen')
  expect(text).toBe('softhyphen')
  assertPurity(text)
})

// ── Ellipsis ──────────────────────────────────────────────────────────────────
test('\u2026 horizontal ellipsis → ...', () => {
  const { text } = sanitize('hello\u2026world')
  expect(text).toBe('hello...world')
  assertPurity(text)
})

// ── Spaces ────────────────────────────────────────────────────────────────────
test('\u00A0 no-break space → space', () => {
  const { text } = sanitize('hello\u00A0world')
  expect(text).toBe('hello world')
  assertPurity(text)
})
test('\u202F narrow no-break space → space', () => {
  const { text } = sanitize('hello\u202Fworld')
  expect(text).toBe('hello world')
  assertPurity(text)
})
test('\u2007 figure space → space', () => {
  const { text } = sanitize('hello\u2007world')
  expect(text).toBe('hello world')
  assertPurity(text)
})
test('\u2008 punctuation space → space', () => {
  const { text } = sanitize('hello\u2008world')
  expect(text).toBe('hello world')
  assertPurity(text)
})
test('\u2009 thin space → space', () => {
  const { text } = sanitize('hello\u2009world')
  expect(text).toBe('hello world')
  assertPurity(text)
})
test('\u200A hair space → space', () => {
  const { text } = sanitize('hello\u200Aworld')
  expect(text).toBe('hello world')
  assertPurity(text)
})
test('\u3000 ideographic space → space', () => {
  const { text } = sanitize('hello\u3000world')
  expect(text).toBe('hello world')
  assertPurity(text)
})

// ── Invisible / Zero-width ────────────────────────────────────────────────────
test('\u200B zero-width space → removed', () => {
  const { text } = sanitize('hello\u200Bworld')
  expect(text).toBe('helloworld')
  assertPurity(text)
})
test('\u200C zero-width non-joiner → removed', () => {
  const { text } = sanitize('hello\u200Cworld')
  expect(text).toBe('helloworld')
  assertPurity(text)
})
test('\u200D zero-width joiner → removed', () => {
  const { text } = sanitize('hello\u200Dworld')
  expect(text).toBe('helloworld')
  assertPurity(text)
})
test('\u2060 word joiner → removed', () => {
  const { text } = sanitize('hello\u2060world')
  expect(text).toBe('helloworld')
  assertPurity(text)
})
test('\uFEFF BOM at start → removed', () => {
  const { text } = sanitize('\uFEFFhello world')
  expect(text).toBe('hello world')
  assertPurity(text)
})
test('\u200E left-to-right mark → removed', () => {
  const { text } = sanitize('hello\u200Eworld')
  expect(text).toBe('helloworld')
  assertPurity(text)
})
test('\u200F right-to-left mark → removed', () => {
  const { text } = sanitize('hello\u200Fworld')
  expect(text).toBe('helloworld')
  assertPurity(text)
})
test('\u202A left-to-right embedding → removed', () => {
  const { text } = sanitize('\u202AHELLO')
  expect(text).toBe('HELLO')
  assertPurity(text)
})
test('\u202B right-to-left embedding → removed', () => {
  const { text } = sanitize('\u202BHELLO')
  expect(text).toBe('HELLO')
  assertPurity(text)
})
test('\u202C pop directional formatting → removed', () => {
  const { text } = sanitize('\u202CHELLO')
  expect(text).toBe('HELLO')
  assertPurity(text)
})
test('\u202D left-to-right override → removed', () => {
  const { text } = sanitize('\u202DHELLO')
  expect(text).toBe('HELLO')
  assertPurity(text)
})
test('\u202E right-to-left override → removed', () => {
  const { text } = sanitize('\u202EHELLO')
  expect(text).toBe('HELLO')
  assertPurity(text)
})

// ── Symbols ───────────────────────────────────────────────────────────────────
test('\u2022 bullet → hyphen', () => {
  const { text } = sanitize('\u2022 Item')
  expect(text).toBe('- Item')
  assertPurity(text)
})
test('\u2023 triangular bullet → hyphen', () => {
  const { text } = sanitize('\u2023 Item')
  expect(text).toBe('- Item')
  assertPurity(text)
})
test('\u2024 one dot leader → .', () => {
  const { text } = sanitize('\u2024')
  expect(text).toBe('.')
  assertPurity(text)
})
test('\u2025 two dot leader → ..', () => {
  const { text } = sanitize('\u2025')
  expect(text).toBe('..')
  assertPurity(text)
})
test('\u00B7 middle dot → .', () => {
  const { text } = sanitize('a\u00B7b')
  expect(text).toBe('a.b')
  assertPurity(text)
})
test('\u2219 bullet operator → .', () => {
  const { text } = sanitize('\u2219')
  expect(text).toBe('.')
  assertPurity(text)
})
test('\u2122 trademark → (TM)', () => {
  const { text } = sanitize('Test\u2122')
  expect(text).toBe('Test(TM)')
  assertPurity(text)
})
test('\u00AE registered → (R)', () => {
  const { text } = sanitize('Test\u00AE')
  expect(text).toBe('Test(R)')
  assertPurity(text)
})
test('\u00A9 copyright → (C)', () => {
  const { text } = sanitize('Test\u00A9')
  expect(text).toBe('Test(C)')
  assertPurity(text)
})
test('\u00B0 degree →  deg', () => {
  const { text } = sanitize('90\u00B0')
  expect(text).toBe('90 deg')
  assertPurity(text)
})
test('\u2103 degree celsius →  deg C', () => {
  const { text } = sanitize('\u2103')
  expect(text).toBe(' deg C')
  assertPurity(text)
})
test('\u2109 degree fahrenheit →  deg F', () => {
  const { text } = sanitize('\u2109')
  expect(text).toBe(' deg F')
  assertPurity(text)
})
test('\u00A7 section → S.', () => {
  const { text } = sanitize('\u00A7 1')
  expect(text).toBe('S. 1')
  assertPurity(text)
})
test('\u00B6 pilcrow → removed', () => {
  const { text } = sanitize('\u00B6')
  expect(text).toBe('')
  assertPurity(text)
})
test('\u2020 dagger → +', () => {
  const { text } = sanitize('\u2020')
  expect(text).toBe('+')
  assertPurity(text)
})
test('\u2021 double dagger → ++', () => {
  const { text } = sanitize('\u2021')
  expect(text).toBe('++')
  assertPurity(text)
})
test('\u2044 fraction slash → /', () => {
  const { text } = sanitize('1\u20442')
  expect(text).toBe('1/2')
  assertPurity(text)
})

// ── Fractions ─────────────────────────────────────────────────────────────────
test('\u00BD 1/2', () => { expect(sanitize('\u00BD').text).toBe('1/2') })
test('\u00BC 1/4', () => { expect(sanitize('\u00BC').text).toBe('1/4') })
test('\u00BE 3/4', () => { expect(sanitize('\u00BE').text).toBe('3/4') })
test('\u2153 1/3', () => { expect(sanitize('\u2153').text).toBe('1/3') })
test('\u2154 2/3', () => { expect(sanitize('\u2154').text).toBe('2/3') })
test('\u215B 1/8', () => { expect(sanitize('\u215B').text).toBe('1/8') })
test('\u215C 3/8', () => { expect(sanitize('\u215C').text).toBe('3/8') })
test('\u215D 5/8', () => { expect(sanitize('\u215D').text).toBe('5/8') })
test('\u215E 7/8', () => { expect(sanitize('\u215E').text).toBe('7/8') })

// ── Superscripts/subscripts ──────────────────────────────────────────────────
test('\u00B9 superscript 1', () => { expect(sanitize('\u00B9').text).toBe('1') })
test('\u00B2 superscript 2', () => { expect(sanitize('\u00B2').text).toBe('2') })
test('\u00B3 superscript 3', () => { expect(sanitize('\u00B3').text).toBe('3') })
test('\u2070 superscript 0', () => { expect(sanitize('\u2070').text).toBe('0') })
test('\u2074 superscript 4', () => { expect(sanitize('\u2074').text).toBe('4') })
test('\u2075 superscript 5', () => { expect(sanitize('\u2075').text).toBe('5') })
test('\u2076 superscript 6', () => { expect(sanitize('\u2076').text).toBe('6') })
test('\u2077 superscript 7', () => { expect(sanitize('\u2077').text).toBe('7') })
test('\u2078 superscript 8', () => { expect(sanitize('\u2078').text).toBe('8') })
test('\u2079 superscript 9', () => { expect(sanitize('\u2079').text).toBe('9') })
test('\u2080 subscript 0', () => { expect(sanitize('\u2080').text).toBe('0') })
test('\u2081 subscript 1', () => { expect(sanitize('\u2081').text).toBe('1') })
test('\u2082 subscript 2', () => { expect(sanitize('\u2082').text).toBe('2') })
test('\u2083 subscript 3', () => { expect(sanitize('\u2083').text).toBe('3') })
test('\u2084 subscript 4', () => { expect(sanitize('\u2084').text).toBe('4') })
test('\u2085 subscript 5', () => { expect(sanitize('\u2085').text).toBe('5') })
test('\u2086 subscript 6', () => { expect(sanitize('\u2086').text).toBe('6') })
test('\u2087 subscript 7', () => { expect(sanitize('\u2087').text).toBe('7') })
test('\u2088 subscript 8', () => { expect(sanitize('\u2088').text).toBe('8') })
test('\u2089 subscript 9', () => { expect(sanitize('\u2089').text).toBe('9') })

// ── Ligatures ─────────────────────────────────────────────────────────────────
test('\uFB00 ff ligature', () => { expect(sanitize('\uFB00').text).toBe('ff') })
test('\uFB01 fi ligature', () => { expect(sanitize('\uFB01').text).toBe('fi') })
test('\uFB02 fl ligature', () => { expect(sanitize('\uFB02').text).toBe('fl') })
test('\uFB03 ffi ligature', () => { expect(sanitize('\uFB03').text).toBe('ffi') })
test('\uFB04 ffl ligature', () => { expect(sanitize('\uFB04').text).toBe('ffl') })
test('\uFB05 st ligature', () => { expect(sanitize('\uFB05').text).toBe('st') })
test('\uFB06 st ligature', () => { expect(sanitize('\uFB06').text).toBe('st') })
test('\u0153 oe ligature', () => { expect(sanitize('\u0153').text).toBe('oe') })
test('\u0152 OE ligature', () => { expect(sanitize('\u0152').text).toBe('OE') })
test('\u00E6 ae', () => { expect(sanitize('\u00E6').text).toBe('ae') })
test('\u00C6 AE', () => { expect(sanitize('\u00C6').text).toBe('AE') })

// ── Arrows ───────────────────────────────────────────────────────────────────
test('\u2192 right arrow → ->', () => { expect(sanitize('\u2192').text).toBe('->') })
test('\u2190 left arrow → <-', () => { expect(sanitize('\u2190').text).toBe('<-') })
test('\u2191 up arrow → ^', () => { expect(sanitize('\u2191').text).toBe('^') })
test('\u2193 down arrow → v', () => { expect(sanitize('\u2193').text).toBe('v') })
test('\u21D2 double right arrow → =>', () => { expect(sanitize('\u21D2').text).toBe('=>') })
test('\u21D4 double arrow ↔ → <=>', () => { expect(sanitize('\u21D4').text).toBe('<=>') })

// ── Math operators ─────────────────────────────────────────────────────────────
test('\u00D7 multiplication × → x', () => { expect(sanitize('\u00D7').text).toBe('x') })
test('\u00F7 division ÷ → /', () => { expect(sanitize('\u00F7').text).toBe('/') })
test('\u00B1 plus-minus ± → +/-', () => { expect(sanitize('\u00B1').text).toBe('+/-') })
test('\u2260 not equal ≠ → !=', () => { expect(sanitize('\u2260').text).toBe('!=') })
test('\u2264 less-than or equal ≤ → <=', () => { expect(sanitize('\u2264').text).toBe('<=') })
test('\u2265 greater-than or equal ≥ → >=', () => { expect(sanitize('\u2265').text).toBe('>=') })
test('\u2248 almost equal ≈ → ~=', () => { expect(sanitize('\u2248').text).toBe('~=') })
test('\u221E infinity ∞ → inf', () => { expect(sanitize('\u221E').text).toBe('inf') })
test('\u03BC micro sign µ → u', () => { expect(sanitize('\u03BC').text).toBe('u') })
test('\u00B5 micro sign µ alt → u', () => { expect(sanitize('\u00B5').text).toBe('u') })

// ── NFKC normalization ────────────────────────────────────────────────────────
test('fi ligature NFKC → fi', () => {
  const { text } = sanitize('\uFB01')
  expect(text).toBe('fi')
  assertPurity(text)
})
test('fl ligature NFKC → fl', () => {
  const { text } = sanitize('\uFB02')
  expect(text).toBe('fl')
  assertPurity(text)
})
test('full-width ASCII NFKC → ASCII', () => {
  const { text } = sanitize('\uFF28\uFF25\uFF2C\uFF2C\uFF2F')
  expect(text).toBe('HELLO')
  assertPurity(text)
})
test('circled digit NFKC → digit', () => {
  const { text } = sanitize('\u2460')
  expect(text).toBe('1')
  assertPurity(text)
})

// ── Control characters ────────────────────────────────────────────────────────
test('C0 controls stripped (except tab/newline/cr)', () => {
  const { text } = sanitize('a\x00b\x01c\x02d')
  expect(text).toBe('abcd')
  assertPurity(text)
})
test('C1 controls stripped', () => {
  const { text } = sanitize('a\x80b')
  expect(text).toBe('ab')
  assertPurity(text)
})
test('tab preserved', () => {
  const { text } = sanitize('a\tb')
  expect(text).toBe('a\tb')
  assertPurity(text)
})
test('newline preserved', () => {
  const { text } = sanitize('a\nb')
  expect(text).toBe('a\nb')
  assertPurity(text)
})
test('carriage return normalized to newline', () => {
  const { text } = sanitize('a\rb')
  expect(text).toBe('a\nb')
  assertPurity(text)
})
test('CRLF normalized to newline', () => {
  const { text } = sanitize('a\r\nb')
  expect(text).toBe('a\nb')
  assertPurity(text)
})

// ── Change summary ─────────────────────────────────────────────────────────────
test('change summary for mixed input', () => {
  const { changes } = sanitize('\u201CHello\u201D\u2014world')
  expect(changes.length).toBeGreaterThan(0)
  const categories = changes.map(c => c.category)
  expect(categories).toContain('quotes')
  expect(categories).toContain('dashes')
})
test('empty change summary for clean input', () => {
  const { changes } = sanitize('Hello World')
  expect(changes).toEqual([])
})
test('change summary has label and count', () => {
  const { changes } = sanitize('\u2018\u2019\u201C\u201D')
  expect(changes.length).toBeGreaterThan(0)
  for (const c of changes) {
    expect(c).toHaveProperty('category')
    expect(c).toHaveProperty('label')
    expect(c).toHaveProperty('count')
    expect(typeof c.count).toBe('number')
    expect(c.count).toBeGreaterThan(0)
  }
})

// ── Output purity ─────────────────────────────────────────────────────────────
test('all output chars are pure ASCII + tab/cr/lf', () => {
  const { text } = sanitize('\u2018Hello\u2019 \u00A0world\u2026 \u2014test')
  assertPurity(text)
})
test('output purity with all categories mixed', () => {
  const mixed = '\u201C\u201D\u2013\u2014\u00A0\u2026\u2022\u00BD\u00B9\uFB01\u2192\u00D7'
  const { text } = sanitize(mixed)
  assertPurity(text)
  expect(text.length).toBeGreaterThan(0)
})

// ── Performance ────────────────────────────────────────────────────────────────
test('50k-char input processes in under 50ms', () => {
  const large = 'Hello\u2018world\u2019 '.repeat(5000)
  const start = performance.now()
  const { text } = sanitize(large)
  const elapsed = performance.now() - start
  expect(elapsed).toBeLessThan(50)
  assertPurity(text)
  expect(text.length).toBeGreaterThan(0)
})

// ── Real-world clinical text ──────────────────────────────────────────────────
test('clinical note with smart chars', () => {
  const input = 'Patient Name: O\u2019Brien, Sean\nDOB: 01\u201315\u20131985\nChief Complaint: Patient presents with shortness of breath\u2026'
  const { text } = sanitize(input)
  assertPurity(text)
  expect(text).toContain("O'Brien")
  expect(text).toContain('01-15-1985')
  expect(text).toContain('...')
})

// ── Fixture test ──────────────────────────────────────────────────────────────
test('word-sample fixture: sanitize(wordSample) === cleanExpected', async () => {
  const fs = await import('fs')
  const path = await import('path')
  const wordSample = fs.readFileSync(path.join(__dirname, 'fixtures/word-sample.txt'), 'utf8')
  const cleanExpected = fs.readFileSync(path.join(__dirname, 'fixtures/word-sample.clean.txt'), 'utf8')
  const { text } = sanitize(wordSample)
  expect(text).toBe(cleanExpected)
  assertPurity(text)
})
