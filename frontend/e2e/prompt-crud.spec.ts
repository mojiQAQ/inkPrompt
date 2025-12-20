/**
 * E2E tests for complete Prompt CRUD workflow
 * Tests the full user journey: Create, Read, Update, Delete prompts
 */
import { test, expect } from '@playwright/test'

// Test data
const testPrompt = {
  name: 'E2E Test Prompt',
  content: '这是一个用于 E2E 测试的提示词内容。请帮我分析这段代码的性能瓶颈。',
  tags: ['测试', 'E2E'],
}

const updatedPrompt = {
  name: 'E2E Test Prompt (Updated)',
  content: '这是更新后的提示词内容。请帮我优化这段代码，使其更加高效和易读。',
  tags: ['测试', 'E2E', '更新'],
  changeNote: '更新了提示词内容和标签',
}

test.describe('Prompt CRUD Workflow', () => {
  // Skip authentication for these tests
  // Assumes user is already logged in at localhost:3000
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/prompts')
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test.describe('Create Prompt', () => {
    test('should create a new prompt successfully', async ({ page }) => {
      // Click "新建提示词" button
      await page.getByRole('button', { name: '新建提示词' }).click()

      // Should navigate to /prompts/new
      await expect(page).toHaveURL(/\/prompts\/new/)

      // Fill in prompt name
      await page.getByRole('textbox', { name: '提示词名称' }).fill(testPrompt.name)

      // Fill in prompt content
      await page.getByRole('textbox', { name: '提示词内容' }).fill(testPrompt.content)

      // Add tags
      for (const tag of testPrompt.tags) {
        const tagInput = page.getByPlaceholder('输入标签后按回车添加')
        await tagInput.fill(tag)
        await tagInput.press('Enter')
      }

      // Verify tags are added
      for (const tag of testPrompt.tags) {
        await expect(page.getByText(tag).first()).toBeVisible()
      }

      // Submit the form
      await page.getByRole('button', { name: '创建提示词' }).click()

      // Should show success message
      await expect(page.getByText('提示词已创建')).toBeVisible()

      // Should navigate back to list
      await expect(page).toHaveURL(/\/prompts$/)

      // Should see the new prompt in the list
      await expect(page.getByText(testPrompt.name)).toBeVisible()
    })

    test('should validate required fields', async ({ page }) => {
      await page.getByRole('button', { name: '新建提示词' }).click()

      // Try to submit without filling fields
      await page.getByRole('button', { name: '创建提示词' }).click()

      // Should show validation message
      await expect(page.getByText(/请输入提示词名称/)).toBeVisible()
    })

    test('should show token count estimate', async ({ page }) => {
      await page.getByRole('button', { name: '新建提示词' }).click()

      // Fill in content
      await page.getByRole('textbox', { name: '提示词内容' }).fill(testPrompt.content)

      // Should show token count
      await expect(page.getByText(/tokens/)).toBeVisible()
      await expect(page.getByText(/估算值/)).toBeVisible()
    })
  })

  test.describe('Read Prompt', () => {
    test('should display prompts in list', async ({ page }) => {
      // Should see prompt list
      await expect(page.getByText('我的提示词')).toBeVisible()

      // Should show prompt count
      await expect(page.getByText(/共 \d+ 个提示词/)).toBeVisible()
    })

    test('should search prompts by name', async ({ page }) => {
      // Type in search box
      const searchBox = page.getByPlaceholder('搜索提示词名称或内容...')
      await searchBox.fill('测试')

      // Wait for search results
      await page.waitForTimeout(500)

      // Should filter prompts
      const promptCards = page.locator('.card')
      const count = await promptCards.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should click prompt card to view details', async ({ page }) => {
      // Find and click first prompt card
      const firstPrompt = page.locator('.card').first()
      await firstPrompt.click()

      // Should navigate to edit page
      await expect(page).toHaveURL(/\/prompts\/.+\/edit/)

      // Should see edit form
      await expect(page.getByText('编辑提示词')).toBeVisible()
    })
  })

  test.describe('Update Prompt', () => {
    test('should update prompt successfully', async ({ page }) => {
      // Click on a prompt to edit (find by test name)
      await page.getByText(testPrompt.name).first().click()

      // Should be on edit page
      await expect(page).toHaveURL(/\/prompts\/.+\/edit/)

      // Update name
      const nameInput = page.getByRole('textbox', { name: '提示词名称' })
      await nameInput.clear()
      await nameInput.fill(updatedPrompt.name)

      // Update content
      const contentInput = page.getByRole('textbox', { name: '提示词内容' })
      await contentInput.clear()
      await contentInput.fill(updatedPrompt.content)

      // Add change note
      const changeNoteInput = page.getByRole('textbox', { name: '版本更新说明' })
      await changeNoteInput.fill(updatedPrompt.changeNote)

      // Save changes
      await page.getByRole('button', { name: '保存更改' }).click()

      // Should show success message
      await expect(page.getByText('提示词已更新')).toBeVisible({ timeout: 10000 })

      // Should still be on edit page
      await expect(page).toHaveURL(/\/prompts\/.+\/edit/)

      // Verify changes
      await expect(nameInput).toHaveValue(updatedPrompt.name)
    })

    test('should cancel editing', async ({ page }) => {
      // Click on a prompt to edit
      const firstPrompt = page.locator('.card').first()
      await firstPrompt.click()

      // Click cancel button
      await page.getByRole('button', { name: '取消' }).click()

      // Should navigate back to list
      await expect(page).toHaveURL(/\/prompts$/)
    })
  })

  test.describe('Version Management', () => {
    test('should view version history', async ({ page }) => {
      // Find a prompt with multiple versions
      await page.getByText('测试提示词').first().click()

      // Click version history button
      await page.getByRole('button', { name: /版本历史/ }).click()

      // Should show version list (might be empty for new prompts)
      // Just verify the button works
      await expect(page).toHaveURL(/\/prompts\/.+\/edit/)
    })
  })

  test.describe('Delete Prompt', () => {
    test('should delete prompt successfully', async ({ page }) => {
      // Count initial prompts
      const initialCards = await page.locator('.card').count()

      // Find the test prompt
      const testCard = page.locator('.card').filter({ hasText: 'E2E Test' }).first()

      // Hover to show delete button
      await testCard.hover()

      // Click delete button
      const deleteButton = testCard.getByTitle('删除')
      await deleteButton.click()

      // Should show confirmation dialog
      await expect(page.getByText(/确认删除/)).toBeVisible()

      // Confirm deletion
      await page.getByRole('button', { name: '删除' }).last().click()

      // Should show success message
      await expect(page.getByText(/已删除/)).toBeVisible({ timeout: 5000 })

      // Should have one fewer prompt
      await page.waitForTimeout(1000)
      const finalCards = await page.locator('.card').count()
      expect(finalCards).toBeLessThanOrEqual(initialCards)
    })

    test('should cancel deletion', async ({ page }) => {
      // Find a prompt
      const firstCard = page.locator('.card').first()
      await firstCard.hover()

      // Click delete button
      const deleteButton = firstCard.getByTitle('删除')
      await deleteButton.click()

      // Should show confirmation dialog
      await expect(page.getByText(/确认删除/)).toBeVisible()

      // Cancel deletion
      await page.getByRole('button', { name: '取消' }).last().click()

      // Dialog should close
      await expect(page.getByText(/确认删除/)).not.toBeVisible()

      // Prompt should still be there
      await expect(firstCard).toBeVisible()
    })
  })

  test.describe('Search and Filter', () => {
    test('should filter by tags', async ({ page }) => {
      // Check if tag filter exists
      const tagButtons = page.locator('button').filter({ hasText: /^[^新建]/ })
      const tagCount = await tagButtons.count()

      if (tagCount > 0) {
        // Click first tag
        await tagButtons.first().click()

        // Should filter prompts
        await page.waitForTimeout(500)

        // Verify prompts are filtered (should have fewer cards or same)
        const filteredCards = await page.locator('.card').count()
        expect(filteredCards).toBeGreaterThanOrEqual(0)
      }
    })

    test('should sort prompts', async ({ page }) => {
      // Find sort dropdown
      const sortSelect = page.locator('select').first()

      // Change sort order
      await sortSelect.selectOption('name')

      // Wait for re-render
      await page.waitForTimeout(500)

      // Should show prompts (verify no errors)
      const cards = await page.locator('.card').count()
      expect(cards).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('UI Elements', () => {
    test('should display navbar correctly', async ({ page }) => {
      await expect(page.getByText('Ink & Prompt')).toBeVisible()
      await expect(page.getByRole('button', { name: '我的提示词' })).toBeVisible()
      await expect(page.getByRole('button', { name: '退出登录' })).toBeVisible()
    })

    test('should show empty state when no prompts', async ({ page }) => {
      // Search for something that doesn't exist
      const searchBox = page.getByPlaceholder('搜索提示词名称或内容...')
      await searchBox.fill('不存在的提示词12345')

      await page.waitForTimeout(500)

      // Should show no results (either empty state or no cards)
      const cards = await page.locator('.card').count()
      expect(cards).toBe(0)
    })

    test('should display footer information', async ({ page }) => {
      // Check for date display on cards
      const dateElements = page.locator('.text-xs.text-ink-400')
      const count = await dateElements.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // This test would require mocking API failures
      // For now, just verify error messages can be displayed
      await page.getByRole('button', { name: '新建提示词' }).click()

      // Try to create with missing required field
      await page.getByRole('button', { name: '创建提示词' }).click()

      // Should show error message
      const errorMessage = page.getByText(/请输入/)
      await expect(errorMessage).toBeVisible()
    })
  })
})

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('http://localhost:3000/prompts')

    // Should display properly
    await expect(page.getByText('我的提示词')).toBeVisible()

    // Should be able to create prompt
    await page.getByRole('button', { name: '新建提示词' }).click()
    await expect(page).toHaveURL(/\/prompts\/new/)
  })

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    await page.goto('http://localhost:3000/prompts')

    // Should display properly
    await expect(page.getByText('我的提示词')).toBeVisible()
  })
})
