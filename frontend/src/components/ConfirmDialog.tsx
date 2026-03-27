/**
 * Confirm dialog component
 */
import { useEffect } from 'react'

import { useI18n } from '@/hooks/useI18n'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmDialogProps) {
  const { t } = useI18n()
  const resolvedConfirmLabel = confirmLabel ?? t('common.action.confirm')
  const resolvedCancelLabel = cancelLabel ?? t('common.action.cancel')

  // Handle ESC key to close dialog
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-900 bg-opacity-50"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-ink-900 mb-2">
          {title}
        </h3>

        <p className="text-ink-600 mb-6">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="btn btn-secondary"
          >
            {resolvedCancelLabel}
          </button>

          <button
            onClick={onConfirm}
            className={`btn ${danger ? 'bg-red-600 text-white hover:bg-red-700' : 'btn-primary'}`}
          >
            {resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
