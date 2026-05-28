import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

export async function getServerSession() {
  const { userId } = await auth()
  if (!userId) return null

  let dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })

  if (!dbUser) {
    const clerkUser = await currentUser()
    dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser?.emailAddresses[0]?.emailAddress ?? '',
        name: [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || null,
        image: clerkUser?.imageUrl ?? null,
      },
    })
  }

  return { user: { id: dbUser.id, email: dbUser.email, name: dbUser.name, image: dbUser.image } }
}
