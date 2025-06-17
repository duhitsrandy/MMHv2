import {
  pgTable,
  text,
  timestamp,
  uuid,
  index,
  integer,
  json,
} from "drizzle-orm/pg-core"

export const searchesTable = pgTable("searches", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  // Keep legacy fields for backward compatibility but make them optional
  startLocationAddress: text("start_location_address"),
  startLocationLat: text("start_location_lat"),
  startLocationLng: text("start_location_lng"),
  endLocationAddress: text("end_location_address"),
  endLocationLat: text("end_location_lat"),
  endLocationLng: text("end_location_lng"),
  midpointLat: text("midpoint_lat"),
  midpointLng: text("midpoint_lng"),
  // New fields for multi-origin searches
  originCount: integer("origin_count").default(2),
  searchMetadata: json("search_metadata"), // Store additional search params like poi types, radius, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
}, (table) => {
  return {
    userIdx: index("searches_user_id_idx").on(table.userId),
  }
})

// New table for storing multiple origins per search
export const searchOriginsTable = pgTable("search_origins", {
  id: uuid("id").defaultRandom().primaryKey(),
  searchId: uuid("search_id")
    .references(() => searchesTable.id, { onDelete: "cascade" })
    .notNull(),
  orderIndex: integer("order_index").notNull(), // 0, 1, 2, etc. for ordering
  address: text("address").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  displayName: text("display_name"), // Store the geocoded display name
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    searchIdx: index("search_origins_search_id_idx").on(table.searchId),
    orderIdx: index("search_origins_order_idx").on(table.searchId, table.orderIndex),
  }
})

export type InsertSearch = typeof searchesTable.$inferInsert
export type SelectSearch = typeof searchesTable.$inferSelect
export type InsertSearchOrigin = typeof searchOriginsTable.$inferInsert
export type SelectSearchOrigin = typeof searchOriginsTable.$inferSelect
