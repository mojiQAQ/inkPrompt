import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startOptimizeStream } from '@/api/optimization'
import { startTestStream } from '@/api/test'

function createSSEResponse(chunks: string[]) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
    },
  })
}

describe('SSE API clients', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('parses optimization stream events from POST SSE', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(
      createSSEResponse([
        'event: round_start\ndata: {"round_number":2}\n\n',
        'event: content\ndata: 优化后的内容\n\n',
        'event: suggestions\ndata: {"domain":"开发","questions":[{"question":"是否保留示例","options":["保留","删除"]}]}\n\n',
        'event: version_saved\ndata: {"version_id":"version-2","version_number":2}\n\n',
        'event: complete\ndata: {}\n\n',
      ]) as Response
    )

    const events: unknown[] = []
    const connection = startOptimizeStream(
      'mock-token',
      'prompt-1',
      'version-1',
      { user_idea: '更简洁' },
      (event) => {
        events.push(event)
      }
    )

    await connection.done

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/prompts/prompt-1/version-1/optimize/stream',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token',
          Accept: 'text/event-stream',
        }),
        body: JSON.stringify({ user_idea: '更简洁' }),
      })
    )

    expect(events).toEqual([
      { type: 'round_start', data: { round_number: 2 } },
      { type: 'content', data: '优化后的内容' },
      {
        type: 'suggestions',
        data: {
          domain: '开发',
          questions: [
            {
              question: '是否保留示例',
              options: ['保留', '删除'],
            },
          ],
        },
      },
      {
        type: 'version_saved',
        data: { version_id: 'version-2', version_number: 2 },
      },
      { type: 'complete', data: {} },
    ])
  })

  it('parses test stream events from POST SSE', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(
      createSSEResponse([
        'event: conversation_id\ndata: {"conversation_id":"conv-1"}\n\n',
        'event: content\ndata: 第一段输出\n\n',
        'event: complete\ndata: {}\n\n',
      ]) as Response
    )

    const events: unknown[] = []
    const connection = startTestStream(
      'mock-token',
      'version-1',
      {
        model: {
          name: 'GPT-4',
          base_url: 'https://api.openai.com/v1',
          model: 'gpt-4',
        },
        user_prompt: '你好',
        continue: false,
      },
      (event) => {
        events.push(event)
      }
    )

    await connection.done

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/prompts/version-1/test/stream',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token',
          Accept: 'text/event-stream',
        }),
        body: JSON.stringify({
          model: {
            name: 'GPT-4',
            base_url: 'https://api.openai.com/v1',
            model: 'gpt-4',
          },
          user_prompt: '你好',
          continue: false,
        }),
      })
    )

    expect(events).toEqual([
      { type: 'conversation_id', data: { conversation_id: 'conv-1' } },
      { type: 'content', data: '第一段输出' },
      { type: 'complete', data: {} },
    ])
  })
})
