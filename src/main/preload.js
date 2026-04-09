const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  readClipboard: () => ipcRenderer.invoke('clipboard:read'),
  writeClipboard: (text) => ipcRenderer.invoke('clipboard:write', text),
  extractDocx: (filePath) => ipcRenderer.invoke('docx:extract', filePath),
  onOpenFile:  (cb) => ipcRenderer.on('open-file', (_e, path) => cb(path)),
})
