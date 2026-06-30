import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateChapterDialog } from '@/components/dashboard/CreateChapterDialog'

const mockOnOpenChange = vi.fn()
const mockOnChapterCreated = vi.fn()

const defaultProps = {
  open: true,
  onOpenChange: mockOnOpenChange,
  storyId: 'story-1',
  onChapterCreated: mockOnChapterCreated,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({
      id: 'chapter-1',
      title: 'Chapter 1',
      order: 1,
      wordCount: 0,
      storyId: 'story-1',
    }),
  } as Response)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CreateChapterDialog', () => {
  it('renders dialog title when open', () => {
    render(<CreateChapterDialog {...defaultProps} />)
    expect(screen.getByText('Create New Chapter')).toBeInTheDocument()
  })

  it('renders chapter title input when open', () => {
    render(<CreateChapterDialog {...defaultProps} />)
    expect(screen.getByPlaceholderText('Chapter 1: The Beginning')).toBeInTheDocument()
  })

  it('renders Create Chapter submit button when open', () => {
    render(<CreateChapterDialog {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Create Chapter' })).toBeInTheDocument()
  })

  it('does not render dialog content when closed', () => {
    render(<CreateChapterDialog {...defaultProps} open={false} />)
    expect(screen.queryByText('Create New Chapter')).not.toBeInTheDocument()
  })

  it('POSTs to /api/chapters with entered title and storyId on submit', async () => {
    const user = userEvent.setup()
    render(<CreateChapterDialog {...defaultProps} />)

    await user.type(
      screen.getByPlaceholderText('Chapter 1: The Beginning'),
      'The Beginning'
    )
    await user.click(screen.getByRole('button', { name: 'Create Chapter' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chapters',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'The Beginning', storyId: 'story-1' }),
        })
      )
    })
  })

  it('sends the storyId from props in the request body', async () => {
    const user = userEvent.setup()
    render(<CreateChapterDialog {...defaultProps} storyId="specific-story-id" />)

    await user.type(
      screen.getByPlaceholderText('Chapter 1: The Beginning'),
      'Chapter Title'
    )
    await user.click(screen.getByRole('button', { name: 'Create Chapter' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chapters',
        expect.objectContaining({
          body: JSON.stringify({ title: 'Chapter Title', storyId: 'specific-story-id' }),
        })
      )
    })
  })

  it('calls onChapterCreated with the response data after successful submit', async () => {
    const newChapter = {
      id: 'chapter-new',
      title: 'The Beginning',
      order: 1,
      wordCount: 0,
      storyId: 'story-1',
    }
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => newChapter,
    } as Response)

    const user = userEvent.setup()
    render(<CreateChapterDialog {...defaultProps} />)

    await user.type(
      screen.getByPlaceholderText('Chapter 1: The Beginning'),
      'The Beginning'
    )
    await user.click(screen.getByRole('button', { name: 'Create Chapter' }))

    await waitFor(() => {
      expect(mockOnChapterCreated).toHaveBeenCalledWith(newChapter)
    })
  })

  it('calls onOpenChange(false) after successful submit', async () => {
    const user = userEvent.setup()
    render(<CreateChapterDialog {...defaultProps} />)

    await user.type(
      screen.getByPlaceholderText('Chapter 1: The Beginning'),
      'Some Chapter'
    )
    await user.click(screen.getByRole('button', { name: 'Create Chapter' }))

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('shows error message when the API call fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to create chapter' }),
    } as Response)

    const user = userEvent.setup()
    render(<CreateChapterDialog {...defaultProps} />)

    await user.type(
      screen.getByPlaceholderText('Chapter 1: The Beginning'),
      'Bad Input'
    )
    await user.click(screen.getByRole('button', { name: 'Create Chapter' }))

    await waitFor(() => {
      expect(screen.getByText('Failed to create chapter')).toBeInTheDocument()
    })
    expect(mockOnChapterCreated).not.toHaveBeenCalled()
  })

  it('calls onOpenChange(false) when Cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<CreateChapterDialog {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})
