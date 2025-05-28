import { pgTable, foreignKey, pgPolicy, uuid, text, timestamp, index, boolean, unique, varchar, integer, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const membershipEnum = pgEnum("membership_enum", ['starter', 'plus', 'pro', 'business'])
export const poiType = pgEnum("poi_type", ['restaurant', 'cafe', 'park', 'bar', 'library', 'other'])


export const pois = pgTable("pois", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	searchId: uuid("search_id").notNull(),
	name: text().notNull(),
	address: text().notNull(),
	latitude: text().notNull(),
	longitude: text().notNull(),
	type: poiType().notNull(),
	travelTimeFromStart: text("travel_time_from_start"),
	travelTimeFromEnd: text("travel_time_from_end"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	userId: uuid("user_id"),
}, (table) => [
	foreignKey({
			columns: [table.searchId],
			foreignColumns: [searches.id],
			name: "pois_search_id_searches_id_fk"
		}).onDelete("cascade"),
	pgPolicy("Allow authenticated users to select", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() IS NOT NULL)` }),
]);

export const searches = pgTable("searches", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	startLocationAddress: text("start_location_address").notNull(),
	startLocationLat: text("start_location_lat").notNull(),
	startLocationLng: text("start_location_lng").notNull(),
	endLocationAddress: text("end_location_address").notNull(),
	endLocationLat: text("end_location_lat").notNull(),
	endLocationLng: text("end_location_lng").notNull(),
	midpointLat: text("midpoint_lat").notNull(),
	midpointLng: text("midpoint_lng").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("searches_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	pgPolicy("Users can delete their own searches.", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`((( SELECT auth.uid() AS uid))::text = user_id)` }),
	pgPolicy("Users can insert searches.", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Users can select their own searches.", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("Users can update their own searches.", { as: "permissive", for: "update", to: ["authenticated"] }),
]);

export const locations = pgTable("locations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	name: text().notNull(),
	address: text().notNull(),
	latitude: text().notNull(),
	longitude: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("locations_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	pgPolicy("delete_policy", { as: "permissive", for: "delete", to: ["public"], using: sql`(auth.uid() IS NOT NULL)` }),
	pgPolicy("insert_policy", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("select_policy", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("update_policy", { as: "permissive", for: "update", to: ["public"] }),
]);

export const todos = pgTable("todos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	content: text().notNull(),
	completed: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	pgPolicy("Users can delete their own todos.", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`((( SELECT auth.uid() AS uid))::text = user_id)` }),
	pgPolicy("Users can insert todos.", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Users can select their own todos.", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("Users can update their own todos.", { as: "permissive", for: "update", to: ["authenticated"] }),
]);

export const profiles = pgTable("profiles", {
	userId: text("user_id").primaryKey().notNull(),
	membership: membershipEnum().default('starter'),
	stripeCustomerId: text("stripe_customer_id"),
	stripeSubscriptionId: text("stripe_subscription_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	email: text(),
	username: varchar({ length: 50 }),
	stripePriceId: text("stripe_price_id"),
	seatCount: integer("seat_count").default(1),
}, (table) => [
	unique("profiles_stripe_customer_id_unique").on(table.stripeCustomerId),
	unique("profiles_stripe_subscription_id_unique").on(table.stripeSubscriptionId),
	pgPolicy("Users can delete their own profiles.", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`((( SELECT auth.uid() AS uid))::text = user_id)` }),
	pgPolicy("Users can insert profiles.", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Users can select their own profiles.", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("Users can update their own profiles.", { as: "permissive", for: "update", to: ["authenticated"] }),
]);
