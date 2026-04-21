import { describe, it, expect } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { Shell } from './Shell'
import { ShellProvider, useShellExtensions } from './ShellProvider'
import type { Manifest } from '../types'

describe('Shell', () => {
  it('is a function (React component)', () => {
    expect(typeof Shell).toBe('function')
  })
})

describe('ShellProvider', () => {
  it('is a function (React component)', () => {
    expect(typeof ShellProvider).toBe('function')
  })
})

describe('Shell drag interactions', () => {
  it('adds is-dragging class to cs-root while dragging vertical resize handle', () => {
    const { container } = render(<Shell />)
    const root = container.querySelector('.cs-root')!
    const handleV = container.querySelector('.cs-resize-handle-v')!

    // Before drag — no is-dragging
    expect(root.classList.contains('is-dragging')).toBe(false)

    // Start drag
    fireEvent.mouseDown(handleV, { clientX: 200, clientY: 0 })
    expect(root.classList.contains('is-dragging')).toBe(true)

    // End drag
    act(() => {
      fireEvent.mouseUp(document)
    })
    expect(root.classList.contains('is-dragging')).toBe(false)
  })
})

// --- RED tests for tab bar + panel removal ---
describe('Shell layout — tab bar and panel shelved', () => {
  it('does not render a tab bar', () => {
    const { container } = render(<Shell />)
    expect(container.querySelector('.cs-tab-bar')).toBeNull()
  })

  it('does not render a horizontal resize handle (panel shelved)', () => {
    const { container } = render(<Shell />)
    expect(container.querySelector('.cs-resize-handle-h')).toBeNull()
  })

  it('renders two vertical resize handles when right sidebar is visible (width > 0)', () => {
    const { container } = render(<Shell />)
    // left sidebar handle + right sidebar handle
    const handles = container.querySelectorAll('.cs-resize-handle-v')
    expect(handles.length).toBe(2)
  })
})

// --- RED tests for ShellProvider extension context ---
describe('ShellProvider + useShellExtensions', () => {
  it('provides extensions array via context', () => {
    const mockExt: Manifest = {
      id: 'test-ext',
      displayName: 'Test Extension',
      version: '0.1.0',
      contributes: {},
    }

    let capturedExtensions: Manifest[] = []
    function TestConsumer() {
      const { extensions } = useShellExtensions()
      capturedExtensions = extensions
      return null
    }

    render(
      <ShellProvider extensions={[mockExt]}>
        <TestConsumer />
      </ShellProvider>
    )
    expect(capturedExtensions).toHaveLength(1)
    expect(capturedExtensions[0].id).toBe('test-ext')
  })

  it('sets first extension as active by default', () => {
    const ext1: Manifest = { id: 'ext-1', displayName: 'Ext 1', version: '0.1.0', contributes: {} }
    const ext2: Manifest = { id: 'ext-2', displayName: 'Ext 2', version: '0.1.0', contributes: {} }

    let capturedActiveId: string | null = 'unset'
    function TestConsumer() {
      const { activeExtensionId } = useShellExtensions()
      capturedActiveId = activeExtensionId
      return null
    }

    render(
      <ShellProvider extensions={[ext1, ext2]}>
        <TestConsumer />
      </ShellProvider>
    )
    expect(capturedActiveId).toBe('ext-1')
  })
})
