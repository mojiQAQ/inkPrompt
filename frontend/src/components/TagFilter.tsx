import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

import { getTags } from '@/api/tags'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import type { Tag } from '@/api/tags'

interface TagFilterProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  tagLogic: 'AND' | 'OR'
  onLogicChange: (logic: 'AND' | 'OR') => void
}

export function TagFilter({ selectedTags, onTagsChange, tagLogic, onLogicChange }: TagFilterProps) {
  const { getAccessToken } = useAuth()
  const { t } = useI18n()
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    void loadTags()
  }, [])

  const loadTags = async () => {
    try {
      setLoading(true)
      const token = await getAccessToken()
      if (!token) return

      const data = await getTags(token, {
        popular_only: true,
        limit: 20,
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
      onTagsChange(selectedTags.filter((tag) => tag !== tagName))
      return
    }

    onTagsChange([...selectedTags, tagName])
  }

  const clearTags = () => {
    onTagsChange([])
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className={`tag-filter-trigger ${selectedTags.length > 0 ? 'tag-filter-trigger-active' : ''}`}
          title={t('tagFilter.viewAll', { count: availableTags.length })}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 12h12m-9 8h6" />
          </svg>
          <span>{t('tagFilter.title')}</span>
          {loading ? (
            <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />
          ) : selectedTags.length > 0 ? (
            <span className="tag-filter-count">
              {selectedTags.length}
            </span>
          ) : null}
        </button>

        {selectedTags.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-[rgba(122,102,82,0.12)] bg-white/72 p-1">
              <button
                type="button"
                onClick={() => onLogicChange('OR')}
                className={`tag-logic-btn ${tagLogic === 'OR' ? 'tag-logic-btn-active' : ''}`}
              >
                {t('tagFilter.logicOr')}
              </button>
              <button
                type="button"
                onClick={() => onLogicChange('AND')}
                className={`tag-logic-btn ${tagLogic === 'AND' ? 'tag-logic-btn-active' : ''}`}
              >
                {t('tagFilter.logicAnd')}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedTags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="tag-selected-chip"
                >
                  <span className="truncate max-w-[7rem]">{tag}</span>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
              {selectedTags.length > 3 ? (
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="tag-cloud-more"
                >
                  +{selectedTags.length - 3}
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={clearTags}
              className="text-xs font-medium text-ink-500 transition-colors hover:text-ink-900"
            >
              {t('tagFilter.clear')}
            </button>
          </div>
        ) : null}
      </div>

      {showModal
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
              <div className="dialog-surface w-full max-w-3xl">
                <div className="dialog-header flex items-center justify-between gap-4">
                  <div>
                    <p className="panel-kicker">{t('tagFilter.title')}</p>
                    <h3 className="mt-2 text-xl font-semibold text-ink-900">
                      {t('tagFilter.selectTags')}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="icon-button"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="dialog-body">
                  <div className="mb-5 flex items-center gap-2 rounded-full border border-[rgba(122,102,82,0.12)] bg-white/70 p-1">
                    <button
                      type="button"
                      onClick={() => onLogicChange('OR')}
                      className={`tag-logic-btn ${tagLogic === 'OR' ? 'tag-logic-btn-active' : ''}`}
                    >
                      {t('tagFilter.logicOr')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onLogicChange('AND')}
                      className={`tag-logic-btn ${tagLogic === 'AND' ? 'tag-logic-btn-active' : ''}`}
                    >
                      {t('tagFilter.logicAnd')}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {availableTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag.name)
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.name)}
                          className={`tag-cloud-chip ${isSelected ? 'tag-cloud-chip-active' : ''}`}
                        >
                          <span>{tag.name}</span>
                          {tag.use_count > 0 ? (
                            <span className="text-[11px] opacity-70">{tag.use_count}</span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="dialog-footer justify-between">
                  <p className="text-sm text-ink-600">
                    {t('tagFilter.selectedCount', { count: selectedTags.length })}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={clearTags}
                      className="btn btn-secondary"
                    >
                      {t('common.action.clearAll')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn btn-primary"
                    >
                      {t('tagFilter.complete')}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
