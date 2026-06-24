import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { prisma } from '@/lib/db/prisma'

type EmailAddress = {
  email_address: string
}

type ClerkUserPayload = {
  id: string
  email_addresses: EmailAddress[]
  first_name: string | null
  last_name: string | null
  image_url: string | null
}

type WebhookEvent =
  | { type: 'user.created'; data: ClerkUserPayload }
  | { type: 'user.updated'; data: ClerkUserPayload }
  | { type: 'user.deleted'; data: { id: string } }

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) {
    return Response.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const headersList = await headers()
  const svixId = headersList.get('svix-id')
  const svixTimestamp = headersList.get('svix-timestamp')
  const svixSignature = headersList.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const body = await req.text()

  const wh = new Webhook(webhookSecret)
  let event: WebhookEvent

  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch {
    return Response.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'user.created':
    case 'user.updated': {
      const { id, email_addresses, first_name, last_name, image_url } = event.data
      const email = email_addresses[0]?.email_address ?? ''
      const name = [first_name, last_name].filter(Boolean).join(' ') || null

      await prisma.user.upsert({
        where: { clerkId: id },
        create: { clerkId: id, email, name, image: image_url ?? null },
        update: { email, name, image: image_url ?? null },
      })
      break
    }

    case 'user.deleted': {
      const { id } = event.data
      await prisma.user.deleteMany({ where: { clerkId: id } })
      break
    }

    default:
      break
  }

  return Response.json({ data: 'Webhook processed' })
}
