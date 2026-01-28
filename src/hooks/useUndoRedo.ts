import { useState, useCallback } from 'react'

type UseUndoRedoReturn<T> = {
  state: T
  setState: (value: T) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  reset: (initialState: T) => void
}

export function useUndoRedo<T>(initialState: T): UseUndoRedoReturn<T> {
  const [history, setHistory] = useState<T[]>([initialState])
  const [index, setIndex] = useState(0)

  const state = history[index]

  const setState = useCallback(
    (value: T) => {
      // Remove any future states after current index
      const newHistory = history.slice(0, index + 1)
      newHistory.push(value)

      // Limit history to 50 entries to prevent memory issues
      if (newHistory.length > 50) {
        newHistory.shift()
        setHistory(newHistory)
        setIndex(newHistory.length - 1)
      } else {
        setHistory(newHistory)
        setIndex(newHistory.length - 1)
      }
    },
    [history, index]
  )

  const undo = useCallback(() => {
    if (index > 0) {
      setIndex(index - 1)
    }
  }, [index])

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      setIndex(index + 1)
    }
  }, [history.length, index])

  const reset = useCallback((initialState: T) => {
    setHistory([initialState])
    setIndex(0)
  }, [])

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
    reset,
  }
}

export default useUndoRedo
