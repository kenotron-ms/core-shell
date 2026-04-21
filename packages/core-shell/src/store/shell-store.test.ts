import { describe, it, expect, beforeEach } from 'vitest'
import { useShellStore } from './shell-store'

beforeEach(() => {
  // Reset store to initial state between tests
  useShellStore.setState({
    activeExtension: null,
    tabs: [],
    activeTabId: null,
    theme: 'dark',
    commandPaletteOpen: false,
    commands: [],
  })
})

describe('useShellStore – tabs', () => {
  it('opens a tab and makes it active', () => {
    const tab = { id: 't1', label: 'Explorer', extensionId: 'ext-explorer' }
    useShellStore.getState().openTab(tab)

    const { tabs, activeTabId } = useShellStore.getState()
    expect(tabs).toHaveLength(1)
    expect(tabs[0]).toEqual(tab)
    expect(activeTabId).toBe('t1')
  })

  it('closes a tab and falls back to previous', () => {
    const a = { id: 'a', label: 'A', extensionId: 'ext-a' }
    const b = { id: 'b', label: 'B', extensionId: 'ext-b' }
    useShellStore.getState().openTab(a)
    useShellStore.getState().openTab(b)

    useShellStore.getState().closeTab('b')

    const { tabs, activeTabId } = useShellStore.getState()
    expect(tabs).toHaveLength(1)
    expect(activeTabId).toBe('a')
  })

  it('clears activeTabId when last tab is closed', () => {
    useShellStore.getState().openTab({ id: 'only', label: 'Only', extensionId: 'x' })
    useShellStore.getState().closeTab('only')

    expect(useShellStore.getState().activeTabId).toBeNull()
  })
})

describe('useShellStore – command palette', () => {
  it('opens and closes the command palette', () => {
    useShellStore.getState().openCommandPalette()
    expect(useShellStore.getState().commandPaletteOpen).toBe(true)

    useShellStore.getState().closeCommandPalette()
    expect(useShellStore.getState().commandPaletteOpen).toBe(false)
  })

  it('registers a command (deduplicates by id)', () => {
    const cmd = { id: 'cmd1', label: 'Do thing', onSelect: () => {} }
    useShellStore.getState().registerCommand(cmd)
    useShellStore.getState().registerCommand({ ...cmd, label: 'Updated' })

    const { commands } = useShellStore.getState()
    expect(commands).toHaveLength(1)
    expect(commands[0].label).toBe('Updated')
  })
})

describe('useShellStore – layout', () => {
  it('patches layout without overwriting untouched fields', () => {
    useShellStore.getState().setLayout({ sidebarWidth: 300 })

    const { layout } = useShellStore.getState()
    expect(layout.sidebarWidth).toBe(300)
    expect(layout.panelHeight).toBe(200) // unchanged default
  })
})

describe('useShellStore – right sidebar visibility via width', () => {
  it('rightSidebarWidth defaults to 280 (right sidebar visible by default)', () => {
    const { layout } = useShellStore.getState()
    expect(layout.rightSidebarWidth).toBe(280)
  })

  it('layout has no rightSidebarVisible field', () => {
    const { layout } = useShellStore.getState()
    expect('rightSidebarVisible' in layout).toBe(false)
  })
})
