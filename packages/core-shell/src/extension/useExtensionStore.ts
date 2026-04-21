import { useState } from 'react'

// Phase 1A stub — simple React state.
// Phase 1B: isolated per extension, persisted by shell, keyed by extension ID.
export function useExtensionStore<T>(initialState: T): [T, (update: Partial<T>) => void] {
  const [state, setState] = useState<T>(initialState)
  return [state, (update) => setState(prev => ({ ...prev, ...update }))]
}
