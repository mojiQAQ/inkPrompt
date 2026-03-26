/**
 * Version list component showing all historical versions of a prompt
 */
import { useState } from 'react'
import type { PromptVersion } from '@/types/prompt'

interface VersionListProps {
  versions: PromptVersion[]
  onViewVersion: (version: PromptVersion) => void
  onRestoreVersion: (version: PromptVersion) => void
}

export function VersionList({ versions, onViewVersion, onRestoreVersion }: VersionListProps) {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)

  const handleViewClick = (version: PromptVersion) => {
    setSelectedVersion(version.id)
    onViewVersion(version)
  }

  const handleRestoreClick = (version: PromptVersion) => {
    if (window.confirm(`确定要恢复到版本 ${version.version_number} 吗?这将创建一个新版本。`)) {
      onRestoreVersion(version)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-12 text-ink-500">
        <p>暂无历史版本</p>
        <p className="text-sm mt-2">修改提示词内容后会自动创建新版本</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-accent-purple via-ink-200 to-ink-100" />

      <div className="space-y-6">
        {versions.map((version, index) => (
          <div
            key={version.id}
            className="relative pl-12"
          >
            {/* Timeline node */}
            <div className={`
              absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center
              ${index === 0
                ? 'bg-gradient-to-br from-accent-purple to-accent-purple/80 shadow-lg shadow-accent-purple/30'
                : 'bg-white border-2 border-ink-200'
              }
            `}>
              {index === 0 ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              ) : (
                <span className="text-sm font-semibold text-ink-600">v{version.version_number}</span>
              )}
            </div>

            {/* Version card */}
            <div className={`
              border rounded-lg p-4 transition-all
              ${selectedVersion === version.id
                ? 'bg-accent-purple/5 border-accent-purple shadow-md'
                : index === 0
                  ? 'border-accent-purple/30 bg-white shadow-sm'
                  : 'border-ink-200 bg-white hover:border-ink-300 hover:shadow-sm'
              }
            `}>
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-bold ${index === 0 ? 'text-accent-purple' : 'text-ink-900'}`}>
                      版本 {version.version_number}
                    </span>
                    {index === 0 && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-accent-purple text-white rounded-full">
                        当前
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-500">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDate(version.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-ink-50 rounded-md">
                  <svg className="w-4 h-4 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  <span className="text-sm font-semibold text-ink-700">{version.token_count}</span>
                </div>
              </div>

              {/* Change note */}
              {version.change_note && (
                <div className="mb-3 p-3 bg-gradient-to-r from-accent-purple/5 to-transparent rounded-lg border-l-2 border-accent-purple">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-accent-purple flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="text-sm text-ink-700">{version.change_note}</span>
                  </div>
                </div>
              )}

              {/* Content preview */}
              <div className="text-sm text-ink-600 mb-3 p-3 bg-ink-50 rounded-md font-mono line-clamp-2">
                {version.content}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewClick(version)}
                  className={`
                    text-sm px-3 py-1.5 rounded-md transition-all font-medium
                    ${index === 0
                      ? 'text-accent-purple bg-accent-purple/10 hover:bg-accent-purple/20'
                      : 'text-accent-purple hover:bg-accent-purple/10'
                    }
                  `}
                >
                  查看详情
                </button>
                {index !== 0 && (
                  <button
                    onClick={() => handleRestoreClick(version)}
                    className="text-sm px-3 py-1.5 text-ink-600 hover:bg-ink-100 rounded-md transition-colors font-medium"
                  >
                    恢复此版本
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
