import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchPromptVersions } from '@/api/prompts'
import { getPromptVersions } from '@/api/versions'

function mockVersionList() {
  return {
    versions: [
      {
        id: 'version-1',
        prompt_id: 'prompt-1',
        version_number: 1,
        content: 'Prompt content',
        token_count: 42,
        change_note: 'Initial version',
        created_at: '2026-01-01T00:00:00.000Z',
      },
    ],
    total: 1,
  }
}

describe('Version API normalization', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns the same VersionListResponse shape from prompts and versions APIs', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockVersionList()), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }) as Response
      )
    )

    const token = 'mock-token'
    const promptId = 'prompt-1'

    const fromVersionsApi = await getPromptVersions(token, promptId)
    const fromPromptsApi = await fetchPromptVersions(token, promptId)

    expect(fromVersionsApi).toEqual(mockVersionList())
    expect(fromPromptsApi).toEqual(mockVersionList())
    expect(fromVersionsApi.versions[0].version_number).toBe(1)
    expect(fromVersionsApi.total).toBe(1)
  })
})
