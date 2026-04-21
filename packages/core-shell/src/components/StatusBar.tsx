import type { ReactNode } from 'react'

interface Props {
  leftItems?: ReactNode[]
  rightItems?: ReactNode[]
}

export function StatusBar({ leftItems = [], rightItems = [] }: Props) {
  return (
    <div className="cs-status-bar" role="status">
      <div className="cs-status-bar__left">
        {leftItems.map((item, i) => (
          <span key={i} className="cs-status-bar__item">{item}</span>
        ))}
      </div>
      <div className="cs-status-bar__right">
        {rightItems.map((item, i) => (
          <span key={i} className="cs-status-bar__item">{item}</span>
        ))}
      </div>
    </div>
  )
}
