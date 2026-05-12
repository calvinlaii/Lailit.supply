import 'server-only'
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import * as schema from './schema'

export type DB = DrizzleD1Database<typeof schema>

export function getDB(): DB {
  const { env } = getCloudflareContext()
  return drizzle(env.DB, { schema })
}

export { schema }
export * from './schema'
