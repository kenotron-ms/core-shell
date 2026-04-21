import { contextBridge } from 'electron'

// Phase 1B: full IPC bridge exposed here via createPreloadBridge from core-shell/preload
contextBridge.exposeInMainWorld('shellBridge', {})
