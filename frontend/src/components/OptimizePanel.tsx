/**
 * Pure props-driven optimize panel.
 */
import { useI18n } from '@/hooks/useI18n'

export interface OptimizeSuggestion {
  id: string
  question: string
  options: Array<{
    id: string
    label: string
  }>
}

export interface OptimizeRound {
  id: string
  roundNumber: number
  createdAt: string
  optimizedContent: string
  userIdea?: string
  selectedSuggestions?: Record<string, string[]>
  suggestions: OptimizeSuggestion[]
  domainAnalysis?: string
  versionId?: string
}

interface OptimizePanelProps {
  promptName: string
  currentContent: string
  rounds: OptimizeRound[]
  suggestions: OptimizeSuggestion[]
  userIdea: string
  selectedSuggestions: Record<string, string[]>
  isOptimizing?: boolean
  onClose: () => void
  onUserIdeaChange: (value: string) => void
  onToggleSuggestionOption: (question: string, option: string) => void
  onStartOptimize: () => void
  onReset?: () => void
}

export function OptimizePanel({
  suggestions,
  userIdea,
  selectedSuggestions,
  isOptimizing = false,
  onClose,
  onUserIdeaChange,
  onToggleSuggestionOption,
  onStartOptimize,
  onReset,
}: OptimizePanelProps) {
  const { t } = useI18n()
  const selectedCount = Object.values(selectedSuggestions).reduce((count, items) => count + items.length, 0)

  return (
    <section className="panel-shell h-full">
      <div className="panel-shell-header">
        <div>
          <h3 className="text-xl font-semibold text-ink-900">{t('optimizePanel.title')}</h3>
        </div>

        <button type="button" onClick={onClose} className="icon-button">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="panel-shell-body space-y-5">
        <div className="panel-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="panel-section-title">{t('optimizePanel.idea')}</h4>
            </div>
            {onReset && (
              <button type="button" onClick={onReset} className="btn btn-ghost btn-small">
                {t('optimizePanel.reset')}
              </button>
            )}
          </div>

          <textarea
            value={userIdea}
            onChange={(event) => onUserIdeaChange(event.target.value)}
            className="input mt-4 min-h-[120px] resize-none"
            placeholder={t('optimizePanel.ideaPlaceholder')}
          />
        </div>

        {suggestions.length > 0 ? (
          <div className="panel-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="panel-section-title">{t('optimizePanel.suggestions')}</h4>
              </div>
              <span className="text-xs text-ink-400">{t('optimizePanel.selectedItems', { count: selectedCount })}</span>
            </div>

            <div className="mt-4 space-y-3">
              {suggestions.map((suggestion) => {
                const activeOptions = selectedSuggestions[suggestion.question] ?? []

                return (
                  <div
                    key={suggestion.id}
                    className={`rounded-2xl border p-4 transition-all ${
                      activeOptions.length > 0
                        ? 'border-indigo-300 bg-indigo-50/70 shadow-soft'
                        : 'border-ink-200 bg-white/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold text-ink-900">{suggestion.question}</span>
                      <span className="text-xs text-ink-400">{t('optimizePanel.selectedItems', { count: activeOptions.length })}</span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {suggestion.options.map((option) => {
                        const checked = activeOptions.includes(option.label)

                        return (
                          <label
                            key={option.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 transition-all ${
                              checked
                                ? 'border-indigo-300 bg-white shadow-soft'
                                : 'border-transparent bg-white/76 hover:border-ink-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => onToggleSuggestionOption(suggestion.question, option.label)}
                              className="h-4 w-4 rounded border-ink-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm leading-6 text-ink-700">{option.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="panel-shell-footer flex justify-end">
        <button
          type="button"
          onClick={onStartOptimize}
          disabled={isOptimizing}
          className="btn btn-primary"
        >
          {isOptimizing ? t('optimizePanel.running') : t('optimizePanel.start')}
        </button>
      </div>
    </section>
  )
}
