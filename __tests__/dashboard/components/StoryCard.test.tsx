import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StoryCard } from '@/components/dashboard/StoryCard'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <button>{children}</button>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div role="dialog">{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
  AlertDialogAction: ({
    children,
    onClick,
  }: {
    children: React.ReactNode
    onClick?: () => void
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const makeStory = (overrides: Record<string, unknown> = {}) => ({
  id: 'story-1',
  title: 'My Great Story',
  userId: 'test-user-id',
  chapters: [],
  createdAt: new Date('2024-01-15').toISOString(),
  updatedAt: new Date('2024-01-15').toISOString(),
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ data: { id: 'story-1' } }),
  } as Response)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('StoryCard', () => {
  it('renders the story title', () => {
    render(<StoryCard story={makeStory()} />, { wrapper: createWrapper() })
    expect(screen.getByText('My Great Story')).toBeInTheDocument()
  })

  it('renders correct chapter count for zero chapters', () => {
    render(<StoryCard story={makeStory({ chapters: [] })} />, { wrapper: createWrapper() })
    expect(screen.getByText('0 chapters')).toBeInTheDocument()
  })

  it('renders correct chapter count for one chapter with singular form', () => {
    const story = makeStory({
      chapters: [{ id: 'ch-1', title: 'Chapter 1', order: 1, wordCount: 0, storyId: 'story-1' }],
    })
    render(<StoryCard story={story} />, { wrapper: createWrapper() })
    expect(screen.getByText('1 chapter')).toBeInTheDocument()
  })

  it('renders correct chapter count for multiple chapters', () => {
    const story = makeStory({
      chapters: [
        { id: 'ch-1', title: 'Chapter 1', order: 1, wordCount: 0, storyId: 'story-1' },
        { id: 'ch-2', title: 'Chapter 2', order: 2, wordCount: 0, storyId: 'story-1' },
        { id: 'ch-3', title: 'Chapter 3', order: 3, wordCount: 0, storyId: 'story-1' },
      ],
    })
    render(<StoryCard story={story} />, { wrapper: createWrapper() })
    expect(screen.getByText('3 chapters')).toBeInTheDocument()
  })

  it('links to the story detail page', () => {
    render(<StoryCard story={makeStory()} />, { wrapper: createWrapper() })
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/dashboard/stories/story-1')
  })

  it('renders a delete (trash) button', () => {
    render(<StoryCard story={makeStory()} />, { wrapper: createWrapper() })
    // AlertDialog mock renders Cancel+Delete inline, so use getAllByRole
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('shows Delete Story heading in the confirmation area', () => {
    render(<StoryCard story={makeStory()} />, { wrapper: createWrapper() })
    // AlertDialog mock renders all children inline (no portal), heading is always present
    expect(screen.getByText('Delete Story')).toBeInTheDocument()
  })

  it('shows story title in the confirmation description', () => {
    render(<StoryCard story={makeStory({ title: 'Important Novel' })} />, {
      wrapper: createWrapper(),
    })
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/Important Novel/)).toBeInTheDocument()
  })

  it('calls DELETE /api/stories/[id] when Delete button is clicked', async () => {
    const user = userEvent.setup()
    render(<StoryCard story={makeStory({ id: 'story-abc' })} />, { wrapper: createWrapper() })

    await user.click(screen.getByText('Delete'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stories/story-abc',
        { method: 'DELETE' }
      )
    })
  })

  it('does not throw when deletion fails at fetch level', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Not found' }),
    } as Response)

    const user = userEvent.setup()
    render(<StoryCard story={makeStory()} />, { wrapper: createWrapper() })

    await user.click(screen.getByText('Delete'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })
})
