/**
 * Prompt card component for list display
 */
import { Prompt } from '@/types/prompt'
import { highlightKeyword, truncateText } from '@/utils/highlight'

interface PromptCardProps {
  prompt: Prompt
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onClick: (id: string) => void
  searchKeyword?: string
}

export function PromptCard({ prompt, onEdit, onDelete, onClick, searchKeyword }: PromptCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(prompt.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(prompt.id)
  }

  // Truncate content for preview, keeping keyword visible if present
  const contentPreview = truncateText(prompt.content, 150, searchKeyword)

  return (
    <div
      className="card card-transition cursor-pointer group"
      onClick={() => onClick(prompt.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-ink-900 group-hover:text-accent-purple transition-colors truncate">
            {searchKeyword ? highlightKeyword(prompt.name, searchKeyword) : prompt.name}
          </h3>
          {/* Version count badge */}
          {prompt.version_count > 1 && (
            <span
              className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold bg-accent-purple/10 text-accent-purple rounded-full flex items-center gap-1"
              title={`${prompt.version_count} 个历史版本`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {prompt.version_count}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={handleEdit}
            className="p-2 text-ink-600 hover:text-accent-purple hover:bg-ink-50 rounded-lg transition-colors"
            title="编辑"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-ink-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="删除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Preview - Fixed height for alignment */}
      <div className="h-[4.5rem] mb-4 overflow-hidden">
        <p className="text-ink-600 text-sm line-clamp-3">
          {searchKeyword ? highlightKeyword(contentPreview, searchKeyword) : contentPreview}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-ink-100">
        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          {prompt.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className={`badge ${tag.is_system ? 'badge-system' : 'badge-user'}`}
            >
              {tag.name}
            </span>
          ))}
          {prompt.tags.length > 3 && (
            <span className="text-xs text-ink-400">
              +{prompt.tags.length - 3}
            </span>
          )}
        </div>

        {/* Token Count */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-ink-50 rounded-md">
          <svg className="w-4 h-4 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
          <span className="text-sm font-semibold text-ink-700">{prompt.token_count}</span>
          <span className="text-xs text-ink-500">tokens</span>
        </div>
      </div>

      {/* Date */}
      <div className="mt-3 text-xs text-ink-400">
        {new Date(prompt.updated_at).toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </div>
    </div>
  )
}
