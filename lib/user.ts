import { currentUser } from '@clerk/nextjs/server'
import { db } from './db'

export async function getOrCreateDbUser() {
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  return db.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {},
    create: {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0].emailAddress,
    },
  })
}
