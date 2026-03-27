import { useEffect, useState } from 'react'

import { useI18n } from '@/hooks/useI18n'
import type { PublishPromptPayload, SquareCategory, SquareDifficulty } from '@/types/square'

interface PublishToSquareDialogProps {
  isOpen: boolean
  categories: SquareCategory[]
  initialPayload: PublishPromptPayload
  isSubmitting?: boolean
  onClose: () => void
  onConfirm: (payload: PublishPromptPayload) => void
}

function normalizeRecommendedModels(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function PublishToSquareDialog({
  isOpen,
  categories,
  initialPayload,
  isSubmitting = false,
  onClose,
  onConfirm,
}: PublishToSquareDialogProps) {
  const { t } = useI18n()
  const [title, setTitle] = useState(initialPayload.title)
  const [summary, setSummary] = useState(initialPayload.summary)
  const [category, setCategory] = useState(initialPayload.category)
  const [difficulty, setDifficulty] = useState<SquareDifficulty>(initialPayload.difficulty)
  const [recommendedModelsInput, setRecommendedModelsInput] = useState(initialPayload.recommended_models?.join(', ') ?? '')
  const [allowFullPreview, setAllowFullPreview] = useState(Boolean(initialPayload.allow_full_preview))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    setTitle(initialPayload.title)
    setSummary(initialPayload.summary)
    setCategory(initialPayload.category)
    setDifficulty(initialPayload.difficulty)
    setRecommendedModelsInput(initialPayload.recommended_models?.join(', ') ?? '')
    setAllowFullPreview(Boolean(initialPayload.allow_full_preview))
    setError(null)
  }, [initialPayload, isOpen])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (!title.trim()) {
      setError(t('promptEditor.publishDialog.titleRequired'))
      return
    }

    if (!summary.trim()) {
      setError(t('promptEditor.publishDialog.summaryRequired'))
      return
    }

    if (!category.trim()) {
      setError(t('promptEditor.publishDialog.categoryRequired'))
      return
    }

    setError(null)
    onConfirm({
      title: title.trim(),
      summary: summary.trim(),
      category,
      difficulty,
      recommended_models: normalizeRecommendedModels(recommendedModelsInput),
      allow_full_preview: allowFullPreview,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-ink-900 bg-opacity-50" onClick={onClose} />

      <div className="relative mx-4 w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-ink-900">
              {t('promptEditor.publishDialog.title')}
            </h3>
            <p className="mt-2 text-sm leading-7 text-ink-600">
              {t('promptEditor.publishDialog.description')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button"
            aria-label={t('common.action.cancel')}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-ink-700">
              {t('promptEditor.publishDialog.fields.title')}
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="input"
              placeholder={t('promptEditor.publishDialog.placeholders.title')}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-ink-700">
              {t('promptEditor.publishDialog.fields.summary')}
            </label>
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              className="input min-h-[120px] text-sm"
              placeholder={t('promptEditor.publishDialog.placeholders.summary')}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink-700">
              {t('promptEditor.publishDialog.fields.category')}
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="toolbar-select w-full"
            >
              {categories.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink-700">
              {t('promptEditor.publishDialog.fields.difficulty')}
            </label>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as SquareDifficulty)}
              className="toolbar-select w-full"
            >
              <option value="simple">{t('square.difficulty.simple')}</option>
              <option value="medium">{t('square.difficulty.medium')}</option>
              <option value="advanced">{t('square.difficulty.advanced')}</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-ink-700">
              {t('promptEditor.publishDialog.fields.recommendedModels')}
            </label>
            <input
              value={recommendedModelsInput}
              onChange={(event) => setRecommendedModelsInput(event.target.value)}
              className="input"
              placeholder={t('promptEditor.publishDialog.placeholders.recommendedModels')}
            />
          </div>

          <div className="md:col-span-2 rounded-[20px] border border-[rgba(122,102,82,0.12)] bg-[rgba(248,244,236,0.55)] px-4 py-3">
            <label className="flex items-start gap-3 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={allowFullPreview}
                onChange={(event) => setAllowFullPreview(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-ink-300"
              />
              <span>
                <span className="block font-medium text-ink-900">
                  {t('promptEditor.publishDialog.fields.allowFullPreview')}
                </span>
                <span className="mt-1 block text-xs leading-6 text-ink-500">
                  {t('promptEditor.publishDialog.allowFullPreviewHint')}
                </span>
              </span>
            </label>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
            {t('common.action.cancel')}
          </button>
          <button type="button" onClick={handleConfirm} className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? t('promptEditor.publishingToSquare') : t('promptEditor.publishDialog.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
