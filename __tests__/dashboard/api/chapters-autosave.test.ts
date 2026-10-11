import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from '@/app/api/chapters/[id]/autosave/route'

const { mockGetServerSession } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
}))

vi.mock('@/lib/auth-server', () => ({
  getServerSession: mockGetServerSession,
}))

const { mockChapterFindFirst, mockChapterUpdate } = vi.hoisted(() => ({
  mockChapterFindFirst: vi.fn(),
  mockChapterUpdate: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    chapter: {
      findFirst: mockChapterFindFirst,
      update: mockChapterUpdate,
    },
  },
}))

const AUTH_SESSION = { user: { id: 'test-user-id', email: 'test@example.com', name: 'Test' } }
const makeParams = (id: string) => Promise.resolve({ id })

describe('PATCH /api/chapters/[id]/autosave', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('recomputes previewText from content and saves it alongside wordCount', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockChapterFindFirst.mockResolvedValueOnce({ id: 'chapter-1', storyId: 'story-1' })
    mockChapterUpdate.mockResolvedValueOnce({ id: 'chapter-1' })

    const content = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] }],
    }

    const req = new Request('http://localhost/api/chapters/chapter-1/autosave', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    await PATCH(req, { params: makeParams('chapter-1') })

    expect(mockChapterUpdate).toHaveBeenCalledWith({
      where: { id: 'chapter-1' },
      data: expect.objectContaining({
        content,
        wordCount: 2,
        previewText: 'Hello world',
      }),
    })
  })
})
