# Contributing to ClipSanitizer

Thank you for your interest in contributing to ClipSanitizer.

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/clipsanitizer.git
cd clipsanitizer

# Install dependencies
npm install

# Run development mode
npm run dev

# Run tests
npm test
```

### Project Structure

```
clipsanitizer/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.js     # Window, IPC, clipboard handlers
│   │   └── preload.js  # Context bridge API
│   ├── sanitizer/      # Core sanitization engine
│   │   ├── charmap.js  # Character mapping table
│   │   └── sanitizer.js # Sanitization logic
│   └── renderer/       # Frontend UI
│       ├── index.html
│       ├── app.js
│       └── styles/
├── tests/
│   ├── sanitizer.test.js
│   └── smoke.test.js
├── package.json
├── vite.config.js
└── electron-builder.config.js
```

## Development Workflow

### Running the App

```bash
# Development mode (hot reload)
npm run dev

# Run tests with watch mode
npm run test:watch
```

### Building

```bash
# Full production build
npm run build

# Renderer only
npm run build:renderer

# Main process only
npm run build:main
```

## Coding Standards

### JavaScript

- Use ES6 modules (`import`/`export`)
- Use `const` by default, `let` only when reassignment needed
- Use template literals for string interpolation
- Use arrow functions for callbacks
- Use semantic variable names in English

### Testing

- All new features require unit tests
- Test file should be named `*.test.js` and co-located in `tests/`
- Use vitest for testing framework
- Include both success and edge case tests

### Character Mappings (charmap.js)

- All Unicode→ASCII mappings go in CHARMAP array
- Each entry: `[unicodeCharOrString, asciiReplacement]`
- Mappings are applied in array order before NFKC normalization
- Use Unicode escape sequences (e.g., `\u2018`) for special characters

### Sanitizer Pipeline (sanitizer.js)

The pipeline processes in this order (order is mandatory):

1. Named substitutions from CHARMAP
2. NFKC normalization
3. Unicode whitespace variants → regular space
4. Zero-width + invisible character strip
5. C0/C1 control character removal (keep `\t`, `\n`, `\r`)
6. CRLF normalization → `\n`
7. Final strip: remove anything outside printable ASCII (32-126) + `\t\n\r`

### Change Summary

The sanitizer tracks changes using a ChangeRecord format:

```javascript
{
  category: 'quotes',      // Category identifier
  label: 'smart → straight', // Human-readable label
  count: 3                 // Number of transformations
}
```

## Adding New Character Mappings

### Step 1: Add to CHARMAP

Edit `src/sanitizer/charmap.js`:

```javascript
// Add new mapping in appropriate section
['\uXXXX', 'replacement'],  // description
```

### Step 2: Add Test Cases

Edit `tests/sanitizer.test.js`:

```javascript
test('\uXXXX description → replacement', () => {
  const { text } = sanitize('\uXXXX')
  expect(text).toBe('replacement')
  assertPurity(text)
})
```

### Step 3: Update Category Mapping

If the character belongs to a new category, add it to the `categoryMap` in `buildChangeSummary()`:

```javascript
const categoryMap = {
  // ...existing categories...
  newCategory: ['\uXXXX', '\uYYYY'],
}
```

And add a label:

```javascript
const labelMap = {
  // ...existing labels...
  newCategory: 'description of transformation',
}
```

## Pull Request Process

### Before Submitting

1. Run tests: `npm test`
2. Check linting (if configured)
3. Verify build: `npm run build`

### PR Description

- Clearly describe the change
- Include testing approach
- Note any breaking changes

## Issue Reporting

When reporting bugs, include:

1. OS and version
2. Steps to reproduce
3. Input that caused the issue
4. Expected output
5. Actual output
6. Screenshots (if applicable)

## License

By contributing to ClipSanitizer, you agree that your contributions will be licensed under the MIT License.
