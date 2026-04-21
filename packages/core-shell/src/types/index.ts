export interface TabEntry {
  id: string
  label: string
  extensionId: string
}

export interface CommandEntry {
  id: string
  label: string
  onSelect: () => void
}

export interface ActivityRailItem {
  id: string
  icon: React.ReactNode
  title: string
  active?: boolean
  onClick: () => void
}

export interface LayoutState {
  sidebarWidth: number
  panelHeight: number
  rightSidebarWidth: number
  rightSidebarVisible: boolean
}

// Stubs for Phase 1B
export interface Manifest {
  id: string
  displayName: string
  version: string
  contributes: Record<string, unknown>
}
