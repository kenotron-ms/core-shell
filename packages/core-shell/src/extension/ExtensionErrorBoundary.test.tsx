import { describe, it, expect } from 'vitest'
import { ExtensionErrorBoundary } from './ExtensionErrorBoundary'
import { useShell } from './useShell'
import { useExtensionStore } from './useExtensionStore'

describe('ExtensionErrorBoundary', () => {
  it('is a class (React component)', () => {
    expect(typeof ExtensionErrorBoundary).toBe('function')
  })
})

describe('useShell', () => {
  it('is a function (hook)', () => {
    expect(typeof useShell).toBe('function')
  })
})

describe('useExtensionStore', () => {
  it('is a function (hook)', () => {
    expect(typeof useExtensionStore).toBe('function')
  })
})
