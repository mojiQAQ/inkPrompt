import { test, expect } from '@playwright/test'

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

test.describe('Prompt detail routing smoke test', () => {
  test.beforeEach(async ({ page }) => {
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
    }, buildMockSession())

    await page.route('**/api/prompts/123', async (route) => {
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
          tags: [],
          version_count: 1,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        }),
      })
    })

    await page.route('**/api/prompts/123/versions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          versions: [
            {
              id: 'version-1',
              prompt_id: '123',
              version_number: 1,
              content: 'Prompt content v1',
              token_count: 12,
              change_note: 'Initial version',
              created_at: '2026-01-01T00:00:00.000Z',
            },
          ],
          total: 1,
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
          updated_at: '2026-01-01T00:00:00.000Z',
          rounds: [],
        }),
      })
    })

    await page.route('**/api/prompts/version-1/test/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-session-1',
          prompt_version_id: 'version-1',
          user_id: 'e2e-user-id',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
          conversations: [],
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
          ],
          max_concurrent_test_models: 3,
        }),
      })
    })
  })

  test('should load the prompt entry page for /prompts/:id', async ({ page }) => {
    await page.goto('/prompts/123')

    await expect(page.getByText('Prompt Detail Smoke')).toBeVisible()
    await expect(page.getByRole('button', { name: '提示词优化' })).toBeVisible()
    await expect(page.getByText('历史版本')).toBeVisible()
    await expect(page.locator('select')).toHaveValue('version-1')
  })

  test('should load the same entry page for /prompts/:id/edit', async ({ page }) => {
    await page.goto('/prompts/123/edit')

    await expect(page.getByRole('button', { name: '完成' })).toBeVisible()
    await expect(page.locator('input').first()).toHaveValue('Prompt Detail Smoke')
    await expect(page.locator('textarea')).toHaveValue('# Prompt Detail\n\n- item 1\n- item 2')
  })

  test('should keep the new prompt route available', async ({ page }) => {
    await page.goto('/prompts/new')

    await expect(page.getByText('新建提示词')).toBeVisible()
  })
})
