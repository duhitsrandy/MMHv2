import { pgTable, index, uuid, text, timestamp, integer, json, foreignKey, boolean, unique, varchar, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const membershipEnum = pgEnum("membership_enum", ['starter', 'plus', 'pro', 'business'])
export const poiType = pgEnum("poi_type", ['restaurant', 'cafe', 'park', 'bar', 'library', 'other'])


export const searches = pgTable("searches", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	startLocationAddress: text("start_location_address"),
	startLocationLat: text("start_location_lat"),
	startLocationLng: text("start_location_lng"),
	endLocationAddress: text("end_location_address"),
	endLocationLat: text("end_location_lat"),
	endLocationLng: text("end_location_lng"),
	midpointLat: text("midpoint_lat"),
	midpointLng: text("midpoint_lng"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	originCount: integer("origin_count").default(2),
	searchMetadata: json("search_metadata"),
}, (table) => [
	index("searches_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

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
]);

export const todos = pgTable("todos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	content: text().notNull(),
	completed: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

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
]);

export const searchOrigins = pgTable("search_origins", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	searchId: uuid("search_id").notNull(),
	orderIndex: integer("order_index").notNull(),
	address: text().notNull(),
	latitude: text().notNull(),
	longitude: text().notNull(),
	displayName: text("display_name"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("search_origins_order_idx").using("btree", table.searchId.asc().nullsLast().op("int4_ops"), table.orderIndex.asc().nullsLast().op("int4_ops")),
	index("search_origins_search_id_idx").using("btree", table.searchId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.searchId],
			foreignColumns: [searches.id],
			name: "search_origins_search_id_searches_id_fk"
		}).onDelete("cascade"),
]);
