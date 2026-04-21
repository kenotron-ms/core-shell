import type { ReactNode } from 'react'

interface Props {
  children?: ReactNode
  extensionId?: string
}

export function Canvas({ children }: Props) {
  return (
    <div className="cs-canvas">
      {children ?? (
        <div className="cs-canvas__empty">
          <span>No extension loaded</span>
        </div>
      )}
    </div>
  )
}
