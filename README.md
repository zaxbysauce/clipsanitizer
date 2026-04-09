# ClipSanitizer

A desktop application that sanitizes clipboard text for EHR (Electronic Health Record) compatibility by converting smart characters, typographic symbols, and non-standard whitespace to plain ASCII equivalents.

## Features

- **Smart Character Conversion**: Converts smart quotes, dashes, ellipsis, and other typographic symbols to standard ASCII
- **Whitespace Normalization**: Handles non-breaking spaces, figure spaces, thin spaces, and other Unicode whitespace variants
- **Invisible Character Removal**: Strips zero-width spaces, word joiners, and other invisible formatting characters
- **Unicode Normalization**: Applies NFKC normalization to handle full-width characters and compatibility variants
- **Control Character Filtering**: Removes C0/C1 control characters while preserving tabs, newlines, and carriage returns
- **Change Tracking**: Provides detailed change summaries showing what transformations were applied
- **Performance Optimized**: Handles large text inputs efficiently with streaming-friendly processing
- **Cross-Platform Web Version**: Single-file HTML5 standalone build for browser usage

## Installation

### Prerequisites

**For Development:**
- Node.js 18+ and npm
- Git
- Electron 33 (included as devDependency)

**For Web Version:**
- Any modern web browser (Chrome, Firefox, Safari, Edge)
- No installation required - runs in browser

### Build from Source

```bash
git clone https://github.com/your-org/clipsanitizer.git
cd clipsanitizer
npm install

# Build Electron desktop application
npm run build

# Build HTML5 standalone version
npm run build:web    # Build web version
npm run build:copy-web # Copy to dist/
```

### Run in Development

```bash
npm run dev
```

### Built Application

After building, the applications will be available in the `dist/` directory as:

**Electron Desktop Application:**
- Windows: `dist/ClipSanitizer Setup 1.1.0.exe` (installer)
- Windows: `dist/ClipSanitizerPortable.exe` (portable version)

**HTML5 Standalone Web Application:**
- `dist/ClipSanitizer-web.html` (standalone single-file HTML5 version)
  - Double-click to open in any modern browser
  - No installation required
  - Works on Windows, macOS, Linux, and mobile devices

## HTML5 Standalone Build

ClipSanitizer now includes a standalone HTML5 version that runs in any modern web browser without requiring Electron installation.

### Building the Web Version

```bash
npm run build:web    # Build web version
npm run build:copy-web # Copy web artifact to dist/
```

### Web Version Features

- **Single File**: Complete application bundled into one HTML file with inline CSS and JavaScript
- **No Dependencies**: Runs in any modern browser without external dependencies
- **Cross-Platform**: Works on Windows, macOS, Linux, and mobile devices
- **Clipboard Access**: Uses `navigator.clipboard` API for clipboard operations
- **Same Core Engine**: Uses identical sanitization logic as the Electron version
- **Permission Handling**: Graceful handling of clipboard permission denials

### Using the Web Version

1. Open `dist/ClipSanitizer-web.html` in any web browser
2. The interface is identical to the Electron version
3. Paste text in the left pane, click "Sanitize", and copy from the right pane
4. **Browser Permission**: First use may require clipboard permission

### Differences from Electron Version

- **Storage**: No local storage - clipboard is the only input/output method
- **Keyboard Shortcuts**: Browser security may limit some shortcuts
- **File Size**: Larger file size due to inline resources (~2MB)
- **Performance**: Slightly slower startup but identical processing speed

### Deployment Options

The web version can be deployed as:
- **Local File**: Double-click `ClipSanitizer-web.html` to open in browser
- **Web Server**: Host on any static web server
- **Email Attachment**: Send as attachment for easy sharing

## Usage

### Web Version Usage

Open `dist/ClipSanitizer-web.html` in any modern web browser for immediate use without installation:

