/**
 * Hook for managing search history with LocalStorage
 */
import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'inkprompt_search_history'
const MAX_HISTORY_ITEMS = 10

export interface SearchHistoryItem {
  query: string
  timestamp: number
}

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([])

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as SearchHistoryItem[]
        setHistory(parsed)
      }
    } catch (error) {
      console.error('Failed to load search history:', error)
    }
  }, [])

  // Add a new search query to history
  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return

    setHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((item) => item.query !== query)

      // Add new item at the beginning
      const newHistory = [
        { query, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_HISTORY_ITEMS) // Keep only the most recent items

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
      } catch (error) {
        console.error('Failed to save search history:', error)
      }

      return newHistory
    })
  }, [])

  // Remove a specific item from history
  const removeFromHistory = useCallback((query: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter((item) => item.query !== query)

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
      } catch (error) {
        console.error('Failed to save search history:', error)
      }

      return newHistory
    })
  }, [])

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear search history:', error)
    }
  }, [])

  // Get recent searches (default: last 5)
  const getRecentSearches = useCallback((limit: number = 5): string[] => {
    return history.slice(0, limit).map((item) => item.query)
  }, [history])

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getRecentSearches,
  }
}
