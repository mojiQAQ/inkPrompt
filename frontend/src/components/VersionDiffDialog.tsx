/**
 * Side-by-side version diff dialog.
 */
import { useEffect, useMemo } from 'react'
import { useI18n } from '@/hooks/useI18n'
import { PromptVersion } from '@/types/prompt'

interface VersionDiffDialogProps {
  isOpen: boolean
  baseVersion: PromptVersion | null
  compareVersion: PromptVersion | null
  onClose: () => void
}

type DiffRowType = 'same' | 'change' | 'left-only' | 'right-only'

interface DiffRow {
  leftLineNumber: number | null
  rightLineNumber: number | null
  left: string
  right: string
  type: DiffRowType
}

function buildRows(left: string[], right: string[]) {
  const rows: DiffRow[] = []
  const total = Math.max(left.length, right.length)

  for (let index = 0; index < total; index += 1) {
    const leftValue = left[index] ?? ''
    const rightValue = right[index] ?? ''

    let type: DiffRowType = 'same'
    if (leftValue && !rightValue) type = 'left-only'
    else if (!leftValue && rightValue) type = 'right-only'
    else if (leftValue !== rightValue) type = 'change'

    rows.push({
      leftLineNumber: left[index] ? index + 1 : null,
      rightLineNumber: right[index] ? index + 1 : null,
      left: leftValue,
      right: rightValue,
      type,
    })
  }

  return rows
}

function getLineClass(type: DiffRowType, side: 'left' | 'right') {
  if (type === 'same') {
    return 'bg-white text-ink-700'
  }

  if (type === 'change') {
    return side === 'left'
      ? 'bg-amber-50 text-amber-900'
      : 'bg-emerald-50 text-emerald-900'
  }

  if (type === 'left-only') {
    return side === 'left'
      ? 'bg-rose-50 text-rose-900'
      : 'bg-ink-50 text-ink-300'
  }

  return side === 'right'
    ? 'bg-emerald-50 text-emerald-900'
    : 'bg-ink-50 text-ink-300'
}

export function VersionDiffDialog({
  isOpen,
  baseVersion,
  compareVersion,
  onClose,
}: VersionDiffDialogProps) {
  const { t } = useI18n()

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

  const rows = useMemo(() => {
    if (!baseVersion || !compareVersion) return []
    return buildRows(
      baseVersion.content.replace(/\r\n/g, '\n').split('\n'),
      compareVersion.content.replace(/\r\n/g, '\n').split('\n')
    )
  }, [baseVersion, compareVersion])

  if (!isOpen || !baseVersion || !compareVersion) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/55 backdrop-blur-[2px]"
        aria-label={t('versionDiffDialog.close')}
        onClick={onClose}
      />

      <div className="dialog-surface relative w-full max-w-7xl">
        <div className="dialog-header">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-ink-900">{t('versionDiffDialog.title')}</h2>
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

        <div className="max-h-[72vh] overflow-auto bg-white p-4 pb-6">
          <div className="grid min-w-[900px] grid-cols-2 gap-4">
            <div className="overflow-hidden rounded-[24px] border border-ink-200 bg-white">
              <div className="sticky top-0 z-10 border-b border-ink-200 bg-white px-5 py-3 text-sm font-semibold text-ink-700">
                v{baseVersion.version_number}
              </div>
              <div className="divide-y divide-ink-100">
                {rows.map((row, index) => (
                  <div key={`left-${index}`} className={`grid grid-cols-[52px_minmax(0,1fr)] ${getLineClass(row.type, 'left')}`}>
                    <div className="border-r border-inherit px-3 py-2 text-right font-mono text-[12px] text-ink-400">
                      {row.leftLineNumber ?? ''}
                    </div>
                    <pre className="overflow-x-auto px-4 pt-2 pb-4 whitespace-pre-wrap font-mono text-[13px] leading-6">
                      {row.left || '\u00A0'}
                    </pre>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-ink-200 bg-white">
              <div className="sticky top-0 z-10 border-b border-ink-200 bg-white px-5 py-3 text-sm font-semibold text-ink-700">
                v{compareVersion.version_number}
              </div>
              <div className="divide-y divide-ink-100">
                {rows.map((row, index) => (
                  <div key={`right-${index}`} className={`grid grid-cols-[52px_minmax(0,1fr)] ${getLineClass(row.type, 'right')}`}>
                    <div className="border-r border-inherit px-3 py-2 text-right font-mono text-[12px] text-ink-400">
                      {row.rightLineNumber ?? ''}
                    </div>
                    <pre className="overflow-x-auto px-4 pt-2 pb-4 whitespace-pre-wrap font-mono text-[13px] leading-6">
                      {row.right || '\u00A0'}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
