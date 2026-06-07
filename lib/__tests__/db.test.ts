// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Capture how db.ts wires the Prisma client without opening a real connection.
// vi.hoisted runs before the (hoisted) imports so these exist when the mock
// factory and db.ts module evaluation reference them.
const { extendsArgs, transactionMock } = vi.hoisted(() => ({
  extendsArgs: [] as any[],
  transactionMock: vi.fn(),
}))

vi.mock('@prisma/adapter-pg', () => ({ PrismaPg: vi.fn() }))
vi.mock('@prisma/client', () => {
  class PrismaClient {
    $extends(arg: any) {
      extendsArgs.push(arg)
      return { __extended: true }
    }
    $transaction(arg: any) {
      return transactionMock(arg)
    }
    $executeRaw() {
      return 'RAW'
    }
  }
  return { PrismaClient, Prisma: {} }
})

import { setUserContext, userContext, rlsTransaction } from '../db'

beforeEach(() => {
  transactionMock.mockReset()
})

describe('user context (AsyncLocalStorage)', () => {
  it('setUserContext makes the clerk id retrievable in the same async context', () => {
    setUserContext('clerk-abc')
    expect(userContext.getStore()).toBe('clerk-abc')
  })

  it('can be cleared', () => {
    setUserContext('clerk-abc')
    setUserContext(undefined)
    expect(userContext.getStore()).toBeUndefined()
  })
})

describe('query extension', () => {
  it('passes operations through untouched when no user context is set', async () => {
    const op = extendsArgs[0].query.$allModels.$allOperations
    const query = vi.fn().mockResolvedValue('RESULT')
    setUserContext(undefined)

    const out = await op({ args: { id: 1 }, query })

    // No context (or RLS disabled by default) → run the query directly, no tx wrap.
    expect(query).toHaveBeenCalledWith({ id: 1 })
    expect(out).toBe('RESULT')
    expect(transactionMock).not.toHaveBeenCalled()
  })
})

describe('rlsTransaction', () => {
  it('runs the callback inside a single interactive transaction', async () => {
    const innerExec = vi.fn()
    transactionMock.mockImplementation(async (cb: any) => cb({ $executeRaw: innerExec }))

    const result = await rlsTransaction(async () => 'committed')

    expect(transactionMock).toHaveBeenCalledOnce()
    expect(result).toBe('committed')
    // RLS disabled by default → no set_config issued inside the transaction.
    expect(innerExec).not.toHaveBeenCalled()
  })
})
