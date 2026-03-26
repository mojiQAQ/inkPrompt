import { expect, Page, test } from '@playwright/test'

const testConversationsByVersion: Record<string, Array<{
  id: string
  test_session_id: string
  model_name: string
  model_config: {
    name: string
    base_url: string
    model: string
    params: Record<string, unknown>
  }
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  created_at: string
  updated_at: string
}>> = {
  'version-1': [],
  'version-2': [],
  'version-3': [],
}

const mockVersionsByPrompt: Record<string, Array<{
  id: string
  prompt_id: string
  version_number: number
  content: string
  token_count: number
  change_note: string | null
  created_at: string
}>> = {
  '123': [],
}

const mockOptimizationRoundsByPrompt: Record<string, Array<{
  id: string
  session_id: string
  round_number: number
  user_idea: string | null
  selected_suggestions: Record<string, string[]> | null
  optimized_content: string
  suggestions: Array<{ question: string; options: string[] }>
  domain_analysis: string
  created_at: string
  version_id: string | null
}>> = {
  '123': [],
}

function buildMockSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600

  return {
    access_token: 'e2e-access-token',
    refresh_token: 'e2e-refresh-token',
    expires_in: 3600,
    expires_at: expiresAt,
    token_type: 'bearer',
    user: {
      id: 'e2e-user-id',
      email: 'e2e@example.com',
      role: 'authenticated',
      aud: 'authenticated',
      app_metadata: {
        provider: 'email',
        providers: ['email'],
      },
      user_metadata: {},
    },
  }
}

async function mockPromptDetailApis(page: Page) {
  await page.addInitScript((session) => {
    const storageKeys = [
      'sb-test-auth-token',
      'sb-test-auth-token-user',
      'sb-uuvxozvzcqklxlcryjib-auth-token',
      'sb-uuvxozvzcqklxlcryjib-auth-token-user',
    ]

    localStorage.setItem(storageKeys[0], JSON.stringify(session))
    localStorage.setItem(storageKeys[1], JSON.stringify({ user: session.user }))
    localStorage.setItem(storageKeys[2], JSON.stringify(session))
    localStorage.setItem(storageKeys[3], JSON.stringify({ user: session.user }))
    localStorage.setItem('inkprompt_tour_completed', 'true')
  }, buildMockSession())

  await page.route('**/api/prompts/123', async (route, request) => {
    if (request.method() === 'PUT') {
      const body = JSON.parse(request.postData() || '{}')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '123',
          user_id: 'e2e-user-id',
          name: body.name || 'Prompt Detail Smoke',
          content: body.content || '# Prompt Detail\n\n- item 1\n- item 2',
          token_count: 18,
          is_favorited: false,
          tags: (body.tag_names || []).map((name: string, index: number) => ({
            id: `tag-${index}`,
            name,
            is_system: false,
            use_count: 1,
          })),
          version_count: 2,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-02T00:00:00.000Z',
        }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: '123',
        user_id: 'e2e-user-id',
        name: 'Prompt Detail Smoke',
        content: '# Prompt Detail\n\n- item 1\n- item 2',
        token_count: 12,
        is_favorited: false,
        tags: [
          { id: 'tag-1', name: '测试', is_system: false, use_count: 1 },
        ],
        version_count: 2,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      }),
    })
  })

  await page.route('**/api/prompts/123/versions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        versions: mockVersionsByPrompt['123'],
        total: mockVersionsByPrompt['123'].length,
      }),
    })
  })

  await page.route('**/api/prompts/123/optimize/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'opt-session-1',
        prompt_id: '123',
        user_id: 'e2e-user-id',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
        rounds: mockOptimizationRoundsByPrompt['123'],
      }),
    })
  })

  await page.route(/\/api\/prompts\/([^/]+)\/test\/session$/, async (route) => {
    const match = route.request().url().match(/\/api\/prompts\/([^/]+)\/test\/session$/)
    const versionId = match?.[1] ?? 'version-1'

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: `test-session-${versionId}`,
        prompt_version_id: versionId,
        user_id: 'e2e-user-id',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        conversations: testConversationsByVersion[versionId] ?? [],
      }),
    })
  })

  await page.route('**/api/models', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            name: 'GPT-4',
            base_url: 'https://api.openai.com/v1',
            model: 'gpt-4',
            params: {},
          },
          {
            name: 'Claude 3',
            base_url: 'https://api.anthropic.com',
            model: 'claude-3-opus',
            params: {},
          },
        ],
        max_concurrent_test_models: 3,
      }),
    })
  })
}

