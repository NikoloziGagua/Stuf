import { useState, useEffect, useRef, useMemo } from 'react'

type CommandItem = {
  id: string
  title: string
  section: string
  hint?: string
  action: () => void
}

type CommandPaletteProps = {
  isOpen: boolean
  onClose: () => void
  items: CommandItem[]
}

export function CommandPalette({ isOpen, onClose, items }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items
    const lowerQuery = query.toLowerCase()
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.section.toLowerCase().includes(lowerQuery)
    )
  }, [items, query])

  const groupedItems = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    filteredItems.forEach((item) => {
      if (!groups[item.section]) {
        groups[item.section] = []
      }
      groups[item.section].push(item)
    })
    return groups
  }, [filteredItems])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action()
          onClose()
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }

  const handleItemClick = (item: CommandItem) => {
    item.action()
    onClose()
  }

  if (!isOpen) return null

  let currentIndex = 0

  return (
    <div
      className="command-palette-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="command-palette">
        <input
          ref={inputRef}
          type="text"
          className="command-palette-input"
          placeholder="Search phases, entities, or actions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Search commands"
        />
        <div className="command-palette-results">
          {filteredItems.length === 0 ? (
            <div className="command-palette-empty">
              No results found for "{query}"
            </div>
          ) : (
            Object.entries(groupedItems).map(([section, sectionItems]) => (
              <div key={section} className="command-palette-section">
                <div className="command-palette-section-title">{section}</div>
                {sectionItems.map((item) => {
                  const itemIndex = currentIndex++
                  return (
                    <div
                      key={item.id}
                      className={`command-palette-item${
                        itemIndex === selectedIndex ? ' selected' : ''
                      }`}
                      onClick={() => handleItemClick(item)}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                    >
                      <span className="command-palette-item-title">
                        {item.title}
                      </span>
                      {item.hint && (
                        <span className="command-palette-item-hint">
                          {item.hint}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
