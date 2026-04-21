import type { ReactNode } from 'react'
import { ExtensionErrorBoundary } from '../extension/ExtensionErrorBoundary'

interface Props {
  children?: ReactNode
  extensionId?: string
}

export function Canvas({ children, extensionId = 'canvas' }: Props) {
  return (
    <div className="cs-canvas">
      <ExtensionErrorBoundary extensionId={extensionId}>
        {children ?? (
          <div className="cs-canvas__empty">
            <span>No extension loaded</span>
          </div>
        )}
      </ExtensionErrorBoundary>
    </div>
  )
}
