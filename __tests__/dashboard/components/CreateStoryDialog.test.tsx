import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateStoryDialog } from '@/components/dashboard/CreateStoryDialog'

const mockOnOpenChange = vi.fn()
const mockOnStoryCreated = vi.fn()

const defaultProps = {
  open: true,
  onOpenChange: mockOnOpenChange,
  onStoryCreated: mockOnStoryCreated,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ id: 'story-1', title: 'Test', chapters: [] }),
  } as Response)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CreateStoryDialog', () => {
  it('renders dialog title when open', () => {
    render(<CreateStoryDialog {...defaultProps} />)
    expect(screen.getByText('Create New Story')).toBeInTheDocument()
  })

  it('renders story title input when open', () => {
    render(<CreateStoryDialog {...defaultProps} />)
    expect(screen.getByPlaceholderText('My Amazing Story')).toBeInTheDocument()
  })

  it('renders Create Story submit button when open', () => {
    render(<CreateStoryDialog {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Create Story' })).toBeInTheDocument()
  })

  it('does not render dialog content when closed', () => {
    render(<CreateStoryDialog {...defaultProps} open={false} />)
    expect(screen.queryByText('Create New Story')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('My Amazing Story')).not.toBeInTheDocument()
  })

  it('POSTs to /api/stories with the entered title on submit', async () => {
    const user = userEvent.setup()
    render(<CreateStoryDialog {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('My Amazing Story'), 'My New Story')
    await user.click(screen.getByRole('button', { name: 'Create Story' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stories',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'My New Story' }),
        })
      )
    })
  })

  it('calls onStoryCreated with the response data after successful submit', async () => {
    const newStory = { id: 'story-new', title: 'My New Story', chapters: [] }
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => newStory,
    } as Response)

    const user = userEvent.setup()
    render(<CreateStoryDialog {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('My Amazing Story'), 'My New Story')
    await user.click(screen.getByRole('button', { name: 'Create Story' }))

    await waitFor(() => {
      expect(mockOnStoryCreated).toHaveBeenCalledWith(newStory)
    })
  })

  it('calls onOpenChange(false) after successful submit', async () => {
    const user = userEvent.setup()
    render(<CreateStoryDialog {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('My Amazing Story'), 'My Story')
    await user.click(screen.getByRole('button', { name: 'Create Story' }))

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('shows error message when the API call fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to create story' }),
    } as Response)

    const user = userEvent.setup()
    render(<CreateStoryDialog {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('My Amazing Story'), 'Bad Input')
    await user.click(screen.getByRole('button', { name: 'Create Story' }))

    await waitFor(() => {
      expect(screen.getByText('Failed to create story')).toBeInTheDocument()
    })
  })

  it('does not call onStoryCreated when the API call fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    } as Response)

    const user = userEvent.setup()
    render(<CreateStoryDialog {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('My Amazing Story'), 'Anything')
    await user.click(screen.getByRole('button', { name: 'Create Story' }))

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
    expect(mockOnStoryCreated).not.toHaveBeenCalled()
  })

  it('calls onOpenChange(false) when Cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<CreateStoryDialog {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows loading state while submitting', async () => {
    let resolveRequest: (value: unknown) => void
    vi.spyOn(global, 'fetch').mockImplementationOnce(
      () => new Promise((resolve) => { resolveRequest = resolve })
    )

    const user = userEvent.setup()
    render(<CreateStoryDialog {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('My Amazing Story'), 'My Story')
    await user.click(screen.getByRole('button', { name: 'Create Story' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Creating...' })).toBeInTheDocument()
    })

    resolveRequest!({
      ok: true,
      json: async () => ({ id: 'story-1', title: 'My Story', chapters: [] }),
    })
  })
})
