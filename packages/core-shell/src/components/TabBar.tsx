import type { TabEntry } from '../types'

interface Props {
  tabs: TabEntry[]
  activeTabId: string | null
  onTabClick: (id: string) => void
  onTabClose: (id: string) => void
  onNewTab?: () => void
}

export function TabBar({ tabs, activeTabId, onTabClick, onTabClose, onNewTab }: Props) {
  return (
    <div className="cs-tab-bar" role="tablist">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`cs-tab ${tab.id === activeTabId ? 'cs-tab--active' : ''}`}
          role="tab"
          aria-selected={tab.id === activeTabId}
          onClick={() => onTabClick(tab.id)}
        >
          <span className="cs-tab__label">{tab.label}</span>
          <button
            className="cs-tab__close"
            onClick={e => { e.stopPropagation(); onTabClose(tab.id) }}
            aria-label="Close tab"
          >
            ×
          </button>
        </div>
      ))}
      {onNewTab && (
        <button className="cs-tab-bar__new" onClick={onNewTab} aria-label="New tab">+</button>
      )}
    </div>
  )
}
