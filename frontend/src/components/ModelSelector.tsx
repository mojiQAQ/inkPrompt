/**
 * Multi-select model picker used by the test panel.
 */
interface TestModelOption {
  id: string
  name: string
  model: string
  provider?: string
  baseUrl?: string
  description?: string
  disabled?: boolean
}

interface ModelSelectorProps {
  options: TestModelOption[]
  selectedIds: string[]
  maxSelected?: number
  onChange: (selectedIds: string[]) => void
  title?: string
  hint?: string
}

export type { TestModelOption }

export function ModelSelector({
  options,
  selectedIds,
  maxSelected,
  onChange,
  title = '选择模型',
  hint = '',
}: ModelSelectorProps) {
  const selectedCount = selectedIds.length

  const toggleModel = (modelId: string) => {
    const exists = selectedIds.includes(modelId)

    if (exists) {
      onChange(selectedIds.filter((id) => id !== modelId))
      return
    }

    if (maxSelected && selectedCount >= maxSelected) {
      return
    }

    onChange([...selectedIds, modelId])
  }

  return (
    <section className="panel-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-ink-900">{title}</h3>
          {hint ? <p className="mt-1 text-sm text-ink-500">{hint}</p> : null}
        </div>

        <div className="rounded-full bg-ink-50 px-3 py-1 text-xs font-semibold text-ink-600">
          {selectedCount}{maxSelected ? ` / ${maxSelected}` : ''}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const selected = selectedIds.includes(option.id)
          const disabled = option.disabled || (!!maxSelected && selectedCount >= maxSelected && !selected)

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => toggleModel(option.id)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                selected
                  ? 'border-indigo-300 bg-indigo-50/70 shadow-soft'
                  : 'border-ink-200 bg-white/60 hover:border-ink-300 hover:bg-white'
              } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink-900">{option.name}</span>
                    {selected && <span className="status-pill status-pill-active">已选</span>}
                  </div>
                  <div className="mt-1 text-xs text-ink-500">
                    {option.provider ? `${option.provider} · ` : ''}
                    {option.model}
                  </div>
                </div>

                <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border ${selected ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-ink-300 bg-white'}`}>
                  {selected && (
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              </div>

              {option.description && (
                <p className="mt-3 text-sm leading-6 text-ink-600">
                  {option.description}
                </p>
              )}

              {option.baseUrl && (
                <div className="mt-3 text-xs text-ink-400">
                  {option.baseUrl}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => onChange([])}
          className="btn btn-ghost btn-small"
        >
          清空选择
        </button>
      </div>
    </section>
  )
}
