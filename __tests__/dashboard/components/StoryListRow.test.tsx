import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StoryListRow } from '@/components/dashboard/StoryListRow'
import type { Story } from '@/types/dashboard'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
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
  AlertDialogAction: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>{children}</button>
  ),
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <button>{children}</button>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  // Real Radix DropdownMenuItem composes both an onClick handler and its own
  // onSelect-driven selection handling from a single user click. This mock
  // fires both props on click (onClick first, then onSelect) to mirror that,
  // since StoryActionsMenu relies on stopPropagation happening in onClick
  // and the actual mutation firing from onSelect.
  DropdownMenuItem: ({
    children,
    onClick,
    onSelect,
  }: {
    children: React.ReactNode
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
    onSelect?: (e: Event) => void
  }) => (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e)
        onSelect?.(e as unknown as Event)
      }}
    >
      {children}
    </button>
  ),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const makeStory = (overrides: Partial<Story> = {}): Story => ({
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
  vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ data: { id: 'story-1' } }) } as Response)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('StoryListRow', () => {
  it('renders the story title and chapter count', () => {
    const story = makeStory({
      chapters: [{ id: 'ch-1', title: 'Ch 1', order: 1, wordCount: 5, previewText: '', storyId: 'story-1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' }],
    })
    render(<StoryListRow story={story} />, { wrapper: createWrapper() })
    expect(screen.getByText('My Great Story')).toBeInTheDocument()
    expect(screen.getByText('1 chapter')).toBeInTheDocument()
  })

  it('shows a pin badge only when pinned', () => {
    const { rerender } = render(<StoryListRow story={makeStory({ pinned: false })} />, { wrapper: createWrapper() })
    expect(screen.queryByTestId('pin-badge')).not.toBeInTheDocument()

    rerender(<StoryListRow story={makeStory({ pinned: true })} />)
    expect(screen.getByTestId('pin-badge')).toBeInTheDocument()
  })

  it('calls DELETE /api/stories/[id] via the "⋮" menu', async () => {
    const user = userEvent.setup()
    render(<StoryListRow story={makeStory({ id: 'story-abc' })} />, { wrapper: createWrapper() })

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

  it('does not throw when deletion fails at fetch level', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Not found' }),
    } as Response)

    const user = userEvent.setup()
    render(<StoryListRow story={makeStory({ id: 'story-abc' })} />, { wrapper: createWrapper() })

    await user.click(screen.getByRole('button', { name: /story options/i }))
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
