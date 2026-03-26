import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getOptimizationSession } from '@/api/optimization'
import { getAvailableModels } from '@/api/models'
import { getTestSession } from '@/api/test'

describe('Prompt detail session APIs', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('loads optimization session data', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'session-1',
          prompt_id: 'prompt-1',
          user_id: 'user-1',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
          rounds: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ) as Response
    )

    const session = await getOptimizationSession('mock-token', 'prompt-1')

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/prompts/prompt-1/optimize/session',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token',
        }),
      })
    )
    expect(session.id).toBe('session-1')
    expect(session.rounds).toEqual([])
  })

  it('loads test session data', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'test-session-1',
          prompt_version_id: 'version-1',
          user_id: 'user-1',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
          conversations: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ) as Response
    )

    const session = await getTestSession('mock-token', 'version-1')

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/prompts/version-1/test/session',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token',
        }),
      })
    )
    expect(session.prompt_version_id).toBe('version-1')
    expect(session.conversations).toEqual([])
  })

  it('loads available model configurations', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              name: '当前配置模型',
              base_url: 'https://openrouter.ai/api/v1',
              model: 'openai/gpt-4o-mini',
            },
          ],
          max_concurrent_test_models: 3,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ) as Response
    )

    const models = await getAvailableModels('mock-token')

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/models',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token',
        }),
      })
    )
    expect(models).toEqual({
      items: [
        {
          name: '当前配置模型',
          base_url: 'https://openrouter.ai/api/v1',
          model: 'openai/gpt-4o-mini',
        },
      ],
      max_concurrent_test_models: 3,
    })
  })
})
