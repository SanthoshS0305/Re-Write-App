import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH, DELETE } from '@/app/api/chapters/[id]/route'

const { mockGetServerSession } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
}))

vi.mock('@/lib/auth-server', () => ({
  getServerSession: mockGetServerSession,
}))

const {
  mockChapterFindFirst,
  mockChapterUpdate,
  mockChapterDelete,
} = vi.hoisted(() => ({
  mockChapterFindFirst: vi.fn(),
  mockChapterUpdate: vi.fn(),
  mockChapterDelete: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    chapter: {
      findFirst: mockChapterFindFirst,
      update: mockChapterUpdate,
      delete: mockChapterDelete,
    },
  },
}))

const AUTH_SESSION = {
  user: { id: 'test-user-id', email: 'test@example.com', name: 'Test' },
}

const makeChapter = (overrides: Record<string, unknown> = {}) => ({
  id: 'chapter-1',
  title: 'Chapter One',
  order: 1,
  wordCount: 0,
  storyId: 'story-1',
  content: { type: 'doc', content: [{ type: 'paragraph' }] },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

const makeParams = (id: string) => Promise.resolve({ id })

describe('PATCH /api/chapters/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates title and returns updated chapter wrapped in { data }', async () => {
    const existing = makeChapter()
    const updated = makeChapter({ title: 'Revised Title' })
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockChapterFindFirst.mockResolvedValueOnce(existing)
    mockChapterUpdate.mockResolvedValueOnce(updated)

    const req = new Request('http://localhost/api/chapters/chapter-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Revised Title' }),
    })
    const res = await PATCH(req, { params: makeParams('chapter-1') })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toMatchObject({ id: 'chapter-1', title: 'Revised Title' })
  })

  it('updates wordCount and returns updated chapter wrapped in { data }', async () => {
    const existing = makeChapter()
    const updated = makeChapter({ wordCount: 150 })
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockChapterFindFirst.mockResolvedValueOnce(existing)
    mockChapterUpdate.mockResolvedValueOnce(updated)

    const req = new Request('http://localhost/api/chapters/chapter-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordCount: 150 }),
    })
    const res = await PATCH(req, { params: makeParams('chapter-1') })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toMatchObject({ wordCount: 150 })
  })

  it('only updates provided fields', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockChapterFindFirst.mockResolvedValueOnce(makeChapter())
    mockChapterUpdate.mockResolvedValueOnce(makeChapter({ title: 'New Title' }))

    const req = new Request('http://localhost/api/chapters/chapter-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Title' }),
    })
    await PATCH(req, { params: makeParams('chapter-1') })

    expect(mockChapterUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: 'New Title' },
      })
    )
  })

  it('returns 401 when there is no session', async () => {
    mockGetServerSession.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/chapters/chapter-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Title' }),
    })
    const res = await PATCH(req, { params: makeParams('chapter-1') })
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 404 when chapter belongs to a different user', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockChapterFindFirst.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/chapters/other-chapter', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Title' }),
    })
    const res = await PATCH(req, { params: makeParams('other-chapter') })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Chapter not found')
    expect(mockChapterUpdate).not.toHaveBeenCalled()
  })

  it('verifies chapter ownership via story userId before updating', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockChapterFindFirst.mockResolvedValueOnce(makeChapter())
    mockChapterUpdate.mockResolvedValueOnce(makeChapter())

    const req = new Request('http://localhost/api/chapters/chapter-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' }),
    })
    await PATCH(req, { params: makeParams('chapter-1') })

    expect(mockChapterFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'chapter-1',
          story: { userId: 'test-user-id' },
        }),
      })
    )
  })
})

describe('DELETE /api/chapters/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes chapter for owner and returns { data: { id } }', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockChapterFindFirst.mockResolvedValueOnce(makeChapter({ id: 'chapter-1' }))
    mockChapterDelete.mockResolvedValueOnce({ id: 'chapter-1' })

    const req = new Request('http://localhost/api/chapters/chapter-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: makeParams('chapter-1') })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toMatchObject({ id: 'chapter-1' })
  })

  it('verifies ownership before deleting', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockChapterFindFirst.mockResolvedValueOnce(makeChapter())
    mockChapterDelete.mockResolvedValueOnce({ id: 'chapter-1' })

    const req = new Request('http://localhost/api/chapters/chapter-1', { method: 'DELETE' })
    await DELETE(req, { params: makeParams('chapter-1') })

    expect(mockChapterFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'chapter-1',
          story: { userId: 'test-user-id' },
        }),
      })
    )
    expect(mockChapterDelete).toHaveBeenCalledWith({ where: { id: 'chapter-1' } })
  })

  it('returns 401 when there is no session', async () => {
    mockGetServerSession.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/chapters/chapter-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: makeParams('chapter-1') })
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 404 when chapter belongs to a different user', async () => {
    mockGetServerSession.mockResolvedValueOnce(AUTH_SESSION)
    mockChapterFindFirst.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/chapters/other-chapter', { method: 'DELETE' })
    const res = await DELETE(req, { params: makeParams('other-chapter') })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Chapter not found')
    expect(mockChapterDelete).not.toHaveBeenCalled()
  })
})