1. **Open**: Double-click the file or open it in your browser
2. **Paste**: Text into the left pane (requires clipboard permission on first use)
3. **Sanitize**: Click "Sanitize" to clean the text
4. **Copy**: Click "Copy to clipboard" to copy the cleaned text
5. **Clear**: Use "Clear" to reset both panes

### Basic Usage

The application runs as a desktop app with two panes:

1. **Left Pane**: Paste or type text containing smart characters
2. **Click "Sanitize"**: Converts the text to plain ASCII
3. **Right Pane**: Displays sanitized text ready for EHR systems
4. **Copy**: Click "Copy" to copy sanitized text to clipboard
5. **Clear**: Click "Clear" to reset both panes

### Keyboard Shortcuts

- `Ctrl+Shift+S`: Sanitize text
- `Ctrl+Shift+X`: Clear both panes
- `Ctrl+Shift+C`: Copy sanitized text to clipboard

### Integration with EHR Systems

The sanitized output is guaranteed to contain only:
- Printable ASCII characters (32-126)
- Tab (`\t`)
- Newline (`\n`)
- Carriage return (`\r`)

This ensures compatibility with legacy EHR systems that may not handle Unicode characters properly.

## API

### Sanitizer Module

The core sanitization logic is available as a standalone module:

```javascript
import { sanitize } from './src/sanitizer/sanitizer.js'

const result = sanitize('Text with smart “quotes” and —dashes—')
console.log(result.text)    // "Text with smart \"quotes\" and --dashes--"
console.log(result.changes) // Array of change records
```

#### sanitize(input)

**Parameters:**
- `input` (string): Text to sanitize

**Returns:**
```typescript
{
  text: string,           // Sanitized text containing only printable ASCII + \t\n\r
  changes: ChangeRecord[] // Array of transformation records
}
```

#### ChangeRecord

```typescript
{
  category: string, // Transformation category (quotes, dashes, ellipsis, etc.)
  label: string,    // Human-readable description of the transformation
  count: number     // Number of occurrences transformed
}
```

#### Categories

- `quotes`: Smart quotes ‘’“” converted to straight quotes
- `dashes`: En/em dashes –— converted to hyphens
- `ellipsis`: Horizontal ellipsis … converted to ...
- `spaces`: Non-standard spaces    converted to regular space
- `invisible`: Zero-width and invisible characters removed
- `symbols`: Typographic symbols converted (trademark, copyright, etc.)
- `fractions`: Fraction characters converted to numeric form
- `superscript`: Superscript/subscript digits flattened
- `ligatures`: Ligatures expanded (fi, fl, etc.)
- `arrows`: Arrow characters converted to ASCII equivalents
- `math`: Mathematical symbols converted to ASCII
- `nfkc_normalize`: Unicode normalization applied
- `control_chars_removed`: Control characters removed
- `final_strip`: Remaining non-ASCII characters stripped

## Version History

### v1.1.0
- **HTML5 Standalone Build**: Added single-file web version for browser-based usage
- **Cross-Platform Deployment**: Web version works on any OS with modern browser
- **Browser Clipboard API**: Uses navigator.clipboard with permission handling
- **No Electron Required**: Web version runs without Electron installation
- **Same Core Engine**: Identical sanitization logic across all platforms

### v1.0.0
- Initial release with Electron desktop application
- Complete character mapping for EHR compatibility
- .docx file support via mammoth.js
- Comprehensive testing and performance optimization

## Character Mapping

The sanitizer includes comprehensive character mapping covering:

### Smart Quotes (12 mappings)
- ‘’‚‛“”„‟‹›«» → straight quotes and angle brackets

### Dashes (4 mappings)
- –—―− → hyphen(s)

### Ellipsis (1 mapping)
- … → ...

### Spaces and Invisible (19 mappings)
-       　 → space
- ​‌‍⁠﻿‎‏‪‫‬‭‮ → removed

