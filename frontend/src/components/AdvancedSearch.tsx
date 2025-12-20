/**
 * Advanced search component with search input and sorting options
 */
import { useState, useEffect, useRef } from 'react'
import { useSearchHistory } from '@/hooks/useSearchHistory'

type SortBy = 'updated_at' | 'created_at' | 'name' | 'token_count'
type SortOrder = 'asc' | 'desc'

interface AdvancedSearchProps {
  search: string
  onSearchChange: (search: string) => void
  sortBy: SortBy
  onSortByChange: (sortBy: SortBy) => void
  sortOrder: SortOrder
  onSortOrderChange: (sortOrder: SortOrder) => void
}

export function AdvancedSearch({
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: AdvancedSearchProps) {
  const [inputValue, setInputValue] = useState(search)
  const [showHistory, setShowHistory] = useState(false)
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(inputValue)
      // Add to history when user finishes typing (after debounce)
      if (inputValue.trim()) {
        addToHistory(inputValue.trim())
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue, onSearchChange, addToHistory])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowHistory(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'updated_at', label: '更新时间' },
    { value: 'created_at', label: '创建时间' },
    { value: 'name', label: '名称' },
    { value: 'token_count', label: 'Token 数' },
  ]

  const clearSearch = () => {
    setInputValue('')
    onSearchChange('')
  }

  const selectHistoryItem = (query: string) => {
    setInputValue(query)
    onSearchChange(query)
    setShowHistory(false)
  }

  const handleRemoveHistoryItem = (query: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeFromHistory(query)
  }

  const handleClearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation()
    clearHistory()
    setShowHistory(false)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Search input */}
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setShowHistory(true)}
          placeholder="搜索提示词名称或内容..."
          className="w-full pl-10 pr-10 py-2 text-sm border border-ink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple"
        />
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {/* Clear button */}
        {inputValue && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-600 rounded-full hover:bg-ink-100"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Search history dropdown */}
        {showHistory && history.length > 0 && !inputValue && (
          <div
            ref={dropdownRef}
            className="absolute z-10 w-full mt-1 bg-white border border-ink-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-ink-100">
              <span className="text-xs font-semibold text-ink-600">搜索历史</span>
              <button
                onClick={handleClearAllHistory}
                className="text-xs text-ink-500 hover:text-accent-purple underline"
              >
                清除全部
              </button>
            </div>

            {/* History items */}
            <div className="py-1">
              {history.slice(0, 10).map((item) => (
                <div
                  key={item.timestamp}
                  onClick={() => selectHistoryItem(item.query)}
                  className="flex items-center justify-between px-3 py-2 hover:bg-ink-50 cursor-pointer group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <svg className="w-4 h-4 text-ink-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-ink-700 truncate">{item.query}</span>
                  </div>
                  <button
                    onClick={(e) => handleRemoveHistoryItem(item.query, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-ink-400 hover:text-red-600 transition-opacity"
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sort divider */}
      <div className="h-8 w-px bg-ink-200" />

      {/* Sort options - Compact single line */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm text-ink-600">排序:</span>

        {/* Sort by dropdown */}
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as SortBy)}
          className="text-sm px-2 py-1.5 border border-ink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Sort order toggle */}
        <button
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="p-1.5 text-ink-600 hover:bg-ink-100 rounded-lg transition-colors"
          title={sortOrder === 'asc' ? '升序' : '降序'}
        >
          {sortOrder === 'asc' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
