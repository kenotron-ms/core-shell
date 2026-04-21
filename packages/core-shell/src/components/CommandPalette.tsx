import { useState, useEffect } from 'react'
import type { CommandEntry } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  commands: CommandEntry[]
}

export function CommandPalette({ open, onClose, commands }: Props) {
  const [query, setQuery] = useState('')
  const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  if (!open) return null

  return (
    <div
      className="cs-command-palette-overlay"
      onClick={onClose}
      role="dialog"
      aria-label="Command palette"
      aria-modal
    >
      <div className="cs-command-palette" onClick={e => e.stopPropagation()}>
        <input
          className="cs-command-palette__input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type a command..."
          autoFocus
          aria-label="Search commands"
        />
        <ul className="cs-command-palette__list" role="listbox">
          {filtered.map(cmd => (
            <li
              key={cmd.id}
              className="cs-command-palette__item"
              role="option"
              onClick={() => { cmd.onSelect(); onClose() }}
            >
              {cmd.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
