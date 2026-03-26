/**
 * SSE helpers for prompt testing streams.
 */
import { postSSE, type SSEConnection } from './sse'
import type {
  TestStreamRequest,
  TestSSEEventHandler,
} from '@/types/prompt'

function safeParseJSON<T>(value: string, fallback: T): T {
  if (!value.trim()) return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function startTestStream(
  token: string,
  versionId: string,
  request: TestStreamRequest,
  onEvent: TestSSEEventHandler,
  controller?: AbortController
): SSEConnection {
  const url = `/api/prompts/${encodeURIComponent(versionId)}/test/stream`

  return postSSE<TestStreamRequest>({
    url,
    token,
    body: request,
    controller,
    onEvent: (event) => {
      switch (event.event) {
        case 'conversation_id':
          onEvent({
            type: 'conversation_id',
            data: safeParseJSON(event.data, { conversation_id: '' }),
          })
          break
        case 'content':
          onEvent({
            type: 'content',
            data: event.data,
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
            data: { message: `Unsupported test SSE event: ${event.event}` },
          })
      }
    },
  })
}
