/**
 * Streaming output box for a single model.
 */
export type ModelOutputStatus = 'idle' | 'streaming' | 'done' | 'error'

export interface ModelOutputMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ModelOutputBoxProps {
  modelName: string
  status: ModelOutputStatus
  content: string
  messages?: ModelOutputMessage[]
  conversationId?: string
  error?: string
  onRetry?: () => void
}

const statusMeta: Record<ModelOutputStatus, { label: string; className: string }> = {
  idle: { label: '待开始', className: 'bg-ink-100 text-ink-600' },
  streaming: { label: '流式输出', className: 'bg-amber-100 text-amber-800' },
  done: { label: '已完成', className: 'bg-emerald-100 text-emerald-800' },
  error: { label: '失败', className: 'bg-rose-100 text-rose-800' },
}

export function ModelOutputBox({
  modelName,
  status,
  content,
  messages = [],
  conversationId,
  error,
  onRetry,
}: ModelOutputBoxProps) {
  const meta = statusMeta[status]
  const roleClassMap: Record<ModelOutputMessage['role'], string> = {
    system: 'bg-ink-900 text-white',
    user: 'bg-white text-ink-700 border border-ink-200',
    assistant: 'bg-emerald-600 text-white',
  }

  return (
    <article className="panel-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-sm font-semibold text-ink-900">{modelName}</h4>
            <span className={`status-pill ${meta.className}`}>{meta.label}</span>
          </div>
          {conversationId && (
            <p className="mt-1 text-xs text-ink-400">会话 ID: {conversationId}</p>
          )}
        </div>

        {status === 'error' && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="btn btn-ghost btn-small"
          >
            重试
          </button>
        )}
      </div>

      <div className="space-y-4 p-4">
        {messages.length > 0 && (
          <div className="space-y-2">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className="rounded-2xl border border-ink-100 bg-white/70 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={`badge capitalize ${roleClassMap[message.role]}`}>
                    {message.role}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-ink-700">{message.content}</p>
              </div>
            ))}
          </div>
        )}

        <div className="panel-card-muted border border-dashed border-ink-200">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            输出
          </div>
          <pre className="whitespace-pre-wrap font-mono text-[13px] leading-6 text-ink-700">
            {content || '等待模型输出...'}
          </pre>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}
      </div>
    </article>
  )
}
