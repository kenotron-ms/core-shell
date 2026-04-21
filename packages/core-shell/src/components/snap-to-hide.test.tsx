import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Sidebar } from './Sidebar'
import { Panel } from './Panel'

// -----------------------------------------------------------------------
// RED: These tests describe the NEW snap-to-hide behavior.
// They FAIL against the current implementation (collapse buttons present).
// -----------------------------------------------------------------------

describe('Sidebar — snap-to-hide UX', () => {
  it('renders without a collapse button', () => {
    render(<Sidebar width={220}><span>content</span></Sidebar>)
    expect(
      document.querySelector('.cs-sidebar__collapse-btn'),
    ).toBeNull()
  })

  it('accepts only width + children (no collapsed / onCollapseToggle props)', () => {
    // If the component required "collapsed" this would be a TS error at build time;
    // at runtime we verify the component still renders normally without those props.
    render(<Sidebar width={200} />)
    const sidebar = document.querySelector('.cs-sidebar') as HTMLElement
    expect(sidebar).not.toBeNull()
    expect(sidebar.style.width).toBe('200px')
  })
})

describe('Panel — snap-to-hide UX', () => {
  it('renders without a panel header or collapse button', () => {
    render(<Panel height={200}><span>content</span></Panel>)
    expect(document.querySelector('.cs-panel__header')).toBeNull()
    expect(document.querySelector('.cs-panel__collapse-btn')).toBeNull()
  })

  it('accepts only height + children (no collapsed / onCollapseToggle props)', () => {
    render(<Panel height={150} />)
    const panel = document.querySelector('.cs-panel') as HTMLElement
    expect(panel).not.toBeNull()
    expect(panel.style.height).toBe('150px')
  })
})

describe('Shell store — LayoutState without collapsed booleans', () => {
  it('DEFAULT_LAYOUT has no sidebarCollapsed field', async () => {
    // Dynamically import after clearing module cache so defaults are fresh
    const { useShellStore } = await import('../store/shell-store')
    const layout = useShellStore.getState().layout
    expect('sidebarCollapsed' in layout).toBe(false)
  })

  it('DEFAULT_LAYOUT has no panelCollapsed field', async () => {
    const { useShellStore } = await import('../store/shell-store')
    const layout = useShellStore.getState().layout
    expect('panelCollapsed' in layout).toBe(false)
  })
})
