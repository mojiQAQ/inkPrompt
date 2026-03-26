/**
 * Tag filter component for filtering prompts by tags
 */
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import { getTags } from '@/api/tags'
import type { Tag } from '@/api/tags'

interface TagFilterProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  tagLogic: 'AND' | 'OR'
  onLogicChange: (logic: 'AND' | 'OR') => void
}

export function TagFilter({ selectedTags, onTagsChange, tagLogic, onLogicChange }: TagFilterProps) {
  const { getAccessToken } = useAuth()
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const showAll = false
  const [showModal, setShowModal] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      setLoading(true)
      const token = await getAccessToken()
      if (!token) return

      const data = await getTags(token, {
        popular_only: true,
        limit: showAll ? 100 : 20,
      })
      setAvailableTags(data.items)
    } catch (err) {
      console.error('Failed to load tags:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter((t) => t !== tagName))
    } else {
      onTagsChange([...selectedTags, tagName])
    }
  }

  const clearTags = () => {
    onTagsChange([])
  }

  // Close modal on outside click
  useEffect(() => {
    if (!showModal) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Check if click is outside modal
      if (target.closest('[data-tag-modal]') === null &&
          target.closest('[data-tag-toggle]') === null) {
        setShowModal(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showModal])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-500">
        <div className="w-4 h-4 border-2 border-ink-300 border-t-accent-purple rounded-full animate-spin" />
        加载标签...
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header with logic toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-700">标签筛选</h3>
        {selectedTags.length > 0 && (
          <div className="flex items-center gap-2">
            {/* Logic toggle */}
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => onLogicChange('OR')}
                className={`px-2 py-1 rounded ${
                  tagLogic === 'OR'
                    ? 'bg-accent-purple text-white'
                    : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                }`}
              >
                或
              </button>
              <button
                onClick={() => onLogicChange('AND')}
                className={`px-2 py-1 rounded ${
                  tagLogic === 'AND'
                    ? 'bg-accent-purple text-white'
                    : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                }`}
              >
                且
              </button>
            </div>
            {/* Clear button */}
            <button
              onClick={clearTags}
              className="text-xs text-ink-500 hover:text-ink-700 underline"
            >
              清除
            </button>
          </div>
        )}
      </div>

      {/* Tag cloud - Single line with gradient fade effect */}
      <div className="relative flex items-center gap-2">
        {/* Tags container with overflow and fade effect */}
        <div className="relative flex-1 overflow-hidden">
          <div className="flex gap-2">
            {availableTags.slice(0, 4).map((tag, index) => {
              const isSelected = selectedTags.includes(tag.name)
              const isSystem = tag.is_system
              const isLast = index === 3 && availableTags.length > 4

              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.name)}
                  className={`
                    flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-accent-purple text-white shadow-sm'
                      : isSystem
                        ? 'bg-accent-orange/10 text-accent-orange hover:bg-accent-orange/20'
                        : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                    }
                    ${isLast ? 'opacity-60' : ''}
                  `}
                >
                  {tag.name}
                  {tag.use_count > 0 && (
                    <span className="ml-1.5 text-xs opacity-75">
                      {tag.use_count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Gradient fade overlay on the right */}
          {availableTags.length > 4 && (
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none" />
          )}
        </div>

        {/* Show more button - compact */}
        {availableTags.length > 4 && (
          <button
            ref={buttonRef}
            data-tag-toggle
            onClick={() => setShowModal(!showModal)}
            className="flex-shrink-0 px-2.5 py-1.5 text-xs text-ink-600 hover:text-accent-purple hover:bg-ink-50 rounded-lg transition-colors border border-ink-200 font-medium"
            title={`查看所有 ${availableTags.length} 个标签`}
          >
            +{availableTags.length - 3}
          </button>
        )}
      </div>

      {/* Modal for all tags */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            data-tag-modal
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col m-4"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200">
              <h3 className="text-lg font-semibold text-ink-900">选择标签</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-ink-600 hover:bg-ink-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.name)
                  const isSystem = tag.is_system

                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.name)}
                      className={`
                        px-3 py-1.5 rounded-full text-sm font-medium transition-all
                        ${isSelected
                          ? 'bg-accent-purple text-white shadow-sm'
                          : isSystem
                            ? 'bg-accent-orange/10 text-accent-orange hover:bg-accent-orange/20'
                            : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                        }
                      `}
                    >
                      {tag.name}
                      {tag.use_count > 0 && (
                        <span className="ml-1.5 text-xs opacity-75">
                          {tag.use_count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-ink-200 flex items-center justify-between">
              <p className="text-sm text-ink-600">
                已选择 {selectedTags.length} 个标签
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearTags}
                  className="px-4 py-2 text-sm text-ink-600 hover:bg-ink-100 rounded-lg transition-colors"
                >
                  清除全部
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm bg-accent-purple text-white rounded-lg hover:bg-accent-purple/90 transition-colors"
                >
                  完成
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Selected tags summary */}
      {selectedTags.length > 0 && (
        <div className="pt-2 border-t border-ink-200">
          <p className="text-xs text-ink-500">
            已选择 {selectedTags.length} 个标签
            {tagLogic === 'AND' ? '（同时包含）' : '（包含任一）'}
          </p>
        </div>
      )}
    </div>
  )
}
