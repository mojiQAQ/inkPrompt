/**
 * Keyboard shortcuts hook
 * Provides global keyboard shortcuts for the application
 */
import { useEffect } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  callback: () => void
  description: string
}

/**
 * Hook to register keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow ESC key even in input fields
        if (event.key !== 'Escape') {
          return
        }
      }

      for (const shortcut of shortcuts) {
        const ctrlKey = shortcut.ctrl && (event.ctrlKey || event.metaKey)
        const metaKey = shortcut.meta && (event.ctrlKey || event.metaKey)
        const shiftKey = shortcut.shift ? event.shiftKey : !event.shiftKey

        // Check if this shortcut matches
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const modifiersMatch =
          (shortcut.ctrl || shortcut.meta ? ctrlKey || metaKey : true) &&
          shiftKey

        if (keyMatches && modifiersMatch) {
          // Check exact modifier requirements
          const exactCtrlMatch = shortcut.ctrl || shortcut.meta
            ? event.ctrlKey || event.metaKey
            : !event.ctrlKey && !event.metaKey

          const exactShiftMatch = shortcut.shift
            ? event.shiftKey
            : !event.shiftKey

          if (exactCtrlMatch && exactShiftMatch) {
            event.preventDefault()
            shortcut.callback()
            break
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

/**
 * Get the display string for a keyboard shortcut
 */
export function getShortcutDisplay(shortcut: Omit<KeyboardShortcut, 'callback' | 'description'>): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const parts: string[] = []

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl')
  }

  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift')
  }

  parts.push(shortcut.key.toUpperCase())

  return parts.join(isMac ? '' : '+')
}
