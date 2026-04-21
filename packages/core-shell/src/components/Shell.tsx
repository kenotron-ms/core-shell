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

// Snap thresholds: drag below these → collapse to 0
const SIDEBAR_SNAP = 80   // px — below this width, sidebar snaps shut
const SIDEBAR_MIN  = 150  // px — minimum open width (also the snap-open target)
const PANEL_SNAP   = 60   // px — below this height, panel snaps shut
const PANEL_MIN    = 80   // px — minimum open height (also the snap-open target)

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
      const raw = startW + ev.clientX - startX
      requestAnimationFrame(() => {
        if (raw < SIDEBAR_SNAP) {
          setLayout({ sidebarWidth: 0 })
        } else {
          setLayout({ sidebarWidth: Math.max(SIDEBAR_MIN, Math.min(500, raw)) })
        }
      })
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
      const raw = startH - (ev.clientY - startY)
      requestAnimationFrame(() => {
        if (raw < PANEL_SNAP) {
          setLayout({ panelHeight: 0 })
        } else {
          setLayout({ panelHeight: Math.max(PANEL_MIN, Math.min(600, raw)) })
        }
      })
    }
    const onUp = () => {
      setDraggingH(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        openCommandPalette()
      }
      if (e.key === 'Escape') closeCommandPalette()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openCommandPalette, closeCommandPalette])

  return (
    <div className={`cs-root${draggingV || draggingH ? ' is-dragging' : ''}`}>
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

        {layout.sidebarWidth > 0 && (
          <Sidebar width={layout.sidebarWidth}>
            <p style={{ color: 'var(--cs-text-muted)', fontSize: 12 }}>No extension loaded</p>
          </Sidebar>
        )}

        {/* Resize handle is ALWAYS rendered — drag right from here when sidebar is hidden */}
        <div
          className={`cs-resize-handle-v${draggingV ? ' cs-resize-handle-v--dragging' : ''}`}
          onMouseDown={startDragV}
        />

        <div className="cs-main">
          <Canvas>{children}</Canvas>

          {/* Resize handle is ALWAYS rendered — drag up from here when panel is hidden */}
          <div
            className={`cs-resize-handle-h${draggingH ? ' cs-resize-handle-h--dragging' : ''}`}
            onMouseDown={startDragH}
          />

          {layout.panelHeight > 0 && (
            <Panel height={layout.panelHeight}>
              <p style={{ color: 'var(--cs-text-muted)', fontSize: 12 }}>No panel extension loaded</p>
            </Panel>
          )}
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
