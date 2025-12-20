/**
 * Test utility functions
 */
import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock AuthProvider for testing
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <MockAuthProvider>
        {children}
      </MockAuthProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Test helpers
export const mockGetAccessToken = () => {
  return Promise.resolve('mock-token-123')
}

export const createMockPrompt = (overrides = {}) => ({
  id: 'prompt-1',
  name: 'Test Prompt',
  content: 'Test content',
  user_id: 'user-1',
  token_count: 100,
  tags: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createMockVersion = (overrides = {}) => ({
  id: 'version-1',
  prompt_id: 'prompt-1',
  version_number: 1,
  content: 'Version content',
  token_count: 50,
  change_note: null,
  created_at: new Date().toISOString(),
  ...overrides,
})

export const createMockTag = (overrides = {}) => ({
  id: 'tag-1',
  name: 'test',
  is_system: false,
  ...overrides,
})

// Mock API responses
export const mockOptimizeResponse = {
  optimized_content: 'Optimized content',
  suggestions: ['Suggestion 1', 'Suggestion 2'],
  token_count: 150,
  estimated_cost: 0.0012,
}

// Utility to wait for async updates
export const waitForNextUpdate = () => {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
