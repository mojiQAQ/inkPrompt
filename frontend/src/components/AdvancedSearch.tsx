import { useEffect, useRef, useState } from 'react'

import { useI18n } from '@/hooks/useI18n'
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
  const { t } = useI18n()
  const [inputValue, setInputValue] = useState(search)
  const [showHistory, setShowHistory] = useState(false)
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(inputValue)
      if (inputValue.trim()) {
        addToHistory(inputValue.trim())
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue, onSearchChange, addToHistory])

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
    { value: 'updated_at', label: t('advancedSearch.sortOptions.updated_at') },
    { value: 'created_at', label: t('advancedSearch.sortOptions.created_at') },
    { value: 'name', label: t('advancedSearch.sortOptions.name') },
    { value: 'token_count', label: t('advancedSearch.sortOptions.token_count') },
  ]

  const clearSearch = () => {
    setInputValue('')
    onSearchChange('')
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
      <div className="prompt-search-bar relative min-w-0 flex-1">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onFocus={() => setShowHistory(true)}
          placeholder={t('advancedSearch.placeholder')}
          className="input h-12 pl-12 pr-12"
        />
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400"
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

        {inputValue ? (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}

        {showHistory && history.length > 0 && !inputValue ? (
          <div
            ref={dropdownRef}
            className="prompt-history-dropdown absolute inset-x-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-[24px]"
          >
            <div className="flex items-center justify-between border-b border-[rgba(122,102,82,0.1)] px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-500">
                {t('advancedSearch.history')}
              </span>
              <button
                type="button"
                onClick={clearHistory}
                className="text-xs font-medium text-ink-500 transition-colors hover:text-ink-900"
              >
                {t('common.action.clearAll')}
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto py-2">
              {history.slice(0, 10).map((item) => (
                <button
                  key={item.timestamp}
                  type="button"
                  onClick={() => {
                    setInputValue(item.query)
                    onSearchChange(item.query)
                    setShowHistory(false)
                  }}
                  className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/70"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <svg className="h-4 w-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="truncate text-sm text-ink-700">{item.query}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      removeFromHistory(item.query)
                    }}
                    className="rounded-full p-1 text-ink-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                    title={t('advancedSearch.deleteHistory')}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:self-stretch">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400 lg:pl-1">
          {t('advancedSearch.sortLabel')}
        </span>
        <select
          value={sortBy}
          onChange={(event) => onSortByChange(event.target.value as SortBy)}
          className="toolbar-select min-w-[8.75rem]"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="icon-button h-10 w-10"
          title={sortOrder === 'asc' ? t('advancedSearch.sortAsc') : t('advancedSearch.sortDesc')}
        >
          {sortOrder === 'asc' ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
