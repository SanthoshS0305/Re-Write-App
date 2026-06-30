import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/chapters/route'

const { mockGetServerSession } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
}))

vi.mock('@/lib/auth-server', () => ({
  getServerSession: mockGetServerSession,
}))

const {
  mockStoryFindFirst,
  mockChapterFindMany,
  mockChapterFindFirst,
  mockChapterCreate,
} = vi.hoisted(() => ({
  mockStoryFindFirst: vi.fn(),
  mockChapterFindMany: vi.fn(),
  mockChapterFindFirst: vi.fn(),
  mockChapterCreate: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    story: {
      findFirst: mockStoryFindFirst,
    },
    chapter: {
      findMany: mockChapterFindMany,
      findFirst: mockChapterFindFirst,
      create: mockChapterCreate,
    },
  },
}))

const AUTH_SESSION = {
  user: { id: 'test-user-id', email: 'test@example.com', name: 'Test' },
}

const makeStory = (overrides: Record<string, unknown> = {}) => ({
  id: 'story-1',
  title: 'My Story',
  userId: 'test-user-id',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

const makeChapter = (overrides: Record<string, unknown> = {}) => ({
  id: 'chapter-1',
  title: 'Chapter 1',
  order: 1,
  wordCount: 0,
  storyId: 'story-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

describe('GET /api/chapters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns chapter array wrapped in { data } for valid owned storyId', async () => {
    const chapters = [makeChapter(), makeChapter({ id: 'chapter-2', title: 'Chapter 2', order: 2 })]
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryFindFirst.mockResolvedValueOnce(makeStory())
    mockChapterFindMany.mockResolvedValueOnce(chapters)

    const req = new Request('http://localhost/api/chapters?storyId=story-1')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toMatchObject({ id: 'chapter-1', title: 'Chapter 1' })
  })

  it('verifies story ownership before returning chapters', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryFindFirst.mockResolvedValueOnce(makeStory())
    mockChapterFindMany.mockResolvedValueOnce([])

    const req = new Request('http://localhost/api/chapters?storyId=story-1')
    await GET(req)

    expect(mockStoryFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'story-1', userId: 'test-user-id' }),
      })
    )
  })

  it('returns 400 when storyId query param is missing', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)

    const req = new Request('http://localhost/api/chapters')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('storyId is required')
    expect(mockStoryFindFirst).not.toHaveBeenCalled()
  })

  it('returns 401 when there is no session', async () => {
    mockGetServerSession.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/chapters?storyId=story-1')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 404 when storyId belongs to a different user', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryFindFirst.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/chapters?storyId=other-story')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Story not found')
    expect(mockChapterFindMany).not.toHaveBeenCalled()
  })
})

describe('POST /api/chapters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates chapter with correct order and returns it wrapped in { data } with 201', async () => {
    const created = makeChapter({ id: 'new-chapter', title: 'New Chapter', order: 2 })
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryFindFirst.mockResolvedValueOnce(makeStory())
    mockChapterFindFirst.mockResolvedValueOnce(makeChapter({ order: 1 }))
    mockChapterCreate.mockResolvedValueOnce(created)

    const req = new Request('http://localhost/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Chapter', storyId: 'story-1' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data).toMatchObject({ id: 'new-chapter', title: 'New Chapter' })
  })

  it('assigns order 1 when no chapters exist yet', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryFindFirst.mockResolvedValueOnce(makeStory())
    mockChapterFindFirst.mockResolvedValueOnce(null)
    mockChapterCreate.mockResolvedValueOnce(makeChapter({ order: 1 }))

    const req = new Request('http://localhost/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'First Chapter', storyId: 'story-1' }),
    })
    await POST(req)

    expect(mockChapterCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ order: 1 }),
      })
    )
  })

  it('assigns order as lastChapter.order + 1', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryFindFirst.mockResolvedValueOnce(makeStory())
    mockChapterFindFirst.mockResolvedValueOnce(makeChapter({ order: 5 }))
    mockChapterCreate.mockResolvedValueOnce(makeChapter({ order: 6 }))

    const req = new Request('http://localhost/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Chapter 6', storyId: 'story-1' }),
    })
    await POST(req)

    expect(mockChapterCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ order: 6 }),
      })
    )
  })

  it('returns 400 when title is empty', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)

    const req = new Request('http://localhost/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '', storyId: 'story-1' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Title is required')
    expect(mockChapterCreate).not.toHaveBeenCalled()
  })

  it('returns 400 when title is missing', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)

    const req = new Request('http://localhost/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyId: 'story-1' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Title is required')
  })

  it('returns 401 when there is no session', async () => {
    mockGetServerSession.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Chapter 1', storyId: 'story-1' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 404 when storyId belongs to a different user', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryFindFirst.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Chapter 1', storyId: 'other-story' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Story not found')
    expect(mockChapterCreate).not.toHaveBeenCalled()
  })
})
