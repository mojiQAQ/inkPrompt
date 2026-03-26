/**
 * Pure props-driven optimize panel.
 */
import { MarkdownRenderer } from '@/components/MarkdownRenderer'

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

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function OptimizePanel({
  rounds,
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
  const selectedCount = Object.values(selectedSuggestions).reduce((count, items) => count + items.length, 0)

  return (
    <section className="panel-shell h-full">
      <div className="panel-shell-header">
        <div>
          <h3 className="text-xl font-semibold text-ink-900">提示词优化</h3>
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
              <h4 className="panel-section-title">优化想法</h4>
            </div>
            {onReset && (
              <button type="button" onClick={onReset} className="btn btn-ghost btn-small">
                重置
              </button>
            )}
          </div>

          <textarea
            value={userIdea}
            onChange={(event) => onUserIdeaChange(event.target.value)}
            className="input mt-4 min-h-[120px] resize-none"
            placeholder="例如：加强角色定位，补充输出格式，并增加异常场景处理。"
          />
        </div>

        <div className="panel-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="panel-section-title">可选建议</h4>
            </div>
            <span className="text-xs text-ink-400">{selectedCount}</span>
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
                    <span className="text-xs text-ink-400">{activeOptions.length} 项</span>
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

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-ink-400">{selectedCount} 项</p>
          <button
            type="button"
            onClick={onStartOptimize}
            disabled={isOptimizing}
            className="btn btn-primary"
          >
            {isOptimizing ? '优化中...' : '开始优化'}
          </button>
        </div>

        <div className="panel-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-ink-900">优化历史</h4>
            </div>
            <span className="text-xs text-ink-400">{rounds.length} 轮</span>
          </div>

          <div className="mt-4 space-y-3">
            {rounds.length === 0 ? (
              <div className="panel-empty">
                <p className="text-sm font-medium text-ink-700">还没有优化记录</p>
              </div>
            ) : (
              rounds.map((round) => (
                <article key={round.id} className="panel-card-muted">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink-900">第 {round.roundNumber} 轮</span>
                        {round.versionId && <span className="status-pill status-pill-active">版本 {round.versionId}</span>}
                      </div>
                      <p className="mt-1 text-xs text-ink-500">{formatDate(round.createdAt)}</p>
                    </div>
                    <span className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-600">
                      {round.suggestions.length} 条建议
                    </span>
                  </div>

                  {round.domainAnalysis && (
                    <div className="mt-3 rounded-2xl border border-ink-200 bg-white p-3 text-sm leading-6 text-ink-600">
                      {round.domainAnalysis}
                    </div>
                  )}

                  <div className="mt-3 rounded-2xl bg-white p-3">
                    <MarkdownRenderer content={round.optimizedContent} className="text-sm" />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {round.suggestions.map((suggestion) => (
                      <div key={suggestion.id} className="rounded-2xl bg-white/80 px-3 py-2 text-xs text-ink-600">
                        <span className="font-semibold text-ink-900">{suggestion.question}</span>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {suggestion.options.map((option) => {
                            const selected = round.selectedSuggestions?.[suggestion.question]?.includes(option.label)
                            return (
                              <span
                                key={option.id}
                                className={`badge ${selected ? 'badge-system' : 'bg-ink-100 text-ink-500'}`}
                              >
                                {option.label}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
