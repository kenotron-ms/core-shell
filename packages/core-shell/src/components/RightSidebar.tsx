import type { ReactNode } from 'react'

interface Props {
  width: number
  children?: ReactNode
}

export function RightSidebar({ width, children }: Props) {
  return (
    <div className="cs-right-sidebar" style={{ width }}>
      {children}
    </div>
  )
}
