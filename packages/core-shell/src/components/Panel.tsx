import type { ReactNode } from 'react'
import { ExtensionErrorBoundary } from '../extension/ExtensionErrorBoundary'

interface Props {
  height: number
  collapsed: boolean
  onCollapseToggle: () => void
  children?: ReactNode
}

export function Panel({ height, collapsed, onCollapseToggle, children }: Props) {
  return (
    <div className="cs-panel" style={{ height: collapsed ? 28 : height }}>
      <div className="cs-panel__header">
        <button
          className="cs-panel__collapse-btn"
          onClick={onCollapseToggle}
          aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {collapsed ? '\u25B2' : '\u25BC'}
        </button>
      </div>
      {!collapsed && (
        <ExtensionErrorBoundary extensionId="panel">
          <div className="cs-panel__content">{children}</div>
        </ExtensionErrorBoundary>
      )}
    </div>
  )
}
