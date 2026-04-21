import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import './shell.css'
import { useShellStore } from '../store/shell-store'
import { ActivityRail } from './ActivityRail'
import { TabBar } from './TabBar'
import { Sidebar } from './Sidebar'
import { Canvas } from './Canvas'
import { RightSidebar } from './RightSidebar'
import { Panel } from './Panel'
import { StatusBar } from './StatusBar'
import { CommandPalette } from './CommandPalette'

interface ShellProps {
  children?: ReactNode
}

export function Shell({ children }: ShellProps) {
  const {
    layout, setLayout,
    tabs, activeTabId, closeTab, setActiveTab,
    commandPaletteOpen, openCommandPalette, closeCommandPalette,
    commands,
  } = useShellStore()

  const [draggingV, setDraggingV] = useState(false)
  const [draggingH, setDraggingH] = useState(false)

  const startDragV = (e: React.MouseEvent) => {
    e.preventDefault()
    setDraggingV(true)
    const startX = e.clientX
    const startW = layout.sidebarWidth
    const onMove = (ev: MouseEvent) => {
      requestAnimationFrame(() =>
        setLayout({ sidebarWidth: Math.max(150, Math.min(500, startW + ev.clientX - startX)) })
      )
    }
    const onUp = () => {
      setDraggingV(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const startDragH = (e: React.MouseEvent) => {
    e.preventDefault()
    setDraggingH(true)
    const startY = e.clientY
    const startH = layout.panelHeight
    const onMove = (ev: MouseEvent) => {
      requestAnimationFrame(() =>
        setLayout({ panelHeight: Math.max(80, Math.min(600, startH - (ev.clientY - startY))) })
      )
    }
    const onUp = () => {
      setDraggingH(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // Cmd+Shift+P / Ctrl+Shift+P to open command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        openCommandPalette()
      }
      if (e.key === 'Escape') {
        closeCommandPalette()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openCommandPalette, closeCommandPalette])

  return (
    <div className="cs-root">
      <div className="cs-title-bar">
        <span className="cs-title-bar__title">core-shell</span>
      </div>

      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={setActiveTab}
        onTabClose={closeTab}
      />

      <div className="cs-body">
        <ActivityRail items={[]} />

        {!layout.sidebarCollapsed && (
          <>
            <Sidebar
              width={layout.sidebarWidth}
              collapsed={layout.sidebarCollapsed}
              onCollapseToggle={() => setLayout({ sidebarCollapsed: true })}
            >
              <p style={{ color: 'var(--cs-text-muted)', fontSize: 12 }}>No extension loaded</p>
            </Sidebar>
            <div
              className={`cs-resize-handle-v ${draggingV ? 'cs-resize-handle-v--dragging' : ''}`}
              onMouseDown={startDragV}
            />
          </>
        )}

        {layout.sidebarCollapsed && (
          <button
            style={{
              width: 28,
              background: 'var(--cs-surface)',
              border: 'none',
              color: 'var(--cs-text-muted)',
              cursor: 'pointer',
              borderRight: '1px solid var(--cs-border)',
              fontSize: 16,
            }}
            onClick={() => setLayout({ sidebarCollapsed: false })}
            aria-label="Expand sidebar"
          >
            {'\u203A'}
          </button>
        )}

        <div className="cs-main">
          <Canvas>{children}</Canvas>
          <div
            className={`cs-resize-handle-h ${draggingH ? 'cs-resize-handle-h--dragging' : ''}`}
            onMouseDown={startDragH}
          />
          <Panel
            height={layout.panelHeight}
            collapsed={layout.panelCollapsed}
            onCollapseToggle={() => setLayout({ panelCollapsed: !layout.panelCollapsed })}
          >
            <p style={{ color: 'var(--cs-text-muted)', fontSize: 12 }}>No panel extension loaded</p>
          </Panel>
        </div>

        <RightSidebar
          width={layout.rightSidebarWidth}
          visible={layout.rightSidebarVisible}
        />
      </div>

      <StatusBar
        leftItems={['core-shell v0.1']}
        rightItems={['ready']}
      />

      <CommandPalette
        open={commandPaletteOpen}
        onClose={closeCommandPalette}
        commands={commands}
      />
    </div>
  )
}
