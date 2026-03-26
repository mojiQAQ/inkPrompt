/**
 * SSE helpers for prompt optimization streams.
 */
import { postSSE, type SSEConnection } from './sse'
import type {
  OptimizationStreamRequest,
  OptimizeSSEEventHandler,
} from '@/types/prompt'

function safeParseJSON<T>(value: string, fallback: T): T {
  if (!value.trim()) return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function startOptimizeStream(
  token: string,
  promptId: string,
  versionId: string,
  request: OptimizationStreamRequest,
  onEvent: OptimizeSSEEventHandler,
  controller?: AbortController
): SSEConnection {
  const url = `/api/prompts/${encodeURIComponent(promptId)}/${encodeURIComponent(versionId)}/optimize/stream`

  return postSSE<OptimizationStreamRequest>({
    url,
    token,
    body: request,
    controller,
    onEvent: (event) => {
      switch (event.event) {
        case 'round_start':
          onEvent({
            type: 'round_start',
            data: safeParseJSON(event.data, { round_number: 0 }),
          })
          break
        case 'content':
          onEvent({
            type: 'content',
            data: event.data,
          })
          break
        case 'suggestions':
          onEvent({
            type: 'suggestions',
            data: safeParseJSON(event.data, { questions: [] }),
          })
          break
        case 'version_saved':
          onEvent({
            type: 'version_saved',
            data: safeParseJSON(event.data, { version_id: '', version_number: 0 }),
          })
          break
        case 'complete':
          onEvent({
            type: 'complete',
            data: {},
          })
          break
        case 'error':
          onEvent({
            type: 'error',
            data: safeParseJSON(event.data, { message: 'Unknown SSE error' }),
          })
          break
        default:
          onEvent({
            type: 'error',
            data: { message: `Unsupported optimization SSE event: ${event.event}` },
          })
      }
    },
  })
}
