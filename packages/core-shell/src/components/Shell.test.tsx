import { describe, it, expect } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { Shell } from './Shell'
import { ShellProvider } from './ShellProvider'

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

  it('adds is-dragging class to cs-root while dragging horizontal resize handle', () => {
    const { container } = render(<Shell />)
    const root = container.querySelector('.cs-root')!
    const handleH = container.querySelector('.cs-resize-handle-h')!

    expect(root.classList.contains('is-dragging')).toBe(false)

    fireEvent.mouseDown(handleH, { clientX: 0, clientY: 400 })
    expect(root.classList.contains('is-dragging')).toBe(true)

    act(() => {
      fireEvent.mouseUp(document)
    })
    expect(root.classList.contains('is-dragging')).toBe(false)
  })
})
