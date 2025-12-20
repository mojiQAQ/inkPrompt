/**
 * Utility functions for highlighting search keywords
 */
import React from 'react'

/**
 * Highlight search keywords in text
 * @param text The text to highlight
 * @param keyword The keyword to highlight
 * @returns React elements with highlighted keywords
 */
export function highlightKeyword(text: string, keyword: string): React.ReactNode {
  if (!keyword || !text) return text

  const parts = text.split(new RegExp(`(${escapeRegExp(keyword)})`, 'gi'))

  return parts.map((part, index) => {
    if (part.toLowerCase() === keyword.toLowerCase()) {
      return (
        <mark
          key={index}
          className="bg-yellow-200 text-ink-900 px-0.5 rounded"
        >
          {part}
        </mark>
      )
    }
    return part
  })
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Truncate text with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @param keyword Optional keyword to keep visible
 */
export function truncateText(
  text: string,
  maxLength: number = 150,
  keyword?: string
): string {
  if (text.length <= maxLength) return text

  // If keyword exists, try to show context around it
  if (keyword) {
    const index = text.toLowerCase().indexOf(keyword.toLowerCase())
    if (index !== -1) {
      const start = Math.max(0, index - Math.floor(maxLength / 2))
      const end = Math.min(text.length, start + maxLength)
      const excerpt = text.slice(start, end)

      return (start > 0 ? '...' : '') + excerpt + (end < text.length ? '...' : '')
    }
  }

  // Default truncation
  return text.slice(0, maxLength) + '...'
}
