/**
 * End-to-End Tests for OptimizeButton Component
 *
 * These tests verify the optimize button functionality in a real browser environment
 */
import { test, expect } from '@playwright/test'

test.describe('OptimizeButton - Dropdown Menu', () => {
  test.beforeEach(async ({ page }) => {
    // Note: These tests assume user is logged in and on the prompt editor page
    // You may need to add login steps or use fixtures for authentication
    await page.goto('/prompts/test-prompt-id/edit')
  })

  test('should display the optimize button', async ({ page }) => {
    const button = page.getByTestId('optimize-button')
    await expect(button).toBeVisible()
    await expect(button).toHaveText('AI 优化')
  })

  test('should show dropdown menu when clicked', async ({ page }) => {
    const button = page.getByTestId('optimize-button')

    // Initially, dropdown should not be visible
    await expect(page.getByTestId('optimize-dropdown-menu')).not.toBeVisible()

    // Click the button
    await button.click()

    // Dropdown should now be visible
    await expect(page.getByTestId('optimize-dropdown-menu')).toBeVisible()
  })

  test('should display all 5 optimization scenarios', async ({ page }) => {
    const button = page.getByTestId('optimize-button')
    await button.click()

    // Check all scenarios are present
    await expect(page.getByTestId('optimize-scenario-general')).toBeVisible()
    await expect(page.getByTestId('optimize-scenario-content_creation')).toBeVisible()
    await expect(page.getByTestId('optimize-scenario-code_generation')).toBeVisible()
    await expect(page.getByTestId('optimize-scenario-data_analysis')).toBeVisible()
    await expect(page.getByTestId('optimize-scenario-conversation')).toBeVisible()
  })

  test('should show scenario labels and icons', async ({ page }) => {
    const button = page.getByTestId('optimize-button')
    await button.click()

    await expect(page.getByText('通用优化')).toBeVisible()
    await expect(page.getByText('内容创作')).toBeVisible()
    await expect(page.getByText('代码生成')).toBeVisible()
    await expect(page.getByText('数据分析')).toBeVisible()
    await expect(page.getByText('对话交互')).toBeVisible()
  })

  test('should close dropdown when clicking outside', async ({ page }) => {
    const button = page.getByTestId('optimize-button')
    await button.click()

    // Dropdown is visible
    await expect(page.getByTestId('optimize-dropdown-menu')).toBeVisible()

    // Click on the backdrop
    await page.getByTestId('optimize-dropdown-backdrop').click()

    // Dropdown should be hidden
    await expect(page.getByTestId('optimize-dropdown-menu')).not.toBeVisible()
  })

  test('should toggle dropdown on multiple clicks', async ({ page }) => {
    const button = page.getByTestId('optimize-button')

    // First click - open
    await button.click()
    await expect(page.getByTestId('optimize-dropdown-menu')).toBeVisible()

    // Second click - close
    await button.click()
    await expect(page.getByTestId('optimize-dropdown-menu')).not.toBeVisible()

    // Third click - open again
    await button.click()
    await expect(page.getByTestId('optimize-dropdown-menu')).toBeVisible()
  })

  test('should close dropdown after selecting a scenario', async ({ page }) => {
    // Mock the API response
    await page.route('**/api/prompts/*/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          optimized_content: 'Optimized content from API',
          suggestions: ['Suggestion 1'],
          token_count: 150,
          estimated_cost: 0.0012,
        }),
      })
    })

    const button = page.getByTestId('optimize-button')
    await button.click()

    // Select a scenario
    await page.getByTestId('optimize-scenario-general').click()

    // Dropdown should close
    await expect(page.getByTestId('optimize-dropdown-menu')).not.toBeVisible()
  })

  test('should display loading state during optimization', async ({ page }) => {
    // Mock a slow API response
    await page.route('**/api/prompts/*/optimize', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          optimized_content: 'Optimized',
          suggestions: [],
          token_count: 100,
          estimated_cost: 0.001,
        }),
      })
    })

    const button = page.getByTestId('optimize-button')
    await button.click()
    await page.getByTestId('optimize-scenario-general').click()

    // Should show loading state
    await expect(button).toHaveText('优化中...')
    await expect(button).toBeDisabled()

    // Wait for optimization to complete
    await expect(button).toHaveText('AI 优化', { timeout: 5000 })
    await expect(button).toBeEnabled()
  })

  test('should display success toast after optimization', async ({ page }) => {
    // Mock the API response
    await page.route('**/api/prompts/*/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          optimized_content: 'Optimized content',
          suggestions: [],
          token_count: 180,
          estimated_cost: 0.0013,
        }),
      })
    })

    const button = page.getByTestId('optimize-button')
    await button.click()
    await page.getByTestId('optimize-scenario-general').click()

    // Wait for toast notification
    await expect(page.getByText('优化完成！')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Token: 180/)).toBeVisible()
    await expect(page.getByText(/成本: \$0.0013/)).toBeVisible()
  })

  test('should update content after successful optimization', async ({ page }) => {
    // Mock the API response
    await page.route('**/api/prompts/*/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          optimized_content: 'This is the optimized content from the API',
          suggestions: [],
          token_count: 100,
          estimated_cost: 0.001,
        }),
      })
    })

    // Get the textarea before optimization
    const textarea = page.getByPlaceholder('输入你的提示词内容...')
    const originalContent = await textarea.inputValue()

    const button = page.getByTestId('optimize-button')
    await button.click()
    await page.getByTestId('optimize-scenario-general').click()

    // Wait for optimization to complete
    await expect(button).toBeEnabled({ timeout: 5000 })

    // Content should be updated
    const newContent = await textarea.inputValue()
    expect(newContent).toBe('This is the optimized content from the API')
    expect(newContent).not.toBe(originalContent)
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/prompts/*/optimize', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Internal Server Error',
        }),
      })
    })

    const button = page.getByTestId('optimize-button')
    await button.click()
    await page.getByTestId('optimize-scenario-general').click()

    // Should show error toast
    await expect(page.getByText('优化失败，请稍后重试')).toBeVisible({ timeout: 5000 })

    // Button should return to normal state
    await expect(button).toBeEnabled()
    await expect(button).toHaveText('AI 优化')
  })

  test('should work with all scenario types', async ({ page }) => {
    const scenarios = [
      { testId: 'optimize-scenario-general', expectedScenario: 'general' },
      { testId: 'optimize-scenario-content_creation', expectedScenario: 'content_creation' },
      { testId: 'optimize-scenario-code_generation', expectedScenario: 'code_generation' },
      { testId: 'optimize-scenario-data_analysis', expectedScenario: 'data_analysis' },
      { testId: 'optimize-scenario-conversation', expectedScenario: 'conversation' },
    ]

    for (const scenario of scenarios) {
      // Track API calls
      let apiCalled = false
      let sentScenario = ''

      await page.route('**/api/prompts/*/optimize', async (route, request) => {
        apiCalled = true
        const postData = request.postDataJSON()
        sentScenario = postData.scenario

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            optimized_content: `Optimized for ${scenario.expectedScenario}`,
            suggestions: [],
            token_count: 100,
            estimated_cost: 0.001,
          }),
        })
      })

      const button = page.getByTestId('optimize-button')
      await button.click()
      await page.getByTestId(scenario.testId).click()

      // Wait for API call
      await page.waitForTimeout(500)

      expect(apiCalled).toBe(true)
      expect(sentScenario).toBe(scenario.expectedScenario)

      // Remove the route for next iteration
      await page.unroute('**/api/prompts/*/optimize')
    }
  })
})

test.describe('OptimizeButton - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/prompts/test-prompt-id/edit')
  })

  test('should match screenshot of button', async ({ page }) => {
    const button = page.getByTestId('optimize-button')
    await expect(button).toHaveScreenshot('optimize-button.png')
  })

  test('should match screenshot of dropdown menu', async ({ page }) => {
    const button = page.getByTestId('optimize-button')
    await button.click()

    const dropdown = page.getByTestId('optimize-dropdown-menu')
    await expect(dropdown).toHaveScreenshot('optimize-dropdown.png')
  })
})

test.describe('OptimizeButton - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/prompts/test-prompt-id/edit')
  })

  test('should be keyboard accessible', async ({ page }) => {
    // Tab to the button
    await page.keyboard.press('Tab')
    // Note: You may need to tab multiple times depending on page structure

    const button = page.getByTestId('optimize-button')
    await expect(button).toBeFocused()

    // Press Enter to open dropdown
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('optimize-dropdown-menu')).toBeVisible()

    // Press Escape to close
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('optimize-dropdown-menu')).not.toBeVisible()
  })

  test('should have proper ARIA labels', async ({ page }) => {
    const button = page.getByTestId('optimize-button')
    await expect(button).toHaveAttribute('title', 'AI 优化提示词')
  })
})
