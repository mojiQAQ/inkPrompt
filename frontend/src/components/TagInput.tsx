/**
 * Tag input component with autocomplete
 */
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { fetchTags } from '@/api/tags'
import type { Tag } from '@/types/tag'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function TagInput({ value, onChange, placeholder = '输入标签后按回车添加' }: TagInputProps) {
  const { getAccessToken } = useAuth()

  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<Tag[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch tag suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      if (!inputValue.trim()) {
        setSuggestions([])
        return
      }

      try {
        const token = await getAccessToken()
        if (!token) return

        const response = await fetchTags(token, {
          search: inputValue,
          include_system: true,
        })

        // Filter out already selected tags
        const filtered = response.items.filter(
          (tag) => !value.includes(tag.name)
        )

        setSuggestions(filtered.slice(0, 5)) // Show top 5 suggestions
      } catch (err) {
        console.error('Failed to load tag suggestions:', err)
      }
    }

    const debounce = setTimeout(loadSuggestions, 300)
    return () => clearTimeout(debounce)
  }, [inputValue, value, getAccessToken])

  const handleAdd = (tagName: string) => {
    const trimmed = tagName.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
      setInputValue('')
      setSuggestions([])
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  const handleRemove = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()

      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        // Add selected suggestion
        handleAdd(suggestions[selectedIndex].name)
      } else if (inputValue.trim()) {
        // Add input value
        handleAdd(inputValue)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
      setShowSuggestions(true)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setShowSuggestions(true)
    setSelectedIndex(-1)
  }

  const handleSuggestionClick = (tag: Tag) => {
    handleAdd(tag.name)
  }

  return (
    <div className="relative">
      {/* Input field */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay to allow click on suggestions
              setTimeout(() => setShowSuggestions(false), 200)
            }}
            className="input"
            placeholder={placeholder}
          />

          {/* Autocomplete suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-ink-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((tag, index) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleSuggestionClick(tag)}
                  className={`w-full text-left px-4 py-2 hover:bg-ink-50 transition-colors flex items-center justify-between ${
                    index === selectedIndex ? 'bg-ink-100' : ''
                  }`}
                >
                  <span className="text-ink-700">{tag.name}</span>
                  <span className="text-xs text-ink-400">
                    {tag.use_count} 次使用
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleAdd(inputValue)}
          className="btn btn-secondary"
          disabled={!inputValue.trim()}
        >
          添加
        </button>
      </div>

      {/* Selected tags display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-accent-purple to-accent-green text-white rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemove(tag)}
                className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
