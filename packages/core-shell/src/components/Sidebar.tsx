import type { ReactNode } from 'react'

interface Props {
  width: number
  children?: ReactNode
}

export function Sidebar({ width, children }: Props) {
  return (
    <div className="cs-sidebar" style={{ width }}>
      <div className="cs-sidebar__content">{children}</div>
    </div>
  )
}
