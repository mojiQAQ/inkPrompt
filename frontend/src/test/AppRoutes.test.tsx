import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import App from '@/App'

vi.mock('@/hooks/useAuth', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: { id: 'test-user' },
    session: null,
    loading: false,
    signInWithGoogle: vi.fn(),
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    signOut: vi.fn(),
    getAccessToken: vi.fn().mockResolvedValue('mock-token'),
  }),
}))

vi.mock('@/pages/Login', () => ({
  Login: () => <div data-testid="login-page">Login Page</div>,
}))

vi.mock('@/pages/LandingPage', () => ({
  LandingPage: () => <div data-testid="landing-page">Landing Page</div>,
}))

vi.mock('@/pages/AuthCallback', () => ({
  AuthCallback: () => <div data-testid="auth-callback-page">Auth Callback</div>,
}))

vi.mock('@/pages/PromptList', () => ({
  PromptList: () => <div data-testid="prompt-list-page">Prompt List</div>,
}))

vi.mock('@/pages/PromptEditor', () => ({
  PromptEditor: () => <div data-testid="prompt-editor-page">Prompt Editor</div>,
}))

vi.mock('@/pages/PromptSquare', () => ({
  PromptSquare: () => <div data-testid="prompt-square-page">Prompt Square</div>,
}))

vi.mock('@/pages/PromptSquareDetail', () => ({
  PromptSquareDetail: () => <div data-testid="prompt-square-detail-page">Prompt Square Detail</div>,
}))

describe('App routes', () => {
  afterEach(() => {
    cleanup()
  })

  const renderAt = (path: string) => {
    window.history.pushState({}, '', path)
    return render(<App />)
  }

  it('should map / to the landing page', () => {
    renderAt('/')
    expect(screen.getByTestId('landing-page')).toBeInTheDocument()
  })

  it('should map /landing to the landing page', () => {
    renderAt('/landing')
    expect(screen.getByTestId('landing-page')).toBeInTheDocument()
  })

  it('should map /prompts to the prompt list page', () => {
    renderAt('/prompts')
    expect(screen.getByTestId('prompt-list-page')).toBeInTheDocument()
  })

  it('should map /prompts/new to the prompt editor page', () => {
    renderAt('/prompts/new')
    expect(screen.getByTestId('prompt-editor-page')).toBeInTheDocument()
  })

  it('should map /square to the prompt square page', () => {
    renderAt('/square')
    expect(screen.getByTestId('prompt-square-page')).toBeInTheDocument()
  })

  it('should map /square/:entryId to the prompt square detail page', () => {
    renderAt('/square/entry-123')
    expect(screen.getByTestId('prompt-square-detail-page')).toBeInTheDocument()
  })

  it('should map /prompts/:id to the detail/editor entry', () => {
    renderAt('/prompts/prompt-123')
    expect(screen.getByTestId('prompt-editor-page')).toBeInTheDocument()
  })

  it('should map /prompts/:id/edit to the detail/editor entry', () => {
    renderAt('/prompts/prompt-123/edit')
    expect(screen.getByTestId('prompt-editor-page')).toBeInTheDocument()
  })

  it('should keep login route available', () => {
    renderAt('/login')
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })
})
