import { expect, Page, test } from '@playwright/test'

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

async function mockPromptApis(page: Page) {
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

  await page.route(/\/api\/prompts(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url())
    if (route.request().method() === 'POST' && url.pathname === '/api/prompts') {
      const body = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'new-prompt',
          user_id: 'e2e-user-id',
          name: body.name,
          content: body.content,
          token_count: 20,
          is_favorited: false,
          tags: [],
          version_count: 1,
          created_at: '2026-01-03T00:00:00.000Z',
          updated_at: '2026-01-03T00:00:00.000Z',
        }),
      })
      return
    }

    if (route.request().method() === 'GET' && url.pathname === '/api/prompts') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: '123',
              user_id: 'e2e-user-id',
              name: '提示词 A',
              content: '列表中的提示词 A 内容',
              token_count: 10,
              is_favorited: false,
              tags: [],
              version_count: 2,
              created_at: '2026-01-01T00:00:00.000Z',
              updated_at: '2026-01-02T00:00:00.000Z',
            },
          ],
          total: 1,
          page: 1,
          page_size: 20,
          total_pages: 1,
        }),
      })
      return
    }

    await route.fallback()
  })

  await page.route(/\/api\/tags(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [],
        total: 0,
      }),
    })
  })

  await page.route(/\/api\/folders(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 'folder-all',
            user_id: 'e2e-user-id',
            name: '全部提示词',
            is_system: true,
            sort_order: 0,
            prompt_count: 1,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'folder-fav',
            user_id: 'e2e-user-id',
            name: '收藏提示词',
            is_system: true,
            sort_order: 1,
            prompt_count: 0,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    })
  })

  await page.route(/\/api\/prompt-folders(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })
}

test.describe('PromptDetail basic flows', () => {
  test.beforeEach(async ({ page }) => {
    await mockPromptApis(page)
  })

  test('should load prompt list entry with mocked data', async ({ page }) => {
    await page.goto('/prompts')

    await expect(page.getByRole('heading', { name: '全部提示词' })).toBeVisible()
    await expect(page.getByRole('button', { name: '新建提示词' })).toBeVisible()
    await expect(page.getByText('列表中的提示词 A 内容')).toBeVisible()
  })

  test('should open create page and submit new prompt', async ({ page }) => {
    await page.goto('/prompts/new')

    await expect(page.getByRole('heading', { name: '新建提示词' })).toBeVisible()
    await page.locator('input[placeholder="例如：代码审查助手"]').fill('E2E 新提示词')
    await page.locator('textarea[placeholder="输入提示词内容..."]').fill('这是一个新的提示词内容')
    await page.getByRole('button', { name: '创建提示词' }).click()

    await expect(page).toHaveURL(/\/prompts$/)
  })
})
