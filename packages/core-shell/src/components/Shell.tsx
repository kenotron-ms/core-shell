import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import './shell.css'
import { useShellStore } from '../store/shell-store'
import { useShellExtensions } from './ShellProvider'
import { ActivityRail } from './ActivityRail'
import { Sidebar } from './Sidebar'
import { Canvas } from './Canvas'
import { RightSidebar } from './RightSidebar'
import { StatusBar } from './StatusBar'
import { CommandPalette } from './CommandPalette'
import type { ActivityRailItem } from '../types'

const SIDEBAR_SNAP  = 80   // px — below this, left sidebar snaps shut
const SIDEBAR_MIN   = 150  // px — minimum open width
const RSIDEBAR_SNAP = 60   // px — below this, right sidebar snaps shut
const RSIDEBAR_MIN  = 200  // px — minimum open width

interface ShellProps {
  children?: ReactNode
}

export function Shell({ children }: ShellProps) {
  const {
    layout, setLayout,
    commandPaletteOpen, openCommandPalette, closeCommandPalette,
    commands, setActiveExtension,
  } = useShellStore()

  const { extensions, activeExtensionId, setActiveExtensionId } = useShellExtensions()

  const [draggingV, setDraggingV]   = useState(false)
  const [draggingR, setDraggingR]   = useState(false)

  // Resolve active extension
  const activeExt = extensions.find(e => e.id === activeExtensionId) ?? extensions[0] ?? null
  const SidebarContent      = activeExt?.contributes.sidebar      ?? null
  const CanvasContent       = activeExt?.contributes.canvas       ?? null
  const RightSidebarContent = activeExt?.contributes.rightSidebar ?? null

  // Build activity rail items from extensions
  const activityItems: ActivityRailItem[] = extensions
    .filter(e => e.contributes.activityRail)
    .map(e => ({
      id: e.id,
      icon: e.contributes.activityRail!.icon,
      title: e.contributes.activityRail!.title,
      active: e.id === (activeExtensionId ?? extensions[0]?.id),
      onClick: () => {
        setActiveExtensionId(e.id)
        setActiveExtension(e.id)
      },
    }))

  // Left sidebar drag
  const startDragV = (e: React.MouseEvent) => {
    e.preventDefault()
    setDraggingV(true)
    const startX = e.clientX
    const startW = layout.sidebarWidth
    const onMove = (ev: MouseEvent) => {
      const raw = startW + ev.clientX - startX
      requestAnimationFrame(() => {
        setLayout({ sidebarWidth: raw < SIDEBAR_SNAP ? 0 : Math.max(SIDEBAR_MIN, Math.min(500, raw)) })
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

  // Right sidebar drag (dragging LEFT increases width)
  const startDragR = (e: React.MouseEvent) => {
    e.preventDefault()
    setDraggingR(true)
    const startX = e.clientX
    const startW = layout.rightSidebarWidth
    const onMove = (ev: MouseEvent) => {
      const raw = startW + (startX - ev.clientX)
      requestAnimationFrame(() => {
        setLayout({ rightSidebarWidth: raw < RSIDEBAR_SNAP ? 0 : Math.max(RSIDEBAR_MIN, Math.min(600, raw)) })
      })
    }
    const onUp = () => {
      setDraggingR(false)
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

  const isDragging = draggingV || draggingR

  return (
    <div className={`cs-root${isDragging ? ' is-dragging' : ''}`}>
      <div className="cs-title-bar">
        <span className="cs-title-bar__title">core-shell</span>
      </div>

      <div className="cs-body">
        <ActivityRail items={activityItems} />

        {/* Left sidebar — hidden when sidebarWidth === 0 */}
        {layout.sidebarWidth > 0 && (
          <Sidebar width={layout.sidebarWidth}>
            {SidebarContent ? <SidebarContent /> : (
              <p style={{ color: 'var(--cs-text-muted)', fontSize: 12 }}>No extension loaded</p>
            )}
          </Sidebar>
        )}

        {/* Left resize handle — always present */}
        <div
          className={`cs-resize-handle-v${draggingV ? ' cs-resize-handle-v--dragging' : ''}`}
          onMouseDown={startDragV}
        />

        {/* Main canvas */}
        <div className="cs-main">
          <Canvas>
            {CanvasContent ? <CanvasContent /> : children}
          </Canvas>
        </div>

        {/* Right resize handle + right sidebar — hidden when rightSidebarWidth === 0 */}
        {layout.rightSidebarWidth > 0 && (
          <>
            <div
              className={`cs-resize-handle-v${draggingR ? ' cs-resize-handle-v--dragging' : ''}`}
              onMouseDown={startDragR}
            />
            <RightSidebar width={layout.rightSidebarWidth}>
              {RightSidebarContent ? <RightSidebarContent /> : (
                <p style={{ color: 'var(--cs-text-muted)', fontSize: 12, padding: 12 }}>No extension loaded</p>
              )}
            </RightSidebar>
          </>
        )}
      </div>

      <StatusBar
        leftItems={activeExt ? [activeExt.displayName] : ['core-shell v0.1']}
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