test.describe('PromptDetail Panels', () => {
  test.beforeEach(async ({ page }) => {
    mockVersionsByPrompt['123'] = [
      {
        id: 'version-2',
        prompt_id: '123',
        version_number: 2,
        content: '# Prompt Detail v2\n\n当前主版本',
        token_count: 14,
        change_note: '最新版本',
        created_at: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'version-1',
        prompt_id: '123',
        version_number: 1,
        content: '# Prompt Detail v1\n\n历史版本',
        token_count: 12,
        change_note: '初始版本',
        created_at: '2026-01-01T00:00:00.000Z',
      },
    ]
    mockOptimizationRoundsByPrompt['123'] = []
    testConversationsByVersion['version-1'] = []
    testConversationsByVersion['version-2'] = []
    testConversationsByVersion['version-3'] = []
    await mockPromptDetailApis(page)
  })

  test('should open optimize panel and render streamed result', async ({ page }) => {
    await page.route('**/api/prompts/123/version-2/optimize/stream', async (route) => {
      const optimizedContent = '# 优化后的提示词\n\n更清晰的结构'
      mockVersionsByPrompt['123'] = [
        {
          id: 'version-3',
          prompt_id: '123',
          version_number: 3,
          content: optimizedContent,
          token_count: 16,
          change_note: 'AI 优化生成',
          created_at: '2026-01-03T00:00:00.000Z',
        },
        ...mockVersionsByPrompt['123'],
      ]
      mockOptimizationRoundsByPrompt['123'] = [
        {
          id: 'round-1',
          session_id: 'opt-session-1',
          round_number: 1,
          user_idea: null,
          selected_suggestions: null,
          optimized_content: optimizedContent,
          suggestions: [
            {
              question: '是否补充输出格式？',
              options: ['Markdown', 'JSON'],
            },
          ],
          domain_analysis: '软件开发',
          created_at: '2026-01-03T00:00:00.000Z',
          version_id: 'version-3',
        },
      ]

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: [
          'event: round_start',
          'data: {"round_number":1}',
          '',
          'event: content',
          'data: # 优化后的提示词',
          '',
          'event: content',
          'data: \\n\\n更清晰的结构',
          '',
          'event: suggestions',
          'data: {"domain":"软件开发","questions":[{"question":"是否补充输出格式？","options":["Markdown","JSON"]}]}',
          '',
          'event: version_saved',
          'data: {"version_id":"version-3","version_number":3}',
          '',
          'event: complete',
          'data: {}',
          '',
        ].join('\n'),
      })
    })

    await page.goto('/prompts/123')
    await page.getByRole('button', { name: '提示词优化' }).click()
    await expect(page.getByRole('heading', { name: '提示词优化' })).toBeVisible()

    await page.getByRole('button', { name: '开始优化' }).click({ force: true })

    await expect(page.getByText('优化完成，已生成新版本')).toBeVisible()
    await expect(page.getByText('优化历史')).toBeVisible()
    await expect(page.getByText('第 1 轮')).toBeVisible()
    await expect(page.getByRole('article').getByText('是否补充输出格式？')).toBeVisible()
    await expect(page.locator('select')).toHaveValue('version-3')
    await expect(page.getByLabel('Markdown')).toBeVisible()
    await expect(page.getByLabel('JSON')).toBeVisible()
  })

  test('should submit selected suggestion options by question', async ({ page }) => {
    let optimizeRequestBody: Record<string, unknown> | null = null

    mockOptimizationRoundsByPrompt['123'] = [
      {
        id: 'round-seed',
        session_id: 'opt-session-1',
        round_number: 1,
        user_idea: null,
        selected_suggestions: {
          '是否补充输出格式？': ['Markdown'],
        },
        optimized_content: '# Seed',
        suggestions: [
          {
            question: '是否补充输出格式？',
            options: ['Markdown', 'JSON'],
          },
          {
            question: '是否增加约束？',
            options: ['增加', '保持当前'],
          },
        ],
        domain_analysis: '软件开发',
        created_at: '2026-01-02T00:00:00.000Z',
        version_id: 'version-2',
      },
    ]

    await page.route('**/api/prompts/123/version-2/optimize/stream', async (route) => {
      optimizeRequestBody = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'event: complete\ndata: {}\n\n',
      })
    })

    await page.goto('/prompts/123')
    await page.getByRole('button', { name: '提示词优化' }).click()
    await expect(page.getByLabel('Markdown')).toBeVisible()

    await page.getByLabel('JSON').check()
    await page.getByLabel('增加').check()
    await page.getByRole('button', { name: '开始优化' }).click({ force: true })

    await expect.poll(() => optimizeRequestBody).not.toBeNull()
    expect(optimizeRequestBody).toMatchObject({
      selected_suggestions: {
        '是否补充输出格式？': ['Markdown', 'JSON'],
        '是否增加约束？': ['增加'],
      },
    })
  })

  test('should lock version switching while optimize request is pending', async ({ page }) => {
    await page.route('**/api/prompts/123/version-2/optimize/stream', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200))
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'event: complete\ndata: {}\n\n',
      })
    })

    await page.goto('/prompts/123')
    await page.getByRole('button', { name: '提示词优化' }).click()
    await page.getByRole('button', { name: '开始优化' }).click({ force: true })

    await expect(page.getByText('处理中')).toBeVisible()
    await expect(page.locator('select')).toBeDisabled()
  })

  test('should open test panel and render model outputs', async ({ page }) => {
    await page.route('**/api/prompts/version-2/test/stream', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}')
      const modelName = body.model.name
      const versionId = 'version-2'
      const output = `${modelName} 输出内容`

      testConversationsByVersion[versionId] = [
        ...testConversationsByVersion[versionId].filter((item) => item.model_name !== modelName),
        {
          id: `conv-${modelName}`,
          test_session_id: 'test-session-2',
          model_name: modelName,
          model_config: body.model,
          messages: [
            { role: 'system', content: '# Prompt Detail v2\n\n当前主版本' },
            { role: 'user', content: body.user_prompt },
            { role: 'assistant', content: output },
          ],
          created_at: '2026-01-02T00:00:00.000Z',
          updated_at: '2026-01-02T00:00:00.000Z',
        },
      ]

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: [
          'event: conversation_id',
          `data: {"conversation_id":"conv-${modelName}"}`,
          '',
          'event: content',
          `data: ${output}`,
          '',
          'event: complete',
          'data: {}',
          '',
        ].join('\n'),
      })
    })

    await page.goto('/prompts/123')
    await page.getByRole('button', { name: '提示词测试' }).click()
    await expect(page.getByText('提示词测试')).toBeVisible()

    await page.getByPlaceholder('请输入本轮用户问题或补充说明...').fill('请帮我分析这个提示词')
    await page.getByRole('button', { name: '开始测试' }).click({ force: true })

    await expect(page.getByText('测试完成')).toBeVisible()
    await expect(page.locator('pre', { hasText: 'GPT-4 输出内容' })).toBeVisible()
    await expect(page.locator('pre', { hasText: 'Claude 3 输出内容' })).toBeVisible()
  })
})
