import type { ActivityRailItem } from '../types'

interface Props {
  items: ActivityRailItem[]
  bottomItems?: ActivityRailItem[]
}

export function ActivityRail({ items, bottomItems = [] }: Props) {
  return (
    <div className="cs-activity-rail" role="navigation" aria-label="Activity rail">
      <div className="cs-activity-rail__top">
        {items.map(item => (
          <button
            key={item.id}
            className={`cs-activity-rail__item ${item.active ? 'cs-activity-rail__item--active' : ''}`}
            title={item.title}
            aria-label={item.title}
            onClick={item.onClick}
          >
            {item.icon}
          </button>
        ))}
      </div>
      <div className="cs-activity-rail__bottom">
        {bottomItems.map(item => (
          <button
            key={item.id}
            className="cs-activity-rail__item"
            title={item.title}
            aria-label={item.title}
            onClick={item.onClick}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  )
}
