import type { ReactNode } from 'react'
import { ExtensionErrorBoundary } from '../extension/ExtensionErrorBoundary'

interface Props {
  height: number
  children?: ReactNode
}

export function Panel({ height, children }: Props) {
  return (
    <div className="cs-panel" style={{ height }}>
      <ExtensionErrorBoundary extensionId="panel">
        <div className="cs-panel__content">{children}</div>
      </ExtensionErrorBoundary>
    </div>
  )
}
