/**
 * Unit tests for PromptCard component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@/test/test-utils'
import { PromptCard } from '../PromptCard'
import { createMockPrompt } from '@/test/test-utils'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    getAccessToken: vi.fn().mockResolvedValue('mock-token'),
  }),
}))

describe('PromptCard', () => {
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render prompt card with all basic information', () => {
      const prompt = createMockPrompt({
        name: 'Test Prompt',
        content: 'This is test content',
        token_count: 100,
      })

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      expect(screen.getByText('Test Prompt')).toBeInTheDocument()
      expect(screen.getByText('This is test content')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('tokens')).toBeInTheDocument()
    })

    it('should display formatted date', () => {
      const testDate = new Date('2024-01-15')
      const prompt = createMockPrompt({
        updated_at: testDate.toISOString(),
      })

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      // Check if date is displayed in Chinese format
      expect(screen.getByText(/2024/)).toBeInTheDocument()
      expect(screen.getByText(/1月/)).toBeInTheDocument()
    })
  })

  describe('Version Badge', () => {
    it('should show version badge when version_count > 1', () => {
      const prompt = createMockPrompt({
        version_count: 3,
      })

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByTitle('3 个历史版本')).toBeInTheDocument()
    })

    it('should not show version badge when version_count is 1', () => {
      const prompt = createMockPrompt({
        version_count: 1,
      })

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      expect(screen.queryByTitle(/个历史版本/)).not.toBeInTheDocument()
    })
  })

  describe('Tags Display', () => {
    it('should display up to 3 tags', () => {
      const prompt = createMockPrompt({
        tags: [
          { id: '1', name: 'tag1', is_system: false, use_count: 0 },
          { id: '2', name: 'tag2', is_system: false, use_count: 0 },
          { id: '3', name: 'tag3', is_system: false, use_count: 0 },
        ],
      })

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      expect(screen.getByText('tag1')).toBeInTheDocument()
      expect(screen.getByText('tag2')).toBeInTheDocument()
      expect(screen.getByText('tag3')).toBeInTheDocument()
    })

    it('should show "+N" indicator when more than 3 tags', () => {
      const prompt = createMockPrompt({
        tags: [
          { id: '1', name: 'tag1', is_system: false, use_count: 0 },
          { id: '2', name: 'tag2', is_system: false, use_count: 0 },
          { id: '3', name: 'tag3', is_system: false, use_count: 0 },
          { id: '4', name: 'tag4', is_system: false, use_count: 0 },
          { id: '5', name: 'tag5', is_system: false, use_count: 0 },
        ],
      })

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      expect(screen.getByText('tag1')).toBeInTheDocument()
      expect(screen.getByText('tag2')).toBeInTheDocument()
      expect(screen.getByText('tag3')).toBeInTheDocument()
      expect(screen.getByText('+2')).toBeInTheDocument()
      expect(screen.queryByText('tag4')).not.toBeInTheDocument()
    })

    it('should apply correct CSS class for system tags', () => {
      const prompt = createMockPrompt({
        tags: [{ id: '1', name: 'system-tag', is_system: true, use_count: 0 }],
      })

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      const tag = screen.getByText('system-tag')
      expect(tag).toHaveClass('badge-system')
    })

    it('should apply correct CSS class for user tags', () => {
      const prompt = createMockPrompt({
        tags: [{ id: '1', name: 'user-tag', is_system: false, use_count: 0 }],
      })

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      const tag = screen.getByText('user-tag')
      expect(tag).toHaveClass('badge-user')
    })
  })

  describe('User Interactions', () => {
    it('should call onClick when card is clicked', () => {
      const prompt = createMockPrompt({ id: 'test-id' })

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      const card = screen.getByText('Test Prompt').closest('div')
      fireEvent.click(card!)

      expect(mockOnClick).toHaveBeenCalledWith('test-id')
      expect(mockOnEdit).not.toHaveBeenCalled()
      expect(mockOnDelete).not.toHaveBeenCalled()
    })

    it('should call onEdit when edit button is clicked', () => {
      const prompt = createMockPrompt({ id: 'test-id' })

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      const editButton = screen.getByTitle('编辑')
      fireEvent.click(editButton)

      expect(mockOnEdit).toHaveBeenCalledWith('test-id')
      expect(mockOnClick).not.toHaveBeenCalled()
    })

    it('should call onDelete when delete button is clicked', () => {
      const prompt = createMockPrompt({ id: 'test-id' })

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      const deleteButton = screen.getByTitle('删除')
      fireEvent.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalledWith('test-id')
      expect(mockOnClick).not.toHaveBeenCalled()
    })

    it('should not trigger onClick when edit button is clicked', () => {
      const prompt = createMockPrompt()

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      const editButton = screen.getByTitle('编辑')
      fireEvent.click(editButton)

      expect(mockOnClick).not.toHaveBeenCalled()
    })

    it('should not trigger onClick when delete button is clicked', () => {
      const prompt = createMockPrompt()

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      const deleteButton = screen.getByTitle('删除')
      fireEvent.click(deleteButton)

      expect(mockOnClick).not.toHaveBeenCalled()
    })
  })

  describe('Search Keyword Highlighting', () => {
    it('should render without keyword when searchKeyword is not provided', () => {
      const prompt = createMockPrompt({
        name: 'Test Prompt',
        content: 'Test content',
      })

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      expect(screen.getByText('Test Prompt')).toBeInTheDocument()
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should accept searchKeyword prop for highlighting', () => {
      const prompt = createMockPrompt({
        name: 'Test Prompt',
        content: 'This is test content',
      })

      const { container } = render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
          searchKeyword="Prompt"
        />
      )

      // Component should render successfully with searchKeyword
      expect(container.firstChild).toBeInTheDocument()
      // Keyword should be wrapped in <mark> element
      const marks = container.querySelectorAll('mark')
      expect(marks.length).toBeGreaterThan(0)
      // Should find "Prompt" in the highlights
      const highlightedText = Array.from(marks).map(m => m.textContent).join('')
      expect(highlightedText).toContain('Prompt')
    })
  })

  describe('Content Truncation', () => {
    it('should truncate long content to 150 characters', () => {
      const longContent = 'a'.repeat(200)
      const prompt = createMockPrompt({
        content: longContent,
      })

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      // The content should be truncated (with ellipsis)
      const displayedContent = screen.getByText((content, element) => {
        return element?.tagName === 'P' && content.length < longContent.length
      })
      expect(displayedContent).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button titles for accessibility', () => {
      const prompt = createMockPrompt()

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      expect(screen.getByTitle('编辑')).toBeInTheDocument()
      expect(screen.getByTitle('删除')).toBeInTheDocument()
    })

    it('should have cursor-pointer class on card', () => {
      const prompt = createMockPrompt()

      const { container } = render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('cursor-pointer')
    })
  })

  describe('Edge Cases', () => {
    it('should handle prompts with no tags', () => {
      const prompt = createMockPrompt({
        tags: [],
      })

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      // Should render without errors
      expect(screen.getByText('Test Prompt')).toBeInTheDocument()
    })

    it('should handle zero token count', () => {
      const prompt = createMockPrompt({
        token_count: 0,
      })

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should handle very large token count', () => {
      const prompt = createMockPrompt({
        token_count: 999999,
      })

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      expect(screen.getByText('999999')).toBeInTheDocument()
    })

    it('should handle empty content', () => {
      const prompt = createMockPrompt({
        content: '',
      })

      render(
        <PromptCard
          prompt={prompt}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onClick={mockOnClick}
        />
      )

      // Should render without errors
      expect(screen.getByText('Test Prompt')).toBeInTheDocument()
    })
  })
})
