/**
 * Slide-over drawer for prompt version history.
 */
import { useEffect } from 'react'
import { PromptVersion } from '@/types/prompt'

interface VersionHistoryDrawerProps {
  isOpen: boolean
  versions: PromptVersion[]
  currentVersionId?: string | null
  onClose: () => void
  onSelectVersion?: (version: PromptVersion) => void
  onCompareVersion?: (version: PromptVersion) => void
  onRestoreVersion?: (version: PromptVersion) => void
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function VersionHistoryDrawer({
  isOpen,
  versions,
  currentVersionId,
  onClose,
  onSelectVersion,
  onCompareVersion,
  onRestoreVersion,
}: VersionHistoryDrawerProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]"
        aria-label="关闭版本历史"
        onClick={onClose}
      />

      <aside className="dialog-surface absolute right-0 top-0 flex h-full w-full max-w-[540px] flex-col rounded-none border-y-0 border-r-0 drawer-enter">
        <div className="dialog-header">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-ink-900">版本历史</h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="icon-button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {versions.length === 0 ? (
            <div className="panel-empty">
              <p className="text-sm font-medium text-ink-700">暂无历史版本</p>
            </div>
          ) : (
            versions.map((version) => {
              const isCurrent = version.id === currentVersionId

              return (
                <article
                  key={version.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    isCurrent
                      ? 'border-indigo-300 bg-indigo-50/70 shadow-soft'
                      : 'border-ink-200 bg-white/74 hover:border-ink-300 hover:shadow-soft'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-ink-900">版本 {version.version_number}</h3>
                        {isCurrent && (
                          <span className="status-pill status-pill-active">当前</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-ink-500">{formatDate(version.created_at)}</p>
                    </div>

                    <div className="flex items-center gap-2 rounded-full bg-ink-50 px-3 py-1 text-xs font-semibold text-ink-700">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      {version.token_count}
                    </div>
                  </div>

                  {version.change_note && (
                    <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-sm text-ink-700">
                      {version.change_note}
                    </div>
                  )}

                  <div className="mt-3 rounded-xl bg-ink-50 px-3 py-2 text-sm text-ink-600">
                    <p className="line-clamp-3 whitespace-pre-wrap font-mono text-[13px] leading-6">
                      {version.content}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {onSelectVersion && (
                      <button
                        type="button"
                        onClick={() => onSelectVersion(version)}
                        className="btn btn-secondary btn-small"
                      >
                        查看详情
                      </button>
                    )}
                    {onCompareVersion && (
                      <button
                        type="button"
                        onClick={() => onCompareVersion(version)}
                        className="btn btn-ghost btn-small"
                      >
                        对比
                      </button>
                    )}
                    {onRestoreVersion && !isCurrent && (
                      <button
                        type="button"
                        onClick={() => onRestoreVersion(version)}
                        className="btn btn-primary btn-small"
                      >
                        回滚到此版本
                      </button>
                    )}
                  </div>
                </article>
              )
            })
          )}
        </div>
      </aside>
    </div>
  )
}
