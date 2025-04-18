# Database Schema Documentation

## Overview
The Meet Me Halfway application uses Supabase with PostgreSQL and Drizzle ORM for data storage. The database schema includes tables for user profiles, search history, points of interest (POIs), and saved locations.

## Schema Definitions

### 1. User Profiles (`db/schema/profiles-schema.ts`)

#### Profile Table
```typescript
import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const membershipEnum = pgEnum("membership", ["free", "pro"])

export const profilesTable = pgTable("profiles", {
  userId: text("user_id").primaryKey().notNull(),
  membership: membershipEnum("membership").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})
```

#### Profile Types
```typescript
export type InsertProfile = typeof profilesTable.$inferInsert
export type SelectProfile = typeof profilesTable.$inferSelect
```

### 2. Search History (`db/schema/searches-schema.ts`)

#### Search Table
```typescript
import {
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core"

export const searchesTable = pgTable("searches", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), // Foreign key relation implied, needs explicit definition if desired
  startLocationAddress: text("start_location_address").notNull(),
  startLocationLat: text("start_location_lat").notNull(),
  startLocationLng: text("start_location_lng").notNull(),
  endLocationAddress: text("end_location_address").notNull(),
  endLocationLat: text("end_location_lat").notNull(),
  endLocationLng: text("end_location_lng").notNull(),
  midpointLat: text("midpoint_lat").notNull(),
  midpointLng: text("midpoint_lng").notNull(),
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
```

#### Search Types
```typescript
export type InsertSearch = typeof searchesTable.$inferInsert
export type SelectSearch = typeof searchesTable.$inferSelect
```

### 3. Points of Interest (`db/schema/pois-schema.ts`)

#### POI Table
```typescript
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { searchesTable } from "./searches-schema" // Assuming relative path is correct

export const poiTypeEnum = pgEnum("poi_type", [
  "restaurant",
  "cafe",
  "park",
  "bar",
  "library",
  "other"
])

export const poisTable = pgTable("pois", {
  id: uuid("id").defaultRandom().primaryKey(),
  searchId: uuid("search_id")
    .references(() => searchesTable.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  type: poiTypeEnum("type").notNull(),
  travelTimeFromStart: text("travel_time_from_start"), // Note: Stored as text
  travelTimeFromEnd: text("travel_time_from_end"),     // Note: Stored as text
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})
```

#### POI Types
```typescript
export type InsertPoi = typeof poisTable.$inferInsert
export type SelectPoi = typeof poisTable.$inferSelect
```

### 4. Locations (`db/schema/locations-schema.ts`)

#### Location Table
```typescript
import {
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core"

export const locationsTable = pgTable("locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), // Foreign key relation implied, needs explicit definition if desired
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
}, (table) => {
  return {
    userIdx: index("locations_user_id_idx").on(table.userId),
  }
})
```

#### Location Types
```typescript
export type InsertLocation = typeof locationsTable.$inferInsert
export type SelectLocation = typeof locationsTable.$inferSelect
```

## Relationships

### 1. User Profile Relationships
- One-to-many with `searches` (implied by `searches.userId`)
- One-to-many with saved `locations` (implied by `locations.userId`)
- One-to-one relationship with Stripe customer data (`stripeCustomerId`, `stripeSubscriptionId`)

### 2. Search Relationships
- Many-to-one with user profile (implied by `searches.userId`)
- One-to-many with `pois` (explicit via `pois.searchId` foreign key with cascade delete)

### 3. POI Relationships
- Many-to-one with `searches` (explicit via `pois.searchId` foreign key with cascade delete)
- Contains location data (latitude, longitude) and travel time estimates (text format).

### 4. Location Relationships
- Many-to-one with user profile (implied by `locations.userId`)
- Contains geocoded location data (latitude, longitude).

## Indexes

### 1. Profile Indexes
- Primary key on `user_id`.
- Implicit indexes might exist on `stripe_customer_id` depending on Supabase/Postgres defaults.

### 2. Search Indexes
- Primary key on `id`.
- Index `searches_user_id_idx` on `user_id`.

### 3. POI Indexes
- Primary key on `id`.
- Foreign key constraint on `search_id` likely creates an index automatically.

### 4. Location Indexes
- Primary key on `id`.
- Index `locations_user_id_idx` on `user_id`.

*Note: Explicit `CREATE INDEX` statements shown in the previous version of this document are not present in the Drizzle schema definitions. Drizzle and the underlying database may create indexes automatically for primary and foreign keys.*

## Data Types

### 1. Coordinate Storage
- Latitude and Longitude are stored as `text` type. Consider changing to `numeric` or `double precision` for potential performance benefits in calculations, or `geography`/`geometry` types using PostGIS if spatial queries are needed.

### 2. Travel Times (POIs)
- `travelTimeFromStart` and `travelTimeFromEnd` are stored as `text`. Consider changing to `integer` (representing seconds or minutes) or `interval` type for easier calculations.

### 3. Enums
- `membership`: ["free", "pro"]
- `poi_type`: ["restaurant", "cafe", "park", "bar", "library", "other"]

### 4. UUIDs
- Primary keys (`id`) for `searches`, `pois`, and `locations` tables are UUIDs with default random generation.

## Best Practices

### 1. Schema Design
- Use appropriate data types (re-evaluate `text` for coordinates and travel times).
- Define explicit foreign key relationships in Drizzle schema for clarity and potential automatic index creation (e.g., for `searches.userId` and `locations.userId` referencing `profiles.userId`).
- Add necessary indexes explicitly if not automatically created or if specific query patterns require them.
- Include timestamps (`createdAt`, `updatedAt`) with automatic updates.

### 2. Data Integrity
- Use foreign key constraints (`pois.searchId` has one defined).
- Consider adding `NOT NULL` constraints where appropriate.
- Validate data format before insertion, especially for `text`-based coordinates and travel times.

### 3. Performance
- Optimize indexes based on query patterns.
- Use appropriate data types.
- Implement pagination for large result sets.
- Cache frequently accessed data where applicable.

## Migration Guidelines

### 1. Creating Migrations
```bash
npm run db:generate
```
*This command generates SQL migration files based on changes in your Drizzle schema files.*

### 2. Applying Migrations
```bash
npm run db:migrate
```
*This command applies pending migration files to your database.*

### 3. Migration Best Practices
- Test migrations thoroughly in a development or staging environment.
- Back up your production database before applying migrations.
- Review generated SQL migration files before applying.
- Document schema changes within migration files or related documentation.

## Environment Variables

```env
# Database Configuration (Example placeholders)
DATABASE_URL=postgresql://user:password@host:port/database
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Keep this secure, not in frontend env
```

This documentation provides a comprehensive guide to the database schema in the Meet Me Halfway application, based on the Drizzle schema definitions. 