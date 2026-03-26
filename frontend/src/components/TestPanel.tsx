/**
 * Prompt test panel with model cards and fixed footer actions.
 */
import { useEffect, useMemo, useState } from 'react'

export type ModelOutputStatus = 'idle' | 'streaming' | 'done' | 'error'

export interface ModelOutputMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface TestModelOption {
  id: string
  name: string
  model: string
  provider?: string
  baseUrl?: string
  description?: string
  disabled?: boolean
}

export interface TestPanelModel {
  id: string
  name: string
  model: string
  baseUrl: string
  apiKey?: string
  provider?: string
  isCustom?: boolean
}

export interface CustomTestModelInput {
  name: string
  model: string
  baseUrl: string
  apiKey: string
}

export interface TestModelOutput {
  modelId: string
  modelName: string
  status: ModelOutputStatus
  content: string
  messages?: ModelOutputMessage[]
  conversationId?: string
  error?: string
}

interface TestPanelProps {
  models: TestModelOption[]
  testModels: TestPanelModel[]
  outputs: TestModelOutput[]
  userInput: string
  maxSelectedModels?: number
  isSending?: boolean
  onClose: () => void
  onAddPresetModel: (optionId: string) => void
  onAddCustomModel: (input: CustomTestModelInput) => void
  onRemoveModel: (modelId: string) => void
  onUserInputChange: (value: string) => void
  onSend: () => void
  onClear?: () => void
}

const statusMeta: Record<ModelOutputStatus, { label: string; className: string }> = {
  idle: { label: '待测试', className: 'bg-ink-100 text-ink-600' },
  streaming: { label: '测试中', className: 'bg-amber-100 text-amber-800' },
  done: { label: '已完成', className: 'bg-emerald-100 text-emerald-800' },
  error: { label: '失败', className: 'bg-rose-100 text-rose-800' },
}

function getOutputByModel(outputs: TestModelOutput[], modelId: string) {
  return outputs.find((item) => item.modelId === modelId)
}

function resolvePlaceholder(output?: TestModelOutput) {
  if (!output) return '等待开始测试...'
  if (output.status === 'streaming') return output.content || '正在生成输出...'
  if (output.status === 'error') return output.error || '测试失败，请稍后重试。'
  return output.content || '等待模型输出...'
}

