import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  membershipTier: text('membership_tier', { enum: ['monthly', 'lifetime'] }),
  membershipStatus: text('membership_status', { enum: ['active', 'canceled', 'expired'] }),
  membershipExpiresAt: integer('membership_expires_at', { mode: 'timestamp_ms' }),
  lifetimePurchased: integer('lifetime_purchased', { mode: 'boolean' }).notNull().default(false),
  mayarMemberId: text('mayar_member_id'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export const webhookEvents = sqliteTable('webhook_events', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  mayarEventId: text('mayar_event_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  payload: text('payload', { mode: 'json' }).notNull(),
  processedAt: integer('processed_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type WebhookEvent = typeof webhookEvents.$inferSelect
export type NewWebhookEvent = typeof webhookEvents.$inferInsert
