// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock Clerk — must happen before importing the module under test so that the
// module-level import of '@clerk/nextjs/server' picks up the mock.
// ---------------------------------------------------------------------------
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    user: { upsert: vi.fn() },
    restaurant: { findFirst: vi.fn() },
  },
  setUserContext: vi.fn(),
}))

// next/server is available in the test environment through jsdom + Next config,
// but we mock NextResponse to keep assertions simple.
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 })),
  },
}))

import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser, requireRestaurant } from '../user'

const mockAuth = vi.mocked(auth)
const mockCurrentUser = vi.mocked(currentUser)
const mockUpsert = vi.mocked(db.user.upsert)
const mockFindFirst = vi.mocked(db.restaurant.findFirst)

const FAKE_USER = {
  id: 'db-user-1',
  clerkId: 'clerk-user-1',
  email: 'test@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const FAKE_RESTAURANT = {
  id: 'rest-1',
  userId: 'db-user-1',
  name: 'Test Bistro',
}

// ---------------------------------------------------------------------------
// getOrCreateDbUser
// ---------------------------------------------------------------------------

describe('getOrCreateDbUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return null when there is no authenticated Clerk user', async () => {
    mockCurrentUser.mockResolvedValue(null as any)

    const result = await getOrCreateDbUser()

    expect(result).toBeNull()
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('should upsert and return the db user when Clerk user exists', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'clerk-user-1',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      primaryEmailAddress: null,
    } as any)
    mockUpsert.mockResolvedValue(FAKE_USER as any)

    const result = await getOrCreateDbUser()

    expect(mockUpsert).toHaveBeenCalledOnce()
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clerkId: 'clerk-user-1' },
        create: expect.objectContaining({ clerkId: 'clerk-user-1', email: 'test@example.com' }),
      }),
    )
    expect(result).toEqual(FAKE_USER)
  })

  it('should fall back to primaryEmailAddress when emailAddresses is empty', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'clerk-user-1',
      emailAddresses: [],
      primaryEmailAddress: { emailAddress: 'primary@example.com' },
    } as any)
    mockUpsert.mockResolvedValue({ ...FAKE_USER, email: 'primary@example.com' } as any)

    await getOrCreateDbUser()

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ email: 'primary@example.com' }),
      }),
    )
  })

  it('should use empty string for email when both address sources are missing', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'clerk-user-1',
      emailAddresses: [],
      primaryEmailAddress: null,
    } as any)
    mockUpsert.mockResolvedValue({ ...FAKE_USER, email: '' } as any)

    await getOrCreateDbUser()

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ email: '' }),
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// requireRestaurant
// ---------------------------------------------------------------------------

describe('requireRestaurant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 response when user is not authenticated', async () => {
    mockAuth.mockReturnValue({ userId: null } as any)

    const result = await requireRestaurant()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect((result.response as any).status).toBe(401)
    }
  })

  it('should return 404 response when getOrCreateDbUser returns null', async () => {
    mockAuth.mockReturnValue({ userId: 'clerk-user-1' } as any)
    // currentUser returns null → getOrCreateDbUser returns null
    mockCurrentUser.mockResolvedValue(null as any)

    const result = await requireRestaurant()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect((result.response as any).status).toBe(404)
    }
  })

  it('should return 404 response when no restaurant is linked to the user', async () => {
    mockAuth.mockReturnValue({ userId: 'clerk-user-1' } as any)
    mockCurrentUser.mockResolvedValue({
      id: 'clerk-user-1',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      primaryEmailAddress: null,
    } as any)
    mockUpsert.mockResolvedValue(FAKE_USER as any)
    mockFindFirst.mockResolvedValue(null as any)

    const result = await requireRestaurant()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect((result.response as any).status).toBe(404)
    }
  })

  it('should return ok:true with user and restaurant when everything exists', async () => {
    mockAuth.mockReturnValue({ userId: 'clerk-user-1' } as any)
    mockCurrentUser.mockResolvedValue({
      id: 'clerk-user-1',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      primaryEmailAddress: null,
    } as any)
    mockUpsert.mockResolvedValue(FAKE_USER as any)
    mockFindFirst.mockResolvedValue(FAKE_RESTAURANT as any)

    const result = await requireRestaurant()

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.user).toEqual(FAKE_USER)
      expect(result.restaurant).toEqual(FAKE_RESTAURANT)
    }
  })

  it('should query restaurant by the db user id (not the Clerk id)', async () => {
    mockAuth.mockReturnValue({ userId: 'clerk-user-1' } as any)
    mockCurrentUser.mockResolvedValue({
      id: 'clerk-user-1',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      primaryEmailAddress: null,
    } as any)
    mockUpsert.mockResolvedValue(FAKE_USER as any)
    mockFindFirst.mockResolvedValue(FAKE_RESTAURANT as any)

    await requireRestaurant()

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: FAKE_USER.id } }),
    )
  })
})
