import type { ReactNode } from 'react'

interface Props {
  width: number
  visible: boolean
  children?: ReactNode
}

export function RightSidebar({ width, visible, children }: Props) {
  if (!visible) return null
  return <div className="cs-right-sidebar" style={{ width }}>{children}</div>
}
