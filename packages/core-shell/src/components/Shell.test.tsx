import { describe, it, expect } from 'vitest'
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
