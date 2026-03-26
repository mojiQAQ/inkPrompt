/**
 * Version detail dialog component
 */
import type { PromptVersion } from '@/types/prompt'

interface VersionDetailDialogProps {
  version: PromptVersion | null
  isOpen: boolean
  onClose: () => void
  onRestore?: (version: PromptVersion) => void
}

export function VersionDetailDialog({
  version,
  isOpen,
  onClose,
  onRestore,
}: VersionDetailDialogProps) {
  if (!isOpen || !version) return null

  const handleRestore = () => {
    if (onRestore && window.confirm(`确定要恢复到版本 ${version.version_number} 吗?`)) {
      onRestore(version)
      onClose()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="dialog-surface flex max-h-[80vh] w-full max-w-3xl flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-ink-900">
                版本 {version.version_number}
              </h2>
              <p className="text-sm text-ink-500 mt-1">{formatDate(version.created_at)}</p>
            </div>
            <button
              onClick={onClose}
              className="icon-button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Metadata */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="metric-chip">
              <svg className="w-4 h-4 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              <span className="text-sm font-semibold text-ink-700">{version.token_count}</span>
              <span className="text-xs text-ink-500">tokens</span>
            </div>

            {version.change_note && (
              <div className="panel-card-muted text-sm text-ink-600">
                <span className="font-medium">变更说明:</span> {version.change_note}
              </div>
            )}
          </div>
        </div>

        <div className="dialog-body flex-1 overflow-y-auto">
          <div className="workspace-paper">
            <pre className="whitespace-pre-wrap text-sm text-ink-700 font-mono leading-7">
              {version.content}
            </pre>
          </div>
        </div>

        <div className="dialog-footer">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            关闭
          </button>
          {onRestore && (
            <button
              onClick={handleRestore}
              className="btn btn-primary"
            >
              恢复此版本
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
