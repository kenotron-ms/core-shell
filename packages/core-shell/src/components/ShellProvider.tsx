import type { ReactNode } from 'react'
import type { Manifest } from '../types'

interface Props {
  extensions?: Manifest[]
  children: ReactNode
}

export function ShellProvider({ children }: Props) {
  // Phase 1B: extension discovery + registry wired here
  // Phase 1A: passthrough — extensions prop accepted but not processed
  return <>{children}</>
}
