import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardContent } from '@/components/dashboard/DashboardContent'

vi.mock('@clerk/nextjs', () => ({
  useClerk: () => ({ signOut: vi.fn() }),
}))

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

vi.mock('@/components/dashboard/CreateStoryDialog', () => ({
  CreateStoryDialog: () => null,
}))

vi.mock('@/components/dashboard/ImportDialog', () => ({
  ImportDialog: () => null,
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const STORIES = [
  {
    id: 'story-1',
    title: 'The Great Adventure',
    userId: 'user-1',
    pinned: false,
    lastAccessedAt: new Date('2024-01-01').toISOString(),
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    chapters: [
      {
        id: 'chapter-1',
        title: 'The Escape',
        order: 1,
        wordCount: 100,
        previewText: '',
        storyId: 'story-1',
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-01-01').toISOString(),
      },
    ],
  },
  {
    id: 'story-2',
    title: 'Quiet Mountains',
    userId: 'user-1',
    pinned: false,
    lastAccessedAt: new Date('2024-02-01').toISOString(),
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    chapters: [],
  },
]

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ data: STORIES }),
  } as Response)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DashboardContent search', () => {
  it('renders both stories when there is no search query', async () => {
    render(<DashboardContent />, { wrapper: createWrapper() })
    expect(await screen.findByText('The Great Adventure')).toBeInTheDocument()
    expect(screen.getByText('Quiet Mountains')).toBeInTheDocument()
  })

  it('renders a chapter result tile linking to the editor when a chapter title matches', async () => {
    const user = userEvent.setup()
    render(<DashboardContent />, { wrapper: createWrapper() })
    await screen.findByText('The Great Adventure')

    await user.type(screen.getByLabelText('Search stories and chapters'), 'escape')

    const link = await screen.findByRole('link', { name: /the escape/i })
    expect(link).toHaveAttribute('href', '/editor/chapter-1')
  })

  it('shows a no-matches message when nothing matches the query', async () => {
    const user = userEvent.setup()
    render(<DashboardContent />, { wrapper: createWrapper() })
    await screen.findByText('The Great Adventure')

    await user.type(screen.getByLabelText('Search stories and chapters'), 'nonexistent')

    expect(await screen.findByText(/no matches for/i)).toBeInTheDocument()
  })
})

describe('DashboardContent view toggle', () => {
  it('defaults to grid view, showing story cards', async () => {
    render(<DashboardContent />, { wrapper: createWrapper() })
    await screen.findByText('The Great Adventure')
    expect(screen.getByRole('link', { name: /the great adventure/i })).toBeInTheDocument()
  })

  it('switches to list view when the list toggle is clicked', async () => {
    const user = userEvent.setup()
    render(<DashboardContent />, { wrapper: createWrapper() })
    await screen.findByText('The Great Adventure')

    await user.click(screen.getByRole('button', { name: /list view/i }))

    // Still renders the story, just via StoryListRow instead of StoryCard
    expect(screen.getByText('The Great Adventure')).toBeInTheDocument()
  })
})
