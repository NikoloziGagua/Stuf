import { useEffect, useCallback } from 'react'

type ShortcutHandler = () => void

type Shortcuts = {
  onEscape?: ShortcutHandler
  onSave?: ShortcutHandler
  onCommandPalette?: ShortcutHandler
  onUndo?: ShortcutHandler
  onRedo?: ShortcutHandler
}

export function useKeyboardShortcuts(shortcuts: Shortcuts) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modKey = isMac ? event.metaKey : event.ctrlKey

      // Escape - close modals/sidebars
      if (event.key === 'Escape' && shortcuts.onEscape) {
        event.preventDefault()
        shortcuts.onEscape()
        return
      }

      // Cmd/Ctrl + S - save
      if (modKey && event.key === 's' && shortcuts.onSave) {
        event.preventDefault()
        shortcuts.onSave()
        return
      }

      // Cmd/Ctrl + K - command palette
      if (modKey && event.key === 'k' && shortcuts.onCommandPalette) {
        event.preventDefault()
        shortcuts.onCommandPalette()
        return
      }

      // Cmd/Ctrl + Z - undo
      if (modKey && event.key === 'z' && !event.shiftKey && shortcuts.onUndo) {
        event.preventDefault()
        shortcuts.onUndo()
        return
      }

      // Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y - redo
      if (
        ((modKey && event.shiftKey && event.key === 'z') ||
          (modKey && event.key === 'y')) &&
        shortcuts.onRedo
      ) {
        event.preventDefault()
        shortcuts.onRedo()
        return
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export default useKeyboardShortcuts
