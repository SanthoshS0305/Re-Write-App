import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH, DELETE } from '@/app/api/stories/[id]/route'

const { mockGetServerSession } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
}))

vi.mock('@/lib/auth-server', () => ({
  getServerSession: mockGetServerSession,
}))

const { mockStoryFindFirst, mockStoryUpdate, mockStoryDelete, mockTransaction } = vi.hoisted(() => ({
  mockStoryFindFirst: vi.fn(),
  mockStoryUpdate: vi.fn(),
  mockStoryDelete: vi.fn(),
  mockTransaction: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    story: {
      findFirst: mockStoryFindFirst,
      update: mockStoryUpdate,
      delete: mockStoryDelete,
    },
    $transaction: mockTransaction,
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

const makeParams = (id: string) => Promise.resolve({ id })

describe('GET /api/stories/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns story wrapped in { data } for owner', async () => {
    const story = makeStory()
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryFindFirst.mockResolvedValueOnce(story)

    const req = new Request('http://localhost/api/stories/story-1')
    const res = await GET(req, { params: makeParams('story-1') })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toMatchObject({ id: 'story-1', title: 'My Story' })
  })

  it('queries story scoped to authenticated user', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryFindFirst.mockResolvedValueOnce(makeStory())

    const req = new Request('http://localhost/api/stories/story-1')
    await GET(req, { params: makeParams('story-1') })

    expect(mockStoryFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'story-1', userId: 'test-user-id' }),
      })
    )
  })

  it('returns 401 when there is no session', async () => {
    mockGetServerSession.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/stories/story-1')
    const res = await GET(req, { params: makeParams('story-1') })
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 404 when story belongs to a different user', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryFindFirst.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/stories/other-story')
    const res = await GET(req, { params: makeParams('other-story') })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Story not found')
  })
})

describe('PATCH /api/stories/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renames story via transaction and returns updated story wrapped in { data }', async () => {
    const updated = makeStory({ title: 'Renamed Story' })
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockTransaction.mockImplementationOnce(async (fn: (tx: {
      story: { findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
    }) => Promise<unknown>) =>
      fn({
        story: {
          findFirst: vi.fn().mockResolvedValueOnce(makeStory()),
          update: vi.fn().mockResolvedValueOnce(updated),
        },
      })
    )

    const req = new Request('http://localhost/api/stories/story-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Renamed Story' }),
    })
    const res = await PATCH(req, { params: makeParams('story-1') })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toMatchObject({ title: 'Renamed Story' })
  })

  it('returns 401 when there is no session', async () => {
    mockGetServerSession.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/stories/story-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Title' }),
    })
    const res = await PATCH(req, { params: makeParams('story-1') })
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 404 when story belongs to a different user', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    // Transaction finds no matching story for this user → returns null
    mockTransaction.mockImplementationOnce(async (fn: (tx: {
      story: { findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
    }) => Promise<unknown>) =>
      fn({
        story: {
          findFirst: vi.fn().mockResolvedValueOnce(null),
          update: vi.fn(),
        },
      })
    )

    const req = new Request('http://localhost/api/stories/other-story', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Title' }),
    })
    const res = await PATCH(req, { params: makeParams('other-story') })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Story not found')
  })

  it('returns 400 when title is empty', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)

    const req = new Request('http://localhost/api/stories/story-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    })
    const res = await PATCH(req, { params: makeParams('story-1') })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Title is required')
  })
})

describe('DELETE /api/stories/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes story for owner and returns { data: { id } }', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryFindFirst.mockResolvedValueOnce(makeStory({ id: 'story-1' }))
    mockStoryDelete.mockResolvedValueOnce({ id: 'story-1' })

    const req = new Request('http://localhost/api/stories/story-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: makeParams('story-1') })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toMatchObject({ id: 'story-1' })
  })

  it('verifies ownership before deleting', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryFindFirst.mockResolvedValueOnce(makeStory())
    mockStoryDelete.mockResolvedValueOnce({ id: 'story-1' })

    const req = new Request('http://localhost/api/stories/story-1', { method: 'DELETE' })
    await DELETE(req, { params: makeParams('story-1') })

    expect(mockStoryFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'story-1', userId: 'test-user-id' }),
      })
    )
    expect(mockStoryDelete).toHaveBeenCalledWith({ where: { id: 'story-1' } })
  })

  it('returns 401 when there is no session', async () => {
    mockGetServerSession.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/stories/story-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: makeParams('story-1') })
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 404 when story belongs to a different user', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockStoryFindFirst.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/stories/other-story', { method: 'DELETE' })
    const res = await DELETE(req, { params: makeParams('other-story') })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Story not found')
    expect(mockStoryDelete).not.toHaveBeenCalled()
  })
})
