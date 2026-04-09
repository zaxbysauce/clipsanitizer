const { app, BrowserWindow, ipcMain, clipboard } = require('electron')
const path = require('path')
const Store = require('electron-store')
const mammoth = require('mammoth')

// Window geometry persistence
const store = new Store({ name: 'window-geometry' })

// Low-end hardware optimizations
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-software-rasterizer')
app.commandLine.appendSwitch('disable-smooth-scrolling')
app.disableHardwareAcceleration()

// Reduce Chromium overhead for low-end machines
app.commandLine.appendSwitch('disable-background-networking')
app.commandLine.appendSwitch('disable-default-apps')
app.commandLine.appendSwitch('disable-extensions')
app.commandLine.appendSwitch('disable-sync')
app.commandLine.appendSwitch('metrics-recording-only')
app.commandLine.appendSwitch('no-first-run')
app.commandLine.appendSwitch('safebrowsing-disable-auto-update')

function getWindowGeometry() {
  const defaults = { width: 960, height: 560, x: undefined, y: undefined }
  if (process.platform !== 'win32') return defaults
  const saved = store.get('geometry')
  return saved ? { ...defaults, ...saved } : defaults
}

function saveWindowGeometry(win) {
  if (!win || win.isDestroyed()) return
  const bounds = win.getBounds()
  store.set('geometry', { width: bounds.width, height: bounds.height, x: bounds.x, y: bounds.y })
}

function createWindow() {
  const geo = getWindowGeometry()
  const win = new BrowserWindow({
    ...geo,
    minWidth: 700,
    minHeight: 420,
    show: false,
    backgroundColor: '#1C1B19',
    title: 'ClipSanitizer',
    icon: path.join(__dirname, '../../assets/icons/win/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      backgroundThrottling: false,
    }
  })

  // Prevent white flash — show only when fully rendered
  win.once('ready-to-show', () => {
    win.show()
  })

  // Save geometry on resize/move
  win.on('resize', () => saveWindowGeometry(win))
  win.on('move', () => saveWindowGeometry(win))

  // Block all navigation away from the app
  win.webContents.on('will-navigate', (e) => e.preventDefault())
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  // Block all network requests (air-gap enforcement)
  // Network block events logged to console (dev mode only, no persistent file logging)
  win.webContents.session.webRequest.onBeforeRequest(
    { urls: ['http://*/*', 'https://*/*', 'ftp://*/*'] },
    (details, callback) => {
      if (!app.isPackaged) {
        console.warn('[ClipSanitizer] Blocked network request:', details.url)
      }
      callback({ cancel: true })
    }
  )

  if (!app.isPackaged) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// IPC: read clipboard
ipcMain.handle('clipboard:read', () => clipboard.readText())

// IPC: write clipboard
ipcMain.handle('clipboard:write', (_event, text) => {
  if (typeof text !== 'string') return false
  clipboard.writeText(text)
  return true
})

// IPC: extract text from .docx file
ipcMain.handle('docx:extract', async (_event, filePath) => {
  if (typeof filePath !== 'string') return ''
  if (!path.isAbsolute(filePath)) return ''
  const normalized = path.normalize(filePath)
  if (!normalized.endsWith('.docx')) return ''
  try {
    const result = await mammoth.extractRawText({ path: normalized })
    return result.value
  } catch (err) {
    console.error('[ClipSanitizer] docx IPC extract error:', err.message)
    return ''
  }
})

app.whenReady().then(() => {
  createWindow()
  const docxArg = process.argv.slice(1).find(a => typeof a === 'string' && a.endsWith('.docx'))
  if (docxArg) {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      win.webContents.once('did-finish-load', () => {
        win.webContents.send('open-file', docxArg)
      })
    }
  }
})
app.on('window-all-closed', () => app.quit())
