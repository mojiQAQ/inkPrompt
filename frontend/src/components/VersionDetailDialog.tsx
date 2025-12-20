/**
 * Version detail dialog component
 */
import { PromptVersion } from '@/api/versions'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-ink-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-ink-900">
                版本 {version.version_number}
              </h2>
              <p className="text-sm text-ink-500 mt-1">{formatDate(version.created_at)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-ink-600 hover:text-ink-900 hover:bg-ink-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-ink-50 rounded-md">
              <svg className="w-4 h-4 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              <span className="text-sm font-semibold text-ink-700">{version.token_count}</span>
              <span className="text-xs text-ink-500">tokens</span>
            </div>

            {version.change_note && (
              <div className="text-sm text-ink-600">
                <span className="font-medium">变更说明:</span> {version.change_note}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-ink-700 font-mono bg-ink-50 p-4 rounded-lg">
              {version.content}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-ink-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-ink-600 hover:bg-ink-100 rounded-lg transition-colors"
          >
            关闭
          </button>
          {onRestore && (
            <button
              onClick={handleRestore}
              className="px-4 py-2 bg-accent-purple text-white hover:bg-accent-purple/90 rounded-lg transition-colors"
            >
              恢复此版本
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