export function TestPanel({
  models,
  testModels,
  outputs,
  userInput,
  maxSelectedModels,
  isSending = false,
  onClose,
  onAddPresetModel,
  onAddCustomModel,
  onRemoveModel,
  onUserInputChange,
  onSend,
  onClear,
}: TestPanelProps) {
  const [showComposer, setShowComposer] = useState(false)
  const [composerMode, setComposerMode] = useState<'preset' | 'custom'>('preset')
  const [expandedModelIds, setExpandedModelIds] = useState<string[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState('')
  const [customName, setCustomName] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [customBaseUrl, setCustomBaseUrl] = useState('')
  const [customApiKey, setCustomApiKey] = useState('')
  const [customError, setCustomError] = useState('')

  const selectedCount = testModels.length
  const canAddMore = !maxSelectedModels || selectedCount < maxSelectedModels

  const availablePresetModels = useMemo(
    () => models.filter((option) => !testModels.some((item) => item.id === option.id)),
    [models, testModels]
  )

  useEffect(() => {
    setExpandedModelIds((previous) => previous.filter((item) => testModels.some((model) => model.id === item)))
  }, [testModels])

  useEffect(() => {
    if (availablePresetModels.length === 0) {
      setSelectedPresetId('')
      return
    }

    setSelectedPresetId((previous) => {
      if (previous && availablePresetModels.some((item) => item.id === previous)) {
        return previous
      }
      return availablePresetModels[0].id
    })
  }, [availablePresetModels])

  const resetComposer = () => {
    setShowComposer(false)
    setComposerMode('preset')
    setCustomName('')
    setCustomModel('')
    setCustomBaseUrl('')
    setCustomApiKey('')
    setCustomError('')
  }

  const toggleOutput = (modelId: string) => {
    setExpandedModelIds((previous) => (
      previous.includes(modelId)
        ? previous.filter((item) => item !== modelId)
        : [...previous, modelId]
    ))
  }

  const handleAddPreset = () => {
    if (!selectedPresetId) return
    onAddPresetModel(selectedPresetId)
    resetComposer()
  }

  const handleAddCustomModel = () => {
    const normalizedModel = customModel.trim()
    const normalizedBaseUrl = customBaseUrl.trim()
    const normalizedApiKey = customApiKey.trim()
    const normalizedName = (customName.trim() || normalizedModel).trim()

    if (!normalizedModel || !normalizedBaseUrl || !normalizedApiKey) {
      setCustomError('请填写模型名称、Base URL 和 API Key')
      return
    }

    setCustomError('')
    onAddCustomModel({
      name: normalizedName,
      model: normalizedModel,
      baseUrl: normalizedBaseUrl,
      apiKey: normalizedApiKey,
    })
    resetComposer()
  }

  return (
    <section className="panel-shell h-full">
      <div className="panel-shell-header">
        <div>
          <h3 className="text-xl font-semibold text-ink-900">提示词测试</h3>
        </div>

        <button type="button" onClick={onClose} className="icon-button">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="panel-shell-body test-panel-body">
        <div className="panel-card">
          <div className="flex items-center justify-between gap-3">
            <h4 className="panel-section-title">用户输入</h4>
            {onClear && (
              <button type="button" onClick={onClear} className="btn btn-ghost btn-small">
                清空
              </button>
            )}
          </div>

          <textarea
            value={userInput}
            onChange={(event) => onUserInputChange(event.target.value)}
            className="input mt-4 min-h-[120px] resize-none"
            placeholder="请输入这轮想测试的用户问题或补充说明..."
          />
        </div>

        <div className="space-y-3">
          {testModels.map((model) => {
            const output = getOutputByModel(outputs, model.id)
            const meta = statusMeta[output?.status ?? 'idle']
            const expanded = expandedModelIds.includes(model.id)

            return (
              <article key={model.id} className="test-model-card">
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleOutput(model.id)}
                    className="test-model-summary"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-sm font-semibold text-ink-900">{model.name}</h4>
                      <span className={`status-pill ${meta.className}`}>{meta.label}</span>
                      {model.isCustom ? (
                        <span className="status-pill bg-slate-100 text-slate-700">自定义</span>
                      ) : null}
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleOutput(model.id)}
                      className="icon-button h-9 w-9"
                      title={expanded ? '收起输出' : '展开输出'}
                    >
                      <svg
                        className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveModel(model.id)}
                      disabled={isSending}
                      className="icon-button h-9 w-9"
                      title="移除模型"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {expanded ? (
                  <div className="test-model-output">
                    <div className="test-model-output-label">模型输出</div>
                    <div className="test-model-output-body">
                      <pre className="whitespace-pre-wrap font-mono text-[13px] leading-6 text-ink-700">
                        {resolvePlaceholder(output)}
                      </pre>
                    </div>
                  </div>
                ) : null}

                {output?.error ? (
                  <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    {output.error}
                  </div>
                ) : null}
              </article>
            )
          })}

          {showComposer ? (
            <div className="test-model-add-card">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setComposerMode('preset')}
                    className={`btn btn-small ${composerMode === 'preset' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    配置模型
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposerMode('custom')}
                    className={`btn btn-small ${composerMode === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    自定义模型
                  </button>
                </div>

                <button type="button" onClick={resetComposer} className="btn btn-ghost btn-small">
                  取消
                </button>
              </div>

              {composerMode === 'preset' ? (
                <div className="mt-4 space-y-2">
                  {availablePresetModels.length === 0 ? (
                    <div className="panel-empty">
                      <p className="text-sm font-medium text-ink-700">当前没有可添加的系统预设模型了</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <select
                        value={selectedPresetId}
                        onChange={(event) => setSelectedPresetId(event.target.value)}
                        className="input h-11"
                      >
                        {availablePresetModels.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>

                      <div className="flex justify-end">
                        <button type="button" onClick={handleAddPreset} className="btn btn-primary btn-small">
                          添加预设模型
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <input
                    value={customName}
                    onChange={(event) => setCustomName(event.target.value)}
                    className="input"
                    placeholder="展示名称，例如：我的 GPT-4.1"
                  />
                  <input
                    value={customModel}
                    onChange={(event) => setCustomModel(event.target.value)}
                    className="input"
                    placeholder="模型 ID，例如：gpt-4.1"
                  />
                  <input
                    value={customBaseUrl}
                    onChange={(event) => setCustomBaseUrl(event.target.value)}
                    className="input"
                    placeholder="Base URL，例如：https://api.openai.com/v1"
                  />
                  <input
                    value={customApiKey}
                    onChange={(event) => setCustomApiKey(event.target.value)}
                    className="input"
                    placeholder="API Key"
                    type="password"
                  />

                  {customError ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                      {customError}
                    </div>
                  ) : null}

                  <div className="flex justify-end">
                    <button type="button" onClick={handleAddCustomModel} className="btn btn-primary btn-small">
                      添加自定义模型
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowComposer(true)}
              disabled={!canAddMore}
              className="test-model-add-trigger"
            >
              <span className="text-2xl font-light leading-none">+</span>
              <span className="text-sm font-semibold">
                {canAddMore ? '添加一个模型' : '已达到模型数量上限'}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="panel-shell-footer">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-ink-500">
            已添加 {selectedCount} 个模型{maxSelectedModels ? ` / ${maxSelectedModels}` : ''}
          </p>
          <button
            type="button"
            onClick={onSend}
            disabled={testModels.length === 0 || !userInput.trim() || isSending}
            className="btn btn-primary"
          >
            {isSending ? '测试中...' : '开始测试'}
          </button>
        </div>
      </div>
    </section>
  )
}
