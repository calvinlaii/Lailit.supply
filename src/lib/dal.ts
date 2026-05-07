import 'server-only'
import { cache } from 'react'
import { currentUser } from '@clerk/nextjs/server'

export const getUser = cache(async () => {
  const user = await currentUser()
  if (!user) return null
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    ''
  return {
    id: user.id,
    email,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
  }
})
