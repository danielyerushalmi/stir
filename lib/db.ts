import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { AsyncLocalStorage } from 'node:async_hooks'

// Optional explicit override for the Clerk user id used as the RLS context.
// Mainly for non-request contexts (scripts/tests) that set it deliberately.
// In normal requests we read Clerk's auth() directly (see resolveClerkId) because
// AsyncLocalStorage set via enterWith inside an awaited helper does NOT reliably
// propagate back to the route's later queries — Clerk's own request context does.
export const userContext = new AsyncLocalStorage<string | undefined>()

/** Explicitly bind a Clerk user id as the RLS context (override). */
export function setUserContext(clerkId: string | undefined): void {
  userContext.enterWith(clerkId)
}

/**
 * Resolve the current request's Clerk user id for the RLS context: an explicit
 * override wins; otherwise read Clerk's auth() (imported lazily so this module
 * stays usable in tests / outside a request, where auth() simply yields none).
 */
async function resolveClerkId(): Promise<string | undefined> {
  const override = userContext.getStore()
  if (override) return override
  try {
    const { auth } = await import('@clerk/nextjs/server')
    const { userId } = await auth()
    return userId ?? undefined
  } catch {
    return undefined
  }
}

// Defense-in-depth: when enabled, every query runs inside a transaction that first
// sets `app.clerk_user_id`, so database RLS policies (see the
// 20260607000000_rls_app_role_enforcement migration) enforce tenant isolation.
// Off by default so the app behaves exactly as before until the dedicated,
// non-BYPASSRLS DB role is provisioned and DATABASE_URL is rotated. See the
// migration header for the cutover runbook.
const RLS_ENFORCED = process.env.RLS_ENFORCED === 'true'

function createBaseClient() {
  const connectionString = process.env.DATABASE_URL!
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
  prismaBase?: PrismaClient
}

// The un-extended client. Used directly only by rlsTransaction (so the operations
// inside an interactive transaction are not double-wrapped by the extension).
const base = globalForPrisma.prismaBase ?? createBaseClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaBase = base

function setConfig(tx: Pick<PrismaClient, '$executeRaw'>, clerkId: string) {
  // set_config(..., true) is transaction-local, so it is scoped to this query and
  // safe under connection pooling (including Supabase transaction-mode pooling).
  return tx.$executeRaw`SELECT set_config('app.clerk_user_id', ${clerkId}, true)`
}

export const db = base.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        const clerkId = RLS_ENFORCED ? await resolveClerkId() : undefined
        // No context (or RLS disabled): run normally. When RLS is enforced and no
        // context is set, the DB policies deny by default — fail closed.
        if (!clerkId) return query(args)
        const [, result] = await base.$transaction([setConfig(base, clerkId), query(args)])
        return result
      },
    },
  },
})

/**
 * Run multiple statements in a single transaction with the RLS context applied.
 * Use this instead of `db.$transaction([...])` for multi-write batches: it sets
 * `app.clerk_user_id` once and exposes an un-extended `tx` client so the inner
 * operations are not re-wrapped in nested transactions.
 */
export async function rlsTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  const clerkId = RLS_ENFORCED ? await resolveClerkId() : undefined
  return base.$transaction(async (tx) => {
    if (clerkId) await setConfig(tx, clerkId)
    return fn(tx)
  })
}
