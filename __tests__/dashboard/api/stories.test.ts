import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/stories/route'

const { mockGetServerSession } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
}))

vi.mock('@/lib/auth-server', () => ({
  getServerSession: mockGetServerSession,
}))

const { mockStoryFindMany, mockStoryCreate } = vi.hoisted(() => ({
  mockStoryFindMany: vi.fn(),
  mockStoryCreate: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    story: {
      findMany: mockStoryFindMany,
      create: mockStoryCreate,
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
  chapters: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

describe('GET /api/stories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns story array wrapped in { data } for authenticated user', async () => {
    const stories = [makeStory(), makeStory({ id: 'story-2', title: 'Second Story' })]
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryFindMany.mockResolvedValueOnce(stories)

    const req = new Request('http://localhost/api/stories')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toMatchObject({ id: 'story-1', title: 'My Story' })
  })

  it('queries only stories belonging to the authenticated user', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryFindMany.mockResolvedValueOnce([])

    const req = new Request('http://localhost/api/stories')
    await GET(req)

    expect(mockStoryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'test-user-id' },
      })
    )
  })

  it('returns 401 when there is no session', async () => {
    mockGetServerSession.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/stories')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
    expect(mockStoryFindMany).not.toHaveBeenCalled()
  })
})

describe('POST /api/stories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a story and returns it wrapped in { data } with 201', async () => {
    const created = makeStory({ id: 'new-story', title: 'Brand New Story' })
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryCreate.mockResolvedValueOnce(created)

    const req = new Request('http://localhost/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Brand New Story' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data).toMatchObject({ id: 'new-story', title: 'Brand New Story' })
  })

  it('creates a story owned by the authenticated user', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryCreate.mockResolvedValueOnce(makeStory())

    const req = new Request('http://localhost/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'My Story' }),
    })
    await POST(req)

    expect(mockStoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'test-user-id' }),
      })
    )
  })

  it('trims whitespace from the title before saving', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryCreate.mockResolvedValueOnce(makeStory({ title: 'Trimmed Title' }))

    const req = new Request('http://localhost/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '  Trimmed Title  ' }),
    })
    await POST(req)

    expect(mockStoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: 'Trimmed Title' }),
      })
    )
  })

  it('returns 400 when title is an empty string', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)

    const req = new Request('http://localhost/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Title is required')
    expect(mockStoryCreate).not.toHaveBeenCalled()
  })

  it('returns 400 when title is whitespace only', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)

    const req = new Request('http://localhost/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '   ' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Title is required')
  })

  it('returns 400 when title field is missing', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)

    const req = new Request('http://localhost/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Title is required')
  })

  it('returns 401 when there is no session', async () => {
    mockGetServerSession.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Story' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
    expect(mockStoryCreate).not.toHaveBeenCalled()
  })
})
