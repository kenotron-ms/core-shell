import type { ReactNode } from 'react'

interface Props {
  width: number
  collapsed: boolean
  onCollapseToggle: () => void
  children?: ReactNode
}

export function Sidebar({ width, collapsed, onCollapseToggle, children }: Props) {
  return (
    <div className="cs-sidebar" style={{ width: collapsed ? 28 : width }}>
      <button
        className="cs-sidebar__collapse-btn"
        onClick={onCollapseToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '\u203A' : '\u2039'}
      </button>
      {!collapsed && <div className="cs-sidebar__content">{children}</div>}
    </div>
  )
}
