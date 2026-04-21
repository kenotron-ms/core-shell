import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Manifest } from '../types'

export interface ShellContextValue {
  extensions: Manifest[]
  activeExtensionId: string | null
  setActiveExtensionId: (id: string | null) => void
}

export const ShellContext = createContext<ShellContextValue>({
  extensions: [],
  activeExtensionId: null,
  setActiveExtensionId: () => {},
})

export function useShellExtensions() {
  return useContext(ShellContext)
}

interface Props {
  extensions?: Manifest[]
  children: ReactNode
}

export function ShellProvider({ extensions = [], children }: Props) {
  const [activeExtensionId, setActiveExtensionId] = useState<string | null>(
    extensions[0]?.id ?? null
  )
  return (
    <ShellContext.Provider value={{ extensions, activeExtensionId, setActiveExtensionId }}>
      {children}
    </ShellContext.Provider>
  )
}