### Typographic Symbols (13 mappings)
- •‣․‥·∙ → hyphen or period
- ™®© → (TM), (R), (C)
- °℃℉ → degree notation
- §¶†‡⁄ → section markers or operators

### Fractions (9 mappings)
- ½¼¾⅓⅔⅛⅜⅝⅞ → numeric fractions

### Superscript/Subscript (22 mappings)
- ¹²³⁰⁴-₉₀-₉ → numeric digits

### Ligatures (10 mappings)
- ﬀ-ﬆœŒæÆ → expanded letter sequences

### Arrows (6 mappings)
- →←↑↓⇒⇔ → ->, <-, ^, v, =>, <=>

### Math Operators (8 mappings)
- ×÷±≠≤≥≈∞μµ → mathematical notation

## Testing

### Unit Tests

The sanitizer includes comprehensive unit tests covering:

- All 124 character mappings
- NFKC normalization scenarios
- Control character handling
- Edge cases and error conditions
- Performance benchmarks (50k characters ≤ 50ms)
- Real-world clinical text examples

### Running Tests

```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:smoke         # Run smoke tests only
```

## Performance

- **Large Text**: 50,000 characters processed in under 50ms
- **Memory Efficient**: Stream-friendly processing without excessive memory allocation
- **Optimized Pipeline**: Ordered transformations minimize redundant processing
- **Early Exit**: Empty and non-string inputs return immediately

## Security

- **Network Blocking**: Electron app blocks all network requests for security
- **Clipboard Isolation**: Uses contextBridge for secure clipboard access
- **No External Dependencies**: Core sanitizer has zero external dependencies
- **Input Validation**: Handles null, undefined, and non-string inputs gracefully

## Development & Architecture

### Project Structure

```
clipsanitizer/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.js     # Main process entry point
│   │   └── preload.js  # Secure preload script (contextBridge)
│   ├── renderer/       # Frontend UI code
│   │   ├── index.html          # Electron renderer entry point
│   │   ├── index.web.html      # Web version entry point
│   │   ├── app.js              # Electron app logic
│   │   ├── app.web.js          # Web app logic
│   │   ├── ...                 # UI components
│   │   └── styles/             # Shared CSS styles
│   └── sanitizer/      # Core sanitization logic
│       ├── charmap.js  # Character mapping table
│       └── sanitizer.js # Sanitization engine
├── scripts/            # Build scripts
│   └── copy-web-artifact.js    # Web build artifact copying
├── dist/               # Build output
├── tests/              # Test files
├── vite.config.js      # Vite + Electron plugin config
├── vite.config.web.js  # Web version Vite config
├── electron-builder.config.js # Packaging config
└── vitest.config.js    # Test runner config
```

### Build Commands

```bash
npm run dev               # Development mode with hot reload (Vite + Electron)
npm run build:renderer    # Build renderer process only
npm run build:main        # Build main process only
npm run build             # Full build (renderer + main + electron-builder)
npm run build:web         # Build HTML5 standalone version
npm run build:copy-web    # Copy web artifact to dist/
```

### Development Setup

The project uses Vite with `vite-plugin-electron` for a fast development experience:

- **Renderer**: Built with Vite, served from `src/renderer/`, outputs to `dist/renderer/`
- **Main Process**: Bundled via Vite plugin, outputs to `dist/main/`
- **Preload**: Secure context bridge script, bundled alongside main process
- **Hot Reload**: Changes to renderer code trigger automatic browser reload

The main configuration in `vite.config.js` handles:
- Main process bundling (`src/main/main.js` → `dist/main/main.js`)
- Preload script bundling (`src/main/preload.js` → `dist/main/preload.js`)
- Renderer build (`src/renderer/` → `dist/renderer/`)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please see CONTRIBUTING.md for guidelines on how to contribute to this project.

## Acknowledgments

- Based on Unicode Standard for character mapping
- Optimized for EHR system compatibility
- Designed for clinical documentation workflows