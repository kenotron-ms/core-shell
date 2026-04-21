import { create } from 'zustand'
import type { TabEntry, CommandEntry, LayoutState } from '../types'

interface ShellStore {
  activeExtension: string | null
  tabs: TabEntry[]
  activeTabId: string | null
  layout: LayoutState
  theme: 'light' | 'dark'
  commandPaletteOpen: boolean
  commands: CommandEntry[]

  // Actions
  setLayout: (patch: Partial<LayoutState>) => void
  openTab: (tab: TabEntry) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  openCommandPalette: () => void
  closeCommandPalette: () => void
  registerCommand: (cmd: CommandEntry) => void
  setActiveExtension: (id: string | null) => void
}

const DEFAULT_LAYOUT: LayoutState = {
  sidebarWidth: 220,
  sidebarCollapsed: false,
  panelHeight: 200,
  panelCollapsed: false,
  rightSidebarWidth: 280,
  rightSidebarVisible: false,
}

export const useShellStore = create<ShellStore>((set) => ({
  activeExtension: null,
  tabs: [],
  activeTabId: null,
  layout: DEFAULT_LAYOUT,
  theme: 'dark',
  commandPaletteOpen: false,
  commands: [],

  setLayout: (patch) => set(s => ({ layout: { ...s.layout, ...patch } })),

  openTab: (tab) => set(s => ({
    tabs: [...s.tabs, tab],
    activeTabId: tab.id,
  })),

  closeTab: (id) => set(s => {
    const tabs = s.tabs.filter(t => t.id !== id)
    return {
      tabs,
      activeTabId: s.activeTabId === id
        ? (tabs[tabs.length - 1]?.id ?? null)
        : s.activeTabId,
    }
  }),

  setActiveTab: (id) => set({ activeTabId: id }),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),

  registerCommand: (cmd) => set(s => ({
    commands: [...s.commands.filter(c => c.id !== cmd.id), cmd],
  })),

  setActiveExtension: (id) => set({ activeExtension: id }),
}))
