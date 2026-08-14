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

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <button>{children}</button>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>{children}</button>
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
  pinned: false,
  lastAccessedAt: new Date('2024-01-15').toISOString(),
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
      chapters: [{ id: 'ch-1', title: 'Chapter 1', order: 1, wordCount: 0, previewText: '', storyId: 'story-1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' }],
    })
    render(<StoryCard story={story} />, { wrapper: createWrapper() })
    expect(screen.getByText('1 chapter')).toBeInTheDocument()
  })

  it('renders correct chapter count for multiple chapters', () => {
    const story = makeStory({
      chapters: [
        { id: 'ch-1', title: 'Chapter 1', order: 1, wordCount: 0, previewText: '', storyId: 'story-1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'ch-2', title: 'Chapter 2', order: 2, wordCount: 0, previewText: '', storyId: 'story-1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'ch-3', title: 'Chapter 3', order: 3, wordCount: 0, previewText: '', storyId: 'story-1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
      ],
    })
    render(<StoryCard story={story} />, { wrapper: createWrapper() })
    expect(screen.getByText('3 chapters')).toBeInTheDocument()
  })

  it('renders the previewText of the last-modified chapter as a thumbnail', () => {
    const story = makeStory({
      chapters: [
        { id: 'ch-1', title: 'Ch 1', order: 1, wordCount: 5, previewText: 'Old text', storyId: 'story-1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'ch-2', title: 'Ch 2', order: 2, wordCount: 5, previewText: 'Newest text', storyId: 'story-1', createdAt: '2024-06-01T00:00:00.000Z', updatedAt: '2024-06-01T00:00:00.000Z' },
      ],
    })
    render(<StoryCard story={story} />, { wrapper: createWrapper() })
    expect(screen.getByText('Newest text')).toBeInTheDocument()
  })

  it('opens the "⋮" menu and deletes via DELETE /api/stories/[id]', async () => {
    const user = userEvent.setup()
    render(<StoryCard story={makeStory({ id: 'story-abc' })} />, { wrapper: createWrapper() })

    await user.click(screen.getByRole('button', { name: /story options/i }))
    // The dumb AlertDialog/DropdownMenu mocks render both the menu's "Delete"
    // trigger and the dialog's "Delete" confirm button unconditionally (no
    // open-state gating like real Radix), so both share the literal text
    // "Delete". Disambiguate by dialog scoping rather than DOM order.
    const deleteMenuItem = screen
      .getAllByText('Delete')
      .find((el) => !el.closest('[role="dialog"]'))
    if (!deleteMenuItem) throw new Error('Delete menu item not found')
    await user.click(deleteMenuItem)
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^delete$/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/stories/story-abc', { method: 'DELETE' })
    })
  })
})

describe('StoryCard pin toggle', () => {
  it('shows a pin badge only when the story is pinned', () => {
    const { rerender } = render(<StoryCard story={makeStory({ pinned: false })} />, { wrapper: createWrapper() })
    expect(screen.queryByTestId('pin-badge')).not.toBeInTheDocument()

    rerender(<StoryCard story={makeStory({ pinned: true })} />)
    expect(screen.getByTestId('pin-badge')).toBeInTheDocument()
  })

  it('calls PATCH /api/stories/[id] with pinned: true from the "⋮" menu when unpinned', async () => {
    const user = userEvent.setup()
    render(<StoryCard story={makeStory({ id: 'story-abc', pinned: false })} />, { wrapper: createWrapper() })

    await user.click(screen.getByRole('button', { name: /story options/i }))
    await user.click(screen.getByText('Pin'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stories/story-abc',
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ pinned: true }) })
      )
    })
  })

  it('calls PATCH /api/stories/[id] with pinned: false from the "⋮" menu when pinned', async () => {
    const user = userEvent.setup()
    render(<StoryCard story={makeStory({ id: 'story-abc', pinned: true })} />, { wrapper: createWrapper() })

    await user.click(screen.getByRole('button', { name: /story options/i }))
    await user.click(screen.getByText('Unpin'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stories/story-abc',
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ pinned: false }) })
      )
    })
  })
})
