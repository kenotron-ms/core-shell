import type { ComponentType, ReactNode } from 'react'

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
  icon: ReactNode
  title: string
  active?: boolean
  onClick: () => void
}

export interface LayoutState {
  sidebarWidth: number
  panelHeight: number
  rightSidebarWidth: number
}

export interface ExtensionContributes {
  activityRail?: { icon: ReactNode; title: string }
  sidebar?: ComponentType
  canvas?: ComponentType
  rightSidebar?: ComponentType
  panel?: ComponentType
  statusBar?: Array<{ position: 'left' | 'right'; component: ComponentType }>
}

export interface Manifest {
  id: string
  displayName: string
  version: string
  contributes: ExtensionContributes
}
