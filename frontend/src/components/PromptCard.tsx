import { useState } from 'react'
import toast from 'react-hot-toast'

import { toggleFavorite } from '@/api/folders'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import { Prompt } from '@/types/prompt'
import { highlightKeyword, truncateText } from '@/utils/highlight'

interface PromptCardProps {
  prompt: Prompt
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onClick: (id: string) => void
  onAddToFolder?: (prompt: Prompt) => void
  onFavoriteToggled?: () => void
  searchKeyword?: string
}

export function PromptCard({
  prompt,
  onEdit,
  onDelete,
  onClick,
  onAddToFolder,
  onFavoriteToggled,
  searchKeyword,
}: PromptCardProps) {
  const { getAccessToken } = useAuth()
  const { t, formatDate } = useI18n()
  const [isFavorited, setIsFavorited] = useState(prompt.is_favorited)
  const [togglingFav, setTogglingFav] = useState(false)

  const contentPreview = truncateText(prompt.content, 180, searchKeyword)

  const handleFavorite = async (event: React.MouseEvent) => {
    event.stopPropagation()
    if (togglingFav) return

    setTogglingFav(true)
    try {
      const token = await getAccessToken()
      if (!token) return

      const result = await toggleFavorite(token, prompt.id)
      setIsFavorited(result.is_favorited)
      toast.success(
        result.is_favorited ? t('promptCard.favorited') : t('promptCard.unfavorited'),
      )
      onFavoriteToggled?.()
    } catch {
      toast.error(t('promptCard.actionFailed'))
    } finally {
      setTogglingFav(false)
    }
  }

  const handleAction = (
    event: React.MouseEvent,
    callback: () => void,
  ) => {
    event.stopPropagation()
    callback()
  }

  const handleCopyContent = async (event: React.MouseEvent) => {
    event.stopPropagation()

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable')
      }

      await navigator.clipboard.writeText(prompt.content)
      toast.success(t('promptCard.copied'))
    } catch {
      toast.error(t('promptCard.copyFailed'))
    }
  }

  return (
    <article
      className="prompt-card-shell group flex h-full cursor-pointer flex-col"
      onClick={() => onClick(prompt.id)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-semibold text-ink-900 transition-colors group-hover:text-[#3f3aa8]">
            {searchKeyword ? highlightKeyword(prompt.name, searchKeyword) : prompt.name}
          </h3>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-[rgba(122,102,82,0.1)] bg-white/84 p-1 shadow-[0_16px_28px_-28px_rgba(31,41,55,0.5)]">
          <button
            type="button"
            onClick={handleFavorite}
            disabled={togglingFav}
            className={`prompt-card-icon ${isFavorited ? 'text-yellow-500' : 'text-ink-400'}`}
            title={isFavorited ? t('promptCard.unfavorite') : t('promptCard.favorite')}
          >
            <svg className="h-4 w-4" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={(event) => handleAction(event, () => onAddToFolder?.(prompt))}
            className="prompt-card-icon"
            title={t('promptCard.addToFolder')}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleCopyContent}
            className="prompt-card-icon"
            title={t('promptCard.copy')}
            aria-label={t('promptCard.copy')}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-2m-4 4H6a2 2 0 01-2-2V9a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(event) => handleAction(event, () => onEdit(prompt.id))}
            className="prompt-card-icon"
            title={t('promptCard.edit')}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(event) => handleAction(event, () => onDelete(prompt.id))}
            className="prompt-card-icon hover:text-rose-600"
            title={t('promptCard.delete')}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="prompt-card-preview mt-6">
        <p className="line-clamp-4 text-sm leading-7 text-ink-700">
          {searchKeyword ? highlightKeyword(contentPreview, searchKeyword) : contentPreview}
        </p>
      </div>

      <div className="mt-6 flex min-h-[2.625rem] flex-wrap content-start items-start gap-2">
          {prompt.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className={`badge ${tag.is_system ? 'badge-system' : 'badge-user'}`}
            >
              {tag.name}
            </span>
          ))}
          {prompt.tags.length > 3 ? (
            <span className="rounded-full border border-[rgba(122,102,82,0.12)] bg-white/76 px-2.5 py-1 text-xs font-medium text-ink-500">
              +{prompt.tags.length - 3}
            </span>
          ) : null}
      </div>

      <div className="mt-auto flex items-end justify-between gap-4 border-t border-[rgba(122,102,82,0.12)] pt-4">
        <div className="text-xs leading-6 text-ink-500">
          {t('promptCard.updatedAt', {
            date: formatDate(prompt.updated_at, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          })}
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(122,102,82,0.12)] bg-white/84 px-3 py-1.5">
          <svg className="h-4 w-4 text-ink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
          <span className="text-sm font-semibold text-ink-800">{prompt.token_count}</span>
          <span className="text-xs text-ink-500">{t('common.tokens')}</span>
        </div>
      </div>
    </article>
  )
}
