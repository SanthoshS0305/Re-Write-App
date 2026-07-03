/**
 * Tests for lib/auth-server.ts — getServerSession()
 *
 * NOTE: The Prisma-dependent behaviour of getServerSession() (DB lookup, user creation)
 * is NOT tested here. Per project rules, Prisma internals must never be mocked because
 * mock/prod divergence has caused real bugs before. A real test DB (separate DATABASE_URL)
 * or a prisma.$transaction + rollback pattern is required for those paths.
 *
 * Tests that require a real DB are marked with .todo and should be implemented by the
 * backend agent once a test database is provisioned.
 *
 * What IS tested here:
 * - The early-return when Clerk reports no authenticated user (userId is null)
 *   This path never touches Prisma, so it can be tested safely with only a Clerk mock.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
  currentUser: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(null),
    },
  },
}))

import { getServerSession } from '@/lib/auth-server'

describe('getServerSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null immediately when Clerk reports no authenticated user', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null })

    const session = await getServerSession()

    expect(session).toBeNull()
  })

  it('calls auth() to determine the current user identity', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null })

    await getServerSession()

    expect(mockAuth).toHaveBeenCalledOnce()
  })

  it.todo('returns user from DB when user exists with matching clerkId — requires real test DB')
  it.todo('creates DB user from Clerk data when user does not exist in DB — requires real test DB')
  it.todo('creates DB user with empty email when Clerk user has no email addresses — requires real test DB')
  it.todo('builds full name by joining firstName and lastName — requires real test DB')
})
