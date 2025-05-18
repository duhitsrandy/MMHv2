/*
<ai_context>
Defines the database schema for profiles.
</ai_context>
*/

import { pgEnum, pgTable, text, timestamp, varchar, uniqueIndex, primaryKey, integer } from "drizzle-orm/pg-core"

export const membershipEnum = pgEnum("membership_enum", ["starter", "plus", "pro", "business"])

export const profilesTable = pgTable("profiles", {
  userId: text("user_id").primaryKey().notNull(),
  email: text("email"),
  username: varchar("username", { length: 50 }),
  membership: membershipEnum("membership").default("starter"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripePriceId: text("stripe_price_id"),
  seatCount: integer("seat_count").default(1),
  createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'date' }).$onUpdate(() => new Date())
})

export type InsertProfile = typeof profilesTable.$inferInsert
export type SelectProfile = typeof profilesTable.$inferSelect
