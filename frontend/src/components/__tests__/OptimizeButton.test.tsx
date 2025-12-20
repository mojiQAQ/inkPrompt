/**
 * OptimizeButton Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/test-utils'
import { OptimizeButton } from '../OptimizeButton'
import * as optimizationApi from '@/api/optimization'
import toast from 'react-hot-toast'

// Mock the optimization API
vi.mock('@/api/optimization', () => ({
  optimizePrompt: vi.fn(),
}))

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    getAccessToken: vi.fn().mockResolvedValue('mock-token'),
  }),
}))

describe('OptimizeButton', () => {
  const mockOnOptimized = vi.fn()
  const mockPromptId = 'prompt-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Button Rendering', () => {
    it('should render the optimize button', () => {
      render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

      const button = screen.getByTestId('optimize-button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('AI 优化')
    })

    it('should show lightning icon', () => {
      render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

      const button = screen.getByTestId('optimize-button')
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should have correct styling classes', () => {
      render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

      const button = screen.getByTestId('optimize-button')
      expect(button).toHaveClass('bg-gradient-to-r')
      expect(button).toHaveClass('from-accent-purple')
    })
  })

  describe('Dropdown Menu', () => {
    it('should not show dropdown menu initially', () => {
      render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

      const dropdown = screen.queryByTestId('optimize-dropdown-menu')
      expect(dropdown).not.toBeInTheDocument()
    })

    it('should show dropdown menu when button is clicked', async () => {
      render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

      const button = screen.getByTestId('optimize-button')
      fireEvent.click(button)

      await waitFor(() => {
        const dropdown = screen.getByTestId('optimize-dropdown-menu')
        expect(dropdown).toBeInTheDocument()
      })
    })

    it('should show all 5 optimization scenarios', async () => {
      render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

      const button = screen.getByTestId('optimize-button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByTestId('optimize-scenario-general')).toBeInTheDocument()
        expect(screen.getByTestId('optimize-scenario-content_creation')).toBeInTheDocument()
        expect(screen.getByTestId('optimize-scenario-code_generation')).toBeInTheDocument()
        expect(screen.getByTestId('optimize-scenario-data_analysis')).toBeInTheDocument()
        expect(screen.getByTestId('optimize-scenario-conversation')).toBeInTheDocument()
      })
    })

    it('should show scenario labels and icons', async () => {
      render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

      const button = screen.getByTestId('optimize-button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('通用优化')).toBeInTheDocument()
        expect(screen.getByText('内容创作')).toBeInTheDocument()
        expect(screen.getByText('代码生成')).toBeInTheDocument()
        expect(screen.getByText('数据分析')).toBeInTheDocument()
        expect(screen.getByText('对话交互')).toBeInTheDocument()
      })
    })

    it('should close dropdown when clicking outside', async () => {
      render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

      const button = screen.getByTestId('optimize-button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByTestId('optimize-dropdown-menu')).toBeInTheDocument()
      })

      const backdrop = screen.getByTestId('optimize-dropdown-backdrop')
      fireEvent.click(backdrop)

      await waitFor(() => {
        expect(screen.queryByTestId('optimize-dropdown-menu')).not.toBeInTheDocument()
      })
    })

    it('should toggle dropdown when button is clicked twice', async () => {
      render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

      const button = screen.getByTestId('optimize-button')

      // First click - open
      fireEvent.click(button)
      await waitFor(() => {
        expect(screen.getByTestId('optimize-dropdown-menu')).toBeInTheDocument()
      })

      // Second click - close
      fireEvent.click(button)
      await waitFor(() => {
        expect(screen.queryByTestId('optimize-dropdown-menu')).not.toBeInTheDocument()
      })
    })
  })

  describe('Optimization Flow', () => {
    it('should call optimizePrompt API when scenario is selected', async () => {
      const mockResponse = {
        optimized_content: 'Optimized content',
        suggestions: ['Suggestion 1'],
        token_count: 150,
        estimated_cost: 0.0012,
      }

      vi.mocked(optimizationApi.optimizePrompt).mockResolvedValue(mockResponse)

      render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

      const button = screen.getByTestId('optimize-button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByTestId('optimize-scenario-general')).toBeInTheDocument()
      })

      const generalScenario = screen.getByTestId('optimize-scenario-general')
      fireEvent.click(generalScenario)

      await waitFor(() => {
        expect(optimizationApi.optimizePrompt).toHaveBeenCalledWith(
          'mock-token',
          mockPromptId,
          { scenario: 'general' }
        )
      })
    })

    it('should call onOptimized callback with optimized content', async () => {
      const mockResponse = {
        optimized_content: 'Optimized content from API',
        suggestions: [],
        token_count: 200,
        estimated_cost: 0.0015,
      }

      vi.mocked(optimizationApi.optimizePrompt).mockResolvedValue(mockResponse)

      render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

      const button = screen.getByTestId('optimize-button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByTestId('optimize-scenario-general')).toBeInTheDocument()
      })

      const generalScenario = screen.getByTestId('optimize-scenario-general')
      fireEvent.click(generalScenario)

      await waitFor(() => {
        expect(mockOnOptimized).toHaveBeenCalledWith('Optimized content from API')
      })
    })

    it('should show success toast after optimization', async () => {
      const mockResponse = {
        optimized_content: 'Optimized',
        suggestions: [],
        token_count: 180,
        estimated_cost: 0.0013,
      }

      vi.mocked(optimizationApi.optimizePrompt).mockResolvedValue(mockResponse)

      render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

      const button = screen.getByTestId('optimize-button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByTestId('optimize-scenario-code_generation')).toBeInTheDocument()
      })

      const codeScenario = screen.getByTestId('optimize-scenario-code_generation')
      fireEvent.click(codeScenario)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled()
      })
    })

    it('should close dropdown after selecting scenario', async () => {
      const mockResponse = {
        optimized_content: 'Optimized',
        suggestions: [],
        token_count: 100,
        estimated_cost: 0.001,
      }

      vi.mocked(optimizationApi.optimizePrompt).mockResolvedValue(mockResponse)

      render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

      const button = screen.getByTestId('optimize-button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByTestId('optimize-dropdown-menu')).toBeInTheDocument()
      })

      const generalScenario = screen.getByTestId('optimize-scenario-general')
      fireEvent.click(generalScenario)

      await waitFor(() => {
        expect(screen.queryByTestId('optimize-dropdown-menu')).not.toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading state during optimization', async () => {
      const mockResponse = {
        optimized_content: 'Optimized',
        suggestions: [],
        token_count: 100,
        estimated_cost: 0.001,
      }

      vi.mocked(optimizationApi.optimizePrompt).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100))
      )

      render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

      const button = screen.getByTestId('optimize-button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByTestId('optimize-scenario-general')).toBeInTheDocument()
      })

      const generalScenario = screen.getByTestId('optimize-scenario-general')
      fireEvent.click(generalScenario)

      await waitFor(() => {
        expect(button).toHaveTextContent('优化中...')
      })

      await waitFor(() => {
        expect(button).toHaveTextContent('AI 优化')
      }, { timeout: 2000 })
    })

    it('should disable button during optimization', async () => {
      const mockResponse = {
        optimized_content: 'Optimized',
        suggestions: [],
        token_count: 100,
        estimated_cost: 0.001,
      }

      vi.mocked(optimizationApi.optimizePrompt).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100))
      )

      render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

      const button = screen.getByTestId('optimize-button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByTestId('optimize-scenario-general')).toBeInTheDocument()
      })

      const generalScenario = screen.getByTestId('optimize-scenario-general')
      fireEvent.click(generalScenario)

      await waitFor(() => {
        expect(button).toBeDisabled()
      })

      await waitFor(() => {
        expect(button).not.toBeDisabled()
      }, { timeout: 2000 })
    })

    it('should not show dropdown during optimization', async () => {
      const mockResponse = {
        optimized_content: 'Optimized',
        suggestions: [],
        token_count: 100,
        estimated_cost: 0.001,
      }

      vi.mocked(optimizationApi.optimizePrompt).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100))
      )

      render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

      const button = screen.getByTestId('optimize-button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByTestId('optimize-scenario-general')).toBeInTheDocument()
      })

      const generalScenario = screen.getByTestId('optimize-scenario-general')
      fireEvent.click(generalScenario)

      await waitFor(() => {
        expect(button).toHaveTextContent('优化中...')
      })

      // Should not show dropdown during optimization
      expect(screen.queryByTestId('optimize-dropdown-menu')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should show error toast when optimization fails', async () => {
      vi.mocked(optimizationApi.optimizePrompt).mockRejectedValue(
        new Error('API Error')
      )

      render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

      const button = screen.getByTestId('optimize-button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByTestId('optimize-scenario-general')).toBeInTheDocument()
      })

      const generalScenario = screen.getByTestId('optimize-scenario-general')
      fireEvent.click(generalScenario)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('优化失败，请稍后重试')
      })
    })

    it('should not call onOptimized when optimization fails', async () => {
      vi.mocked(optimizationApi.optimizePrompt).mockRejectedValue(
        new Error('API Error')
      )

      render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

      const button = screen.getByTestId('optimize-button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByTestId('optimize-scenario-general')).toBeInTheDocument()
      })

      const generalScenario = screen.getByTestId('optimize-scenario-general')
      fireEvent.click(generalScenario)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
      })

      expect(mockOnOptimized).not.toHaveBeenCalled()
    })

    it('should reset loading state after error', async () => {
      vi.mocked(optimizationApi.optimizePrompt).mockRejectedValue(
        new Error('API Error')
      )

      render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

      const button = screen.getByTestId('optimize-button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByTestId('optimize-scenario-general')).toBeInTheDocument()
      })

      const generalScenario = screen.getByTestId('optimize-scenario-general')
      fireEvent.click(generalScenario)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(button).not.toBeDisabled()
        expect(button).toHaveTextContent('AI 优化')
      })
    })
  })

  describe('All Scenarios', () => {
    const scenarios = [
      { value: 'general', label: '通用优化' },
      { value: 'content_creation', label: '内容创作' },
      { value: 'code_generation', label: '代码生成' },
      { value: 'data_analysis', label: '数据分析' },
      { value: 'conversation', label: '对话交互' },
    ]

    scenarios.forEach(({ value, label }) => {
      it(`should optimize with ${label} scenario`, async () => {
        const mockResponse = {
          optimized_content: `Optimized for ${label}`,
          suggestions: [],
          token_count: 100,
          estimated_cost: 0.001,
        }

        vi.mocked(optimizationApi.optimizePrompt).mockResolvedValue(mockResponse)

        render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

        const button = screen.getByTestId('optimize-button')
        fireEvent.click(button)

        await waitFor(() => {
          expect(screen.getByTestId(`optimize-scenario-${value}`)).toBeInTheDocument()
        })

        const scenarioButton = screen.getByTestId(`optimize-scenario-${value}`)
        fireEvent.click(scenarioButton)

        await waitFor(() => {
          expect(optimizationApi.optimizePrompt).toHaveBeenCalledWith(
            'mock-token',
            mockPromptId,
            { scenario: value }
          )
          expect(mockOnOptimized).toHaveBeenCalledWith(`Optimized for ${label}`)
        })
      })
    })
  })
})
